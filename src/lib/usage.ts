import { supabase } from "./supabase";

export async function recordUsage(
  type: "ai_message" | "voice_input" | "connector_call" | "plugin_action",
  model?: string,
  tokens?: number
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("usage_records").insert({
    user_id: user.id,
    type,
    model: model ?? null,
    tokens_used: tokens ?? 0,
  });
}

export async function checkUsageLimit(
  type: string
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { allowed: false, remaining: 0, limit: 0 };

  // Get subscription
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();
  const plan = sub?.plan ?? "free";

  // Get limits
  const { data: limits } = await supabase
    .from("plan_limits")
    .select("*")
    .eq("plan", plan)
    .single();
  if (!limits) return { allowed: true, remaining: 999, limit: 999 };

  // Get usage
  const { data: usage } = await supabase
    .from("monthly_usage")
    .select("*")
    .eq("user_id", user.id)
    .single();

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

  const limit = (limits as Record<string, unknown>)[limitKey] as number;
  const used = ((usage as Record<string, unknown> | null)?.[usageKey] as number) ?? 0;

  if (limit === -1) return { allowed: true, remaining: 999999, limit: -1 };

  return { allowed: used < limit, remaining: Math.max(0, limit - used), limit };
}
