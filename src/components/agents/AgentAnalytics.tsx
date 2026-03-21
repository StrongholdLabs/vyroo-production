import {
  Activity,
  CheckCircle2,
  Clock,
  Coins,
  Cpu,
  TrendingUp,
  XCircle,
  Pause,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Mock analytics data ───

interface RunSummary {
  id: string;
  title: string;
  status: "completed" | "failed" | "running" | "cancelled";
  model: string;
  tokens_used: number;
  duration_ms: number;
  started_at: string;
}

interface AnalyticsData {
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  success_rate: number;
  avg_completion_time_ms: number;
  total_tokens: number;
  estimated_cost: number;
  model_usage: { model: string; count: number; percentage: number }[];
  recent_runs: RunSummary[];
}

const mockAnalytics: AnalyticsData = {
  total_runs: 47,
  successful_runs: 41,
  failed_runs: 4,
  success_rate: 87.2,
  avg_completion_time_ms: 34500,
  total_tokens: 892400,
  estimated_cost: 12.85,
  model_usage: [
    { model: "claude-sonnet-4", count: 28, percentage: 59.6 },
    { model: "gpt-4o", count: 12, percentage: 25.5 },
    { model: "gemini-pro", count: 5, percentage: 10.6 },
    { model: "llama-3", count: 2, percentage: 4.3 },
  ],
  recent_runs: [
    {
      id: "run-1",
      title: "Research AI SaaS landscape",
      status: "completed",
      model: "claude-sonnet-4",
      tokens_used: 24500,
      duration_ms: 42000,
      started_at: "2026-03-20T14:30:00Z",
    },
    {
      id: "run-2",
      title: "Generate API documentation",
      status: "completed",
      model: "gpt-4o",
      tokens_used: 18200,
      duration_ms: 28000,
      started_at: "2026-03-20T10:15:00Z",
    },
    {
      id: "run-3",
      title: "Analyze competitor pricing",
      status: "failed",
      model: "claude-sonnet-4",
      tokens_used: 8400,
      duration_ms: 15000,
      started_at: "2026-03-19T16:45:00Z",
    },
    {
      id: "run-4",
      title: "Build landing page wireframe",
      status: "running",
      model: "claude-sonnet-4",
      tokens_used: 12300,
      duration_ms: 0,
      started_at: "2026-03-21T09:00:00Z",
    },
    {
      id: "run-5",
      title: "Extract product data from website",
      status: "completed",
      model: "gemini-pro",
      tokens_used: 15800,
      duration_ms: 38000,
      started_at: "2026-03-18T11:20:00Z",
    },
  ],
};

// ─── Helpers ───

function formatDuration(ms: number): string {
  if (ms === 0) return "In progress";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  completed: { icon: CheckCircle2, color: "text-[hsl(var(--success))]", label: "Completed" },
  failed: { icon: XCircle, color: "text-destructive", label: "Failed" },
  running: { icon: Loader2, color: "text-primary", label: "Running" },
  cancelled: { icon: Pause, color: "text-muted-foreground", label: "Cancelled" },
};

const modelColors = [
  "bg-primary",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-orange-500",
];

// ─── Component ───

interface AgentAnalyticsProps {
  agentId?: string;
  className?: string;
}

export function AgentAnalytics({ className }: AgentAnalyticsProps) {
  const data = mockAnalytics;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Top stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total runs */}
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-primary" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              Total Runs
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{data.total_runs}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {data.successful_runs} successful, {data.failed_runs} failed
          </p>
        </div>

        {/* Success rate */}
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-[hsl(var(--success))]" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              Success Rate
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{data.success_rate}%</p>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-[hsl(var(--success))] transition-all"
              style={{ width: `${data.success_rate}%` }}
            />
          </div>
        </div>

        {/* Avg completion time */}
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-amber-400" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              Avg Time
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {formatDuration(data.avg_completion_time_ms)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">per run</p>
        </div>

        {/* Cost */}
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur p-4">
          <div className="flex items-center gap-2 mb-2">
            <Coins size={14} className="text-emerald-400" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              Est. Cost
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            ${data.estimated_cost.toFixed(2)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {formatTokens(data.total_tokens)} tokens used
          </p>
        </div>
      </div>

      {/* Bottom row: Model usage + Recent runs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Model usage */}
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur p-4">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={14} className="text-primary" />
            <span className="text-xs font-medium text-foreground">Model Usage</span>
          </div>
          <div className="space-y-3">
            {data.model_usage.map((model, idx) => (
              <div key={model.model}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-foreground">{model.model}</span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {model.count} runs ({model.percentage}%)
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", modelColors[idx % modelColors.length])}
                    style={{ width: `${model.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent runs */}
        <div className="md:col-span-2 rounded-xl border border-border/50 bg-card/50 backdrop-blur p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} className="text-primary" />
            <span className="text-xs font-medium text-foreground">Recent Runs</span>
          </div>
          <div className="space-y-2">
            {data.recent_runs.map((run) => {
              const status = statusConfig[run.status] ?? statusConfig.completed;
              const StatusIcon = status.icon;

              return (
                <div
                  key={run.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <StatusIcon
                    size={14}
                    className={cn(status.color, run.status === "running" && "animate-spin")}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{run.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {run.model} &middot; {formatTokens(run.tokens_used)} tokens
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className={cn(
                        "inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                        run.status === "completed" && "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
                        run.status === "failed" && "bg-destructive/10 text-destructive",
                        run.status === "running" && "bg-primary/10 text-primary",
                        run.status === "cancelled" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {status.label}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {run.status === "running" ? "In progress" : formatDuration(run.duration_ms)}
                      {" \u00B7 "}
                      {timeAgo(run.started_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
