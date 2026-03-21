import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Zap,
  Mic,
  ArrowUpRight,
  Crown,
  Check,
} from "lucide-react";
import { useSubscription, useUsage, usePlanLimits } from "@/hooks/useBilling";

// ─── Usage progress bar ───

function UsageBar({
  label,
  icon,
  used,
  limit,
}: {
  label: string;
  icon: React.ReactNode;
  used: number;
  limit: number;
}) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 5 : limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const isWarning = !isUnlimited && percentage >= 80;
  const isDanger = !isUnlimited && percentage >= 95;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon}
          {label}
        </div>
        <span className="text-xs tabular-nums text-foreground font-medium">
          {used.toLocaleString()} / {isUnlimited ? "Unlimited" : limit.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-accent overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isDanger
              ? "bg-red-500"
              : isWarning
                ? "bg-amber-500"
                : "bg-primary"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ─── Plan comparison ───

const planFeatures = [
  { name: "AI Messages", free: "50/mo", pro: "2,000/mo", team: "10,000/mo", enterprise: "Unlimited" },
  { name: "Voice Minutes", free: "5/mo", pro: "60/mo", team: "300/mo", enterprise: "Unlimited" },
  { name: "Connectors", free: "2", pro: "10", team: "50", enterprise: "Unlimited" },
  { name: "Plugins", free: "1", pro: "5", team: "20", enterprise: "Unlimited" },
  { name: "Priority Support", free: false, pro: true, team: true, enterprise: true },
  { name: "Custom Skills", free: false, pro: true, team: true, enterprise: true },
  { name: "Team Workspace", free: false, pro: false, team: true, enterprise: true },
  { name: "SSO / SAML", free: false, pro: false, team: true, enterprise: true },
];

// ─── Main component ───

export default function BillingSettings() {
  const navigate = useNavigate();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: usage, isLoading: usageLoading } = useUsage();
  const { data: limits, isLoading: limitsLoading } = usePlanLimits();

  const isLoading = subLoading || usageLoading || limitsLoading;

  const plan = subscription?.plan ?? "free";
  const status = subscription?.status ?? "active";
  const periodEnd = subscription?.current_period_end;

  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    trialing: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    past_due: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    canceled: "bg-red-500/15 text-red-400 border-red-500/30",
    incomplete: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-accent/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current plan & status */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <Crown size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{planLabel} Plan</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border ${statusColors[status] ?? statusColors.active}`}
                >
                  {status}
                </span>
                {subscription?.cancel_at_period_end && (
                  <span className="text-[10px] text-amber-400">Cancels at period end</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Next billing date */}
        {periodEnd && (
          <p className="text-xs text-muted-foreground mb-4">
            Next billing date:{" "}
            <span className="text-foreground font-medium">
              {new Date(periodEnd).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </p>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              window.open("https://billing.stripe.com/p/login/placeholder", "_blank")
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-foreground border border-border hover:bg-accent/80 transition-colors"
          >
            <CreditCard size={13} />
            Manage Subscription
            <ArrowUpRight size={11} />
          </button>
          {plan !== "enterprise" && (
            <button
              onClick={() => navigate("/pricing")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors"
            >
              <Zap size={13} />
              Upgrade
            </button>
          )}
        </div>
      </div>

      {/* Usage section */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Current Usage</h3>
        <div className="space-y-4">
          <UsageBar
            label="AI Messages"
            icon={<Zap size={12} />}
            used={usage?.messages_used ?? 0}
            limit={limits?.monthly_messages ?? 50}
          />
          <UsageBar
            label="Voice Minutes"
            icon={<Mic size={12} />}
            used={usage?.voice_minutes_used ?? 0}
            limit={limits?.monthly_voice_minutes ?? 5}
          />
        </div>
        {usage?.total_tokens != null && usage.total_tokens > 0 && (
          <p className="text-[11px] text-muted-foreground mt-3">
            Total tokens used this month: {usage.total_tokens.toLocaleString()}
          </p>
        )}
      </div>

      {/* Plan comparison mini-table */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Plan Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Feature</th>
                <th
                  className={`text-center py-2 px-2 font-medium ${plan === "free" ? "text-primary" : "text-muted-foreground"}`}
                >
                  Free
                </th>
                <th
                  className={`text-center py-2 px-2 font-medium ${plan === "pro" ? "text-primary" : "text-muted-foreground"}`}
                >
                  Pro
                </th>
                <th
                  className={`text-center py-2 px-2 font-medium ${plan === "team" ? "text-primary" : "text-muted-foreground"}`}
                >
                  Team
                </th>
                <th
                  className={`text-center py-2 px-2 font-medium ${plan === "enterprise" ? "text-primary" : "text-muted-foreground"}`}
                >
                  Enterprise
                </th>
              </tr>
            </thead>
            <tbody>
              {planFeatures.map((feature) => (
                <tr key={feature.name} className="border-b border-border/50">
                  <td className="py-2 pr-4 text-muted-foreground">{feature.name}</td>
                  {(["free", "pro", "team", "enterprise"] as const).map((tier) => {
                    const val = feature[tier];
                    const isCurrentTier = plan === tier;
                    return (
                      <td
                        key={tier}
                        className={`text-center py-2 px-2 ${isCurrentTier ? "text-foreground font-medium" : "text-muted-foreground"}`}
                      >
                        {typeof val === "boolean" ? (
                          val ? (
                            <Check size={13} className="inline text-emerald-400" />
                          ) : (
                            <span className="text-muted-foreground/40">&mdash;</span>
                          )
                        ) : (
                          val
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
