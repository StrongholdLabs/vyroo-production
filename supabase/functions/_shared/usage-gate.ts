// Usage Gate: checks message limits before allowing a request
// Enforces per-plan rate limits (free = daily, paid = monthly)

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface UsageGateResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  plan: string;
}

// --- Plan limits ---

interface PlanLimits {
  maxMessages: number;
  /** "day" for free tier, "month" for paid tiers */
  period: "day" | "month";
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: { maxMessages: 25, period: "day" },
  pro: { maxMessages: 1000, period: "month" },
  team: { maxMessages: 5000, period: "month" },
  enterprise: { maxMessages: Infinity, period: "month" },
};

/**
 * Check whether the user is allowed to send another message based on their plan limits.
 *
 * Counts user-role messages in the current billing period (day or month) and
 * compares against the plan limit.
 *
 * @param userId  The authenticated user's ID
 * @param supabaseClient  A Supabase client scoped to the user (RLS-safe)
 * @returns UsageGateResult with allowed status, remaining count, limit, and plan name
 */
export async function checkUsageGate(
  userId: string,
  supabaseClient: SupabaseClient
): Promise<UsageGateResult> {
  // 1. Determine user's plan
  const plan = await getUserPlan(userId, supabaseClient);
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

  // Enterprise = unlimited
  if (limits.maxMessages === Infinity) {
    return { allowed: true, remaining: Infinity, limit: Infinity, plan };
  }

  // 2. Count messages in the current period
  const periodStart = getPeriodStart(limits.period);
  const messageCount = await countUserMessages(userId, supabaseClient, periodStart);

  const remaining = Math.max(0, limits.maxMessages - messageCount);

  return {
    allowed: messageCount < limits.maxMessages,
    remaining,
    limit: limits.maxMessages,
    plan,
  };
}

// --- Helpers ---

/**
 * Look up the user's plan. Checks the profiles table first, then falls back
 * to a plan_limits table if it exists. Defaults to "free" if nothing is found.
 */
async function getUserPlan(userId: string, supabase: SupabaseClient): Promise<string> {
  // Try profiles table (most likely location)
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  if (profile?.plan) {
    return profile.plan;
  }

  // Fallback: check a dedicated plan_limits or subscriptions table
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (subscription?.plan) {
    return subscription.plan;
  }

  return "free";
}

/**
 * Get the ISO timestamp for the start of the current billing period.
 */
function getPeriodStart(period: "day" | "month"): string {
  const now = new Date();

  if (period === "day") {
    // Start of today (UTC)
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  }

  // Start of current month (UTC)
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/**
 * Count user-sent messages since a given timestamp.
 * Only counts role='user' messages to avoid double-counting assistant replies.
 */
async function countUserMessages(
  userId: string,
  supabase: SupabaseClient,
  since: string
): Promise<number> {
  // Use a count query for efficiency — avoids fetching row data
  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("role", "user")
    .gte("created_at", since)
    // Messages table doesn't have user_id directly — join through conversations
    // Since RLS is scoped to the user, this will only count their messages
    ;

  if (error) {
    // If the query fails (e.g., table structure issues), allow the request
    // to avoid blocking users due to infrastructure problems
    console.error("Usage gate count error:", error);
    return 0;
  }

  return count ?? 0;
}
