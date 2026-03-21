import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url.length > 0 && url !== "undefined";
};

// ─── Types ───

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: "free" | "pro" | "team" | "enterprise";
  status: "active" | "trialing" | "past_due" | "canceled" | "incomplete";
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface MonthlyUsage {
  user_id: string;
  messages_used: number;
  voice_minutes_used: number;
  total_tokens: number;
}

export interface PlanLimits {
  plan: string;
  monthly_messages: number;
  monthly_voice_minutes: number;
  max_connectors: number;
  max_plugins: number;
  models_available: string[];
}

// ─── Default fallback data ───

const DEFAULT_SUBSCRIPTION: Subscription = {
  id: "",
  user_id: "",
  stripe_customer_id: null,
  stripe_subscription_id: null,
  plan: "free",
  status: "active",
  current_period_start: null,
  current_period_end: null,
  cancel_at_period_end: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEFAULT_USAGE: MonthlyUsage = {
  user_id: "",
  messages_used: 0,
  voice_minutes_used: 0,
  total_tokens: 0,
};

const FREE_LIMITS: PlanLimits = {
  plan: "free",
  monthly_messages: 750, // ~25/day × 30 days
  monthly_voice_minutes: 5,
  max_connectors: 2,
  max_plugins: 3,
  models_available: ["claude-haiku-3", "gpt-4o-mini", "gemini-2.0-flash"],
};

// ─── Fetch current user's subscription ───

export function useSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Subscription> => {
      if (!isSupabaseConfigured()) {
        return { ...DEFAULT_SUBSCRIPTION, user_id: user!.id };
      }

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      if (error) {
        // No subscription row yet — return free defaults
        if (error.code === "PGRST116") {
          return { ...DEFAULT_SUBSCRIPTION, user_id: user!.id };
        }
        throw error;
      }

      return data as Subscription;
    },
  });
}

// ─── Fetch current month's usage ───

export function useUsage() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["usage", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<MonthlyUsage> => {
      if (!isSupabaseConfigured()) {
        return { ...DEFAULT_USAGE, user_id: user!.id };
      }

      const { data, error } = await supabase
        .from("monthly_usage")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      if (error) {
        // No usage records yet this month
        if (error.code === "PGRST116") {
          return { ...DEFAULT_USAGE, user_id: user!.id };
        }
        throw error;
      }

      return data as MonthlyUsage;
    },
  });
}

// ─── Fetch plan limits for current plan ───

export function usePlanLimits(plan?: string) {
  const { data: subscription } = useSubscription();
  const currentPlan = plan ?? subscription?.plan ?? "free";

  return useQuery({
    queryKey: ["plan_limits", currentPlan],
    queryFn: async (): Promise<PlanLimits> => {
      if (!isSupabaseConfigured()) {
        return FREE_LIMITS;
      }

      const { data, error } = await supabase
        .from("plan_limits")
        .select("*")
        .eq("plan", currentPlan)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return FREE_LIMITS;
        }
        throw error;
      }

      return data as PlanLimits;
    },
  });
}

// ─── Check if a usage type is within limits ───

export function useCheckLimit(type: string) {
  const { data: usage } = useUsage();
  const { data: limits } = usePlanLimits();

  if (!usage || !limits) {
    return { allowed: true, remaining: 0, limit: 0, loading: true };
  }

  const limitKey =
    type === "ai_message"
      ? "monthly_messages"
      : type === "voice_input"
        ? "monthly_voice_minutes"
        : "monthly_messages";
  const usageKey =
    type === "ai_message"
      ? "messages_used"
      : type === "voice_input"
        ? "voice_minutes_used"
        : "messages_used";

  const limit = limits[limitKey];
  const used = usage[usageKey] ?? 0;

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, remaining: 999999, limit: -1, loading: false };
  }

  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
    limit,
    loading: false,
  };
}

// ─── Price IDs for Stripe ───

export const PRICE_IDS = {
  pro: {
    monthly: "price_pro_monthly",
    annual: "price_pro_annual",
  },
  team: {
    monthly: "price_team_monthly",
    annual: "price_team_annual",
  },
} as const;

// ─── Create a Stripe Checkout session ───

export function useCheckout() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      priceId,
      planId,
    }: {
      priceId: string;
      planId: "pro" | "team";
    }): Promise<{ url: string }> => {
      if (!isSupabaseConfigured() || !user) {
        throw new Error("Not configured or not authenticated");
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error("No active session");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            priceId,
            planId,
            successUrl: `${window.location.origin}/dashboard?checkout=success`,
            cancelUrl: `${window.location.origin}/pricing?checkout=canceled`,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Checkout failed" }));
        throw new Error(err.error ?? "Failed to create checkout session");
      }

      return response.json();
    },
  });
}

// ─── Create a Stripe Customer Portal session ───

export function useManageSubscription() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (): Promise<{ url: string }> => {
      if (!isSupabaseConfigured() || !user) {
        throw new Error("Not configured or not authenticated");
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error("No active session");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            returnUrl: `${window.location.origin}/dashboard`,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Portal creation failed" }));
        throw new Error(err.error ?? "Failed to create portal session");
      }

      return response.json();
    },
  });
}

// ─── Record a usage event ───

export function useRecordUsage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      type,
      model,
      tokens,
    }: {
      type: "ai_message" | "voice_input" | "connector_call" | "plugin_action";
      model?: string;
      tokens?: number;
    }) => {
      if (!isSupabaseConfigured() || !user) return;

      const { error } = await supabase.from("usage_records").insert({
        user_id: user.id,
        type,
        model: model ?? null,
        tokens_used: tokens ?? 0,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usage"] });
    },
  });
}
