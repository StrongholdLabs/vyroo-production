// Supabase Edge Function: Revenue Optimization
// Designed to run as a cron job. Scans users for revenue optimization
// opportunities and logs events to the revenue_events table.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OptimizationResult {
  step: string;
  usersFound: number;
  eventsCreated: number;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role key for admin-level access (cron jobs don't have user auth)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results: OptimizationResult[] = [];
    const now = new Date();

    // ─── 1. Trial Expiry Nudges ───────────────────────────────────────
    // Find free-plan users whose accounts are >7 days old and haven't upgraded
    try {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get free-plan users created >7 days ago
      const { data: freeUsers, error: freeErr } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("plan", "free")
        .eq("status", "active");

      if (freeErr) throw freeErr;

      // Filter to users whose auth account was created >7 days ago
      const trialNudgeUsers: string[] = [];
      for (const sub of freeUsers || []) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("created_at")
          .eq("id", sub.user_id)
          .single();

        if (profile && new Date(profile.created_at) < new Date(sevenDaysAgo)) {
          // Check we haven't already nudged them in the last 7 days
          const { count } = await supabase
            .from("revenue_events")
            .select("*", { count: "exact", head: true })
            .eq("user_id", sub.user_id)
            .eq("event_type", "trial_expiry_nudge")
            .gte("created_at", sevenDaysAgo);

          if (!count || count === 0) {
            trialNudgeUsers.push(sub.user_id);
          }
        }
      }

      // Insert events
      if (trialNudgeUsers.length > 0) {
        const events = trialNudgeUsers.map((user_id) => ({
          user_id,
          event_type: "trial_expiry_nudge",
          metadata: {
            reason: "Free plan user >7 days without upgrade",
            flagged_at: now.toISOString(),
          },
        }));
        await supabase.from("revenue_events").insert(events);
      }

      results.push({
        step: "trial_expiry_nudges",
        usersFound: trialNudgeUsers.length,
        eventsCreated: trialNudgeUsers.length,
      });
    } catch (error) {
      results.push({
        step: "trial_expiry_nudges",
        usersFound: 0,
        eventsCreated: 0,
        error: String(error),
      });
    }

    // ─── 2. Usage-Based Upgrade Prompts ───────────────────────────────
    // Find users approaching plan limits (>80% usage)
    try {
      const { data: planLimits, error: limitsErr } = await supabase
        .from("plan_limits")
        .select("*");

      if (limitsErr) throw limitsErr;

      const limitsMap = new Map(
        (planLimits || []).map((pl: any) => [pl.plan, pl])
      );

      // Get all active subscriptions (exclude enterprise which has unlimited = -1)
      const { data: activeSubs, error: subsErr } = await supabase
        .from("subscriptions")
        .select("user_id, plan")
        .eq("status", "active")
        .neq("plan", "enterprise");

      if (subsErr) throw subsErr;

      const upgradeUsers: string[] = [];
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      for (const sub of activeSubs || []) {
        const limits = limitsMap.get(sub.plan) as any;
        if (!limits || limits.monthly_messages < 0) continue;

        // Count messages this month
        const { count: msgCount } = await supabase
          .from("usage_records")
          .select("*", { count: "exact", head: true })
          .eq("user_id", sub.user_id)
          .eq("type", "ai_message")
          .gte("created_at", monthStart);

        const usagePercent = (msgCount || 0) / limits.monthly_messages;

        if (usagePercent >= 0.8) {
          // Check we haven't already prompted them this month
          const { count: existingCount } = await supabase
            .from("revenue_events")
            .select("*", { count: "exact", head: true })
            .eq("user_id", sub.user_id)
            .eq("event_type", "usage_upgrade_prompt")
            .gte("created_at", monthStart);

          if (!existingCount || existingCount === 0) {
            upgradeUsers.push(sub.user_id);

            await supabase.from("revenue_events").insert({
              user_id: sub.user_id,
              event_type: "usage_upgrade_prompt",
              metadata: {
                current_plan: sub.plan,
                messages_used: msgCount,
                message_limit: limits.monthly_messages,
                usage_percent: Math.round(usagePercent * 100),
                flagged_at: now.toISOString(),
              },
            });
          }
        }
      }

      results.push({
        step: "usage_upgrade_prompts",
        usersFound: upgradeUsers.length,
        eventsCreated: upgradeUsers.length,
      });
    } catch (error) {
      results.push({
        step: "usage_upgrade_prompts",
        usersFound: 0,
        eventsCreated: 0,
        error: String(error),
      });
    }

    // ─── 3. Annual Plan Emphasis ──────────────────────────────────────
    // Monthly subscribers active >3 months get an annual discount offer
    try {
      const threeMonthsAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 3,
        now.getDate()
      ).toISOString();

      const { data: monthlySubs, error: monthlyErr } = await supabase
        .from("subscriptions")
        .select("user_id, plan, created_at, stripe_subscription_id")
        .eq("status", "active")
        .in("plan", ["pro", "team"])
        .lte("created_at", threeMonthsAgo);

      if (monthlyErr) throw monthlyErr;

      const annualUsers: string[] = [];
      const thirtyDaysAgo = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      for (const sub of monthlySubs || []) {
        // Check we haven't offered in the last 30 days
        const { count } = await supabase
          .from("revenue_events")
          .select("*", { count: "exact", head: true })
          .eq("user_id", sub.user_id)
          .eq("event_type", "annual_plan_offer")
          .gte("created_at", thirtyDaysAgo);

        if (!count || count === 0) {
          annualUsers.push(sub.user_id);

          await supabase.from("revenue_events").insert({
            user_id: sub.user_id,
            event_type: "annual_plan_offer",
            metadata: {
              current_plan: sub.plan,
              months_active: Math.floor(
                (now.getTime() - new Date(sub.created_at).getTime()) /
                  (30 * 24 * 60 * 60 * 1000)
              ),
              flagged_at: now.toISOString(),
            },
          });
        }
      }

      results.push({
        step: "annual_plan_emphasis",
        usersFound: annualUsers.length,
        eventsCreated: annualUsers.length,
      });
    } catch (error) {
      results.push({
        step: "annual_plan_emphasis",
        usersFound: 0,
        eventsCreated: 0,
        error: String(error),
      });
    }

    // ─── 4. Churn Prevention ──────────────────────────────────────────
    // Pro/team users inactive for 14+ days
    try {
      const fourteenDaysAgo = new Date(
        now.getTime() - 14 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data: paidSubs, error: paidErr } = await supabase
        .from("subscriptions")
        .select("user_id, plan")
        .eq("status", "active")
        .in("plan", ["pro", "team"]);

      if (paidErr) throw paidErr;

      const churnUsers: string[] = [];

      for (const sub of paidSubs || []) {
        // Check last activity via usage_records
        const { data: lastActivity } = await supabase
          .from("usage_records")
          .select("created_at")
          .eq("user_id", sub.user_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const lastActiveAt = lastActivity?.created_at;
        const isInactive =
          !lastActiveAt || new Date(lastActiveAt) < new Date(fourteenDaysAgo);

        if (isInactive) {
          // Check we haven't flagged them in the last 14 days
          const { count } = await supabase
            .from("revenue_events")
            .select("*", { count: "exact", head: true })
            .eq("user_id", sub.user_id)
            .eq("event_type", "churn_prevention")
            .gte("created_at", fourteenDaysAgo);

          if (!count || count === 0) {
            churnUsers.push(sub.user_id);

            await supabase.from("revenue_events").insert({
              user_id: sub.user_id,
              event_type: "churn_prevention",
              metadata: {
                current_plan: sub.plan,
                last_active: lastActiveAt || "never",
                days_inactive: lastActiveAt
                  ? Math.floor(
                      (now.getTime() - new Date(lastActiveAt).getTime()) /
                        (24 * 60 * 60 * 1000)
                    )
                  : null,
                flagged_at: now.toISOString(),
              },
            });
          }
        }
      }

      results.push({
        step: "churn_prevention",
        usersFound: churnUsers.length,
        eventsCreated: churnUsers.length,
      });
    } catch (error) {
      results.push({
        step: "churn_prevention",
        usersFound: 0,
        eventsCreated: 0,
        error: String(error),
      });
    }

    // ─── 5. Overage Tracking ──────────────────────────────────────────
    // Users who exceeded plan limits this billing period
    try {
      const { data: planLimits } = await supabase
        .from("plan_limits")
        .select("*");

      const limitsMap = new Map(
        (planLimits || []).map((pl: any) => [pl.plan, pl])
      );

      const { data: activeSubs } = await supabase
        .from("subscriptions")
        .select("user_id, plan")
        .eq("status", "active")
        .neq("plan", "enterprise");

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const overageUsers: string[] = [];

      for (const sub of activeSubs || []) {
        const limits = limitsMap.get(sub.plan) as any;
        if (!limits || limits.monthly_messages < 0) continue;

        const { count: msgCount } = await supabase
          .from("usage_records")
          .select("*", { count: "exact", head: true })
          .eq("user_id", sub.user_id)
          .eq("type", "ai_message")
          .gte("created_at", monthStart);

        if ((msgCount || 0) > limits.monthly_messages) {
          // Check we haven't logged this overage today
          const todayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          ).toISOString();

          const { count: existingCount } = await supabase
            .from("revenue_events")
            .select("*", { count: "exact", head: true })
            .eq("user_id", sub.user_id)
            .eq("event_type", "overage_warning")
            .gte("created_at", todayStart);

          if (!existingCount || existingCount === 0) {
            overageUsers.push(sub.user_id);

            await supabase.from("revenue_events").insert({
              user_id: sub.user_id,
              event_type: "overage_warning",
              metadata: {
                current_plan: sub.plan,
                messages_used: msgCount,
                message_limit: limits.monthly_messages,
                overage_count: (msgCount || 0) - limits.monthly_messages,
                flagged_at: now.toISOString(),
              },
            });
          }
        }
      }

      results.push({
        step: "overage_tracking",
        usersFound: overageUsers.length,
        eventsCreated: overageUsers.length,
      });
    } catch (error) {
      results.push({
        step: "overage_tracking",
        usersFound: 0,
        eventsCreated: 0,
        error: String(error),
      });
    }

    // ─── Summary ──────────────────────────────────────────────────────
    const totalEvents = results.reduce((sum, r) => sum + r.eventsCreated, 0);
    const hasErrors = results.some((r) => r.error);

    const summary = {
      success: true,
      ran_at: now.toISOString(),
      total_events_created: totalEvents,
      steps: results,
      ...(hasErrors && { warning: "Some steps encountered errors, see individual step results" }),
    };

    console.log("Revenue optimization completed:", JSON.stringify(summary, null, 2));

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Revenue optimization failed:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
