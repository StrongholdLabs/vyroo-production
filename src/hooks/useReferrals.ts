import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url.length > 0 && url !== "undefined";
};

// ─── Types ───

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string | null;
  referral_code: string;
  status: "pending" | "completed" | "rewarded";
  reward_type: string;
  created_at: string;
  completed_at: string | null;
}

export interface ReferralStats {
  pending: number;
  completed: number;
  rewarded: number;
  total: number;
}

// ─── Mock data for when Supabase is not configured ───

const MOCK_REFERRAL_CODE = "abc12345";

const MOCK_STATS: ReferralStats = {
  pending: 2,
  completed: 1,
  rewarded: 0,
  total: 3,
};

// ─── Get or create the user's referral code ───

export function useReferralCode() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["referral_code", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<string> => {
      if (!isSupabaseConfigured()) {
        return MOCK_REFERRAL_CODE;
      }

      // Check if user already has a referral code
      const { data: existing, error: fetchError } = await supabase
        .from("referrals")
        .select("referral_code")
        .eq("referrer_id", user!.id)
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        return existing.referral_code;
      }

      // Generate a new referral code using the database function
      const { data: codeResult, error: codeError } = await supabase
        .rpc("generate_referral_code");

      if (codeError) throw codeError;

      const code = codeResult as string;

      // Insert a new referral row with the generated code
      const { error: insertError } = await supabase
        .from("referrals")
        .insert({
          referrer_id: user!.id,
          referral_code: code,
          status: "pending",
        });

      if (insertError) throw insertError;

      return code;
    },
  });

  return query;
}

// ─── Get referral statistics ───

export function useReferralStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["referral_stats", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ReferralStats> => {
      if (!isSupabaseConfigured()) {
        return MOCK_STATS;
      }

      const { data, error } = await supabase
        .from("referrals")
        .select("status")
        .eq("referrer_id", user!.id);

      if (error) throw error;

      const referrals = data || [];

      const stats: ReferralStats = {
        pending: referrals.filter((r) => r.status === "pending").length,
        completed: referrals.filter((r) => r.status === "completed").length,
        rewarded: referrals.filter((r) => r.status === "rewarded").length,
        total: referrals.length,
      };

      return stats;
    },
  });
}

// ─── Create a new referral invitation ───

export function useCreateReferral() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<Referral> => {
      if (!isSupabaseConfigured() || !user) {
        throw new Error("Not configured or not authenticated");
      }

      // Generate a new referral code
      const { data: codeResult, error: codeError } = await supabase
        .rpc("generate_referral_code");

      if (codeError) throw codeError;

      const code = codeResult as string;

      const { data, error } = await supabase
        .from("referrals")
        .insert({
          referrer_id: user.id,
          referral_code: code,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      return data as Referral;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referral_stats"] });
      queryClient.invalidateQueries({ queryKey: ["referral_code"] });
    },
  });
}
