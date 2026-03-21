import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Users,
  CreditCard,
  DollarSign,
  MessageSquare,
  Bot,
  TrendingUp,
  Activity,
  UserPlus,
  Crown,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

// ─── Admin email check ───

const ADMIN_EMAILS = ["r.mangal@example.com", "admin@vyroo.ai"];

function useIsAdmin() {
  const { user } = useAuth();
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email);
}

// ─── Mock data ───

const mockStats = {
  totalUsers: 1_247,
  activeSubscriptions: { pro: 189, team: 42, enterprise: 3 },
  monthlyRevenue: 8_435,
  totalMessages: 284_519,
  totalAgentRuns: 3_872,
  newUsersThisWeek: 78,
};

const mockPopularAgents = [
  { name: "Research Assistant", runs: 1_204, growth: 12 },
  { name: "Code Reviewer", runs: 892, growth: 8 },
  { name: "Content Writer", runs: 654, growth: 22 },
  { name: "Data Analyst", runs: 512, growth: -3 },
  { name: "Email Drafter", runs: 387, growth: 15 },
];

const mockRecentSignups = [
  { name: "Sarah Chen", email: "sarah@company.com", plan: "pro", date: "2 hours ago" },
  { name: "Marcus Johnson", email: "marcus@startup.io", plan: "free", date: "5 hours ago" },
  { name: "Emma Williams", email: "emma@design.co", plan: "team", date: "8 hours ago" },
  { name: "James Park", email: "james@dev.net", plan: "pro", date: "12 hours ago" },
  { name: "Priya Sharma", email: "priya@analytics.ai", plan: "free", date: "1 day ago" },
  { name: "Alex Rivera", email: "alex@creative.studio", plan: "pro", date: "1 day ago" },
  { name: "Nina Kowalski", email: "nina@research.org", plan: "team", date: "2 days ago" },
  { name: "Tom Baker", email: "tom@consulting.biz", plan: "free", date: "2 days ago" },
];

const mockUsageByDay = [
  { day: "Mon", messages: 38_200, agents: 520 },
  { day: "Tue", messages: 41_500, agents: 580 },
  { day: "Wed", messages: 45_800, agents: 610 },
  { day: "Thu", messages: 42_100, agents: 555 },
  { day: "Fri", messages: 39_600, agents: 490 },
  { day: "Sat", messages: 28_300, agents: 380 },
  { day: "Sun", messages: 24_100, agents: 340 },
];

// ─── Stat Card ───

function StatCard({
  icon,
  label,
  value,
  subtext,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  iconColor?: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            iconColor ?? "bg-primary/15"
          )}
        >
          {icon}
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
      {subtext && (
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
      )}
    </div>
  );
}

// ─── Bar chart (simple CSS) ───

function SimpleBarChart({
  data,
  dataKey,
  label,
  maxValue,
  color,
}: {
  data: { day: string; [key: string]: number | string }[];
  dataKey: string;
  label: string;
  maxValue: number;
  color: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">{label}</p>
      <div className="flex items-end gap-2 h-32">
        {data.map((d) => {
          const val = d[dataKey] as number;
          const height = Math.max(4, (val / maxValue) * 100);
          return (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
              </span>
              <div
                className={cn("w-full rounded-t-md transition-all", color)}
                style={{ height: `${height}%` }}
              />
              <span className="text-[10px] text-muted-foreground">
                {d.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Plan badge ───

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    free: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    pro: "bg-primary/15 text-primary border-primary/30",
    team: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    enterprise: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border",
        colors[plan] ?? colors.free
      )}
    >
      {plan}
    </span>
  );
}

// ─── Not Authorized ───

function NotAuthorized() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      <div className="text-center space-y-3">
        <ShieldCheck size={40} className="mx-auto text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          You don't have admin access. Contact your administrator if you believe
          this is an error.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mt-2"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

// ─── Main Admin Page ───

export default function Admin() {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return <NotAuthorized />;
  }

  const totalPaid =
    mockStats.activeSubscriptions.pro +
    mockStats.activeSubscriptions.team +
    mockStats.activeSubscriptions.enterprise;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <Link
            to="/dashboard"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-primary" />
            <h1 className="text-xl font-semibold text-foreground font-body">
              Admin Dashboard
            </h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-6 ml-10">
          Platform metrics and user management.
        </p>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={<Users size={20} className="text-primary" />}
            label="Total Users"
            value={mockStats.totalUsers.toLocaleString()}
            subtext={`+${mockStats.newUsersThisWeek} this week`}
          />
          <StatCard
            icon={<Crown size={20} className="text-amber-400" />}
            iconColor="bg-amber-500/15"
            label="Paid Subscriptions"
            value={totalPaid.toLocaleString()}
            subtext={`${mockStats.activeSubscriptions.pro} Pro / ${mockStats.activeSubscriptions.team} Team / ${mockStats.activeSubscriptions.enterprise} Enterprise`}
          />
          <StatCard
            icon={<DollarSign size={20} className="text-emerald-400" />}
            iconColor="bg-emerald-500/15"
            label="Monthly Revenue"
            value={`$${mockStats.monthlyRevenue.toLocaleString()}`}
            subtext="Estimated from active subscriptions"
          />
          <StatCard
            icon={<MessageSquare size={20} className="text-blue-400" />}
            iconColor="bg-blue-500/15"
            label="Total Messages"
            value={mockStats.totalMessages.toLocaleString()}
            subtext="All time across all users"
          />
          <StatCard
            icon={<Bot size={20} className="text-violet-400" />}
            iconColor="bg-violet-500/15"
            label="Agent Runs"
            value={mockStats.totalAgentRuns.toLocaleString()}
            subtext="All time agent executions"
          />
          <StatCard
            icon={<TrendingUp size={20} className="text-pink-400" />}
            iconColor="bg-pink-500/15"
            label="Conversion Rate"
            value={`${((totalPaid / mockStats.totalUsers) * 100).toFixed(1)}%`}
            subtext="Free to paid conversion"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Usage charts */}
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Activity size={16} className="text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Weekly Usage
              </h3>
            </div>
            <div className="space-y-6">
              <SimpleBarChart
                data={mockUsageByDay}
                dataKey="messages"
                label="Messages per day"
                maxValue={50_000}
                color="bg-primary/60"
              />
              <SimpleBarChart
                data={mockUsageByDay}
                dataKey="agents"
                label="Agent runs per day"
                maxValue={700}
                color="bg-violet-500/60"
              />
            </div>
          </div>

          {/* Popular agents */}
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Zap size={16} className="text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Most Popular Agents
              </h3>
            </div>
            <div className="space-y-3">
              {mockPopularAgents.map((agent, i) => (
                <div
                  key={agent.name}
                  className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0"
                >
                  <span className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium truncate">
                      {agent.name}
                    </p>
                    <div className="w-full bg-accent rounded-full h-1.5 mt-1.5">
                      <div
                        className="h-full bg-primary/60 rounded-full"
                        style={{
                          width: `${(agent.runs / mockPopularAgents[0].runs) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-foreground tabular-nums">
                      {agent.runs.toLocaleString()}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] tabular-nums",
                        agent.growth >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      )}
                    >
                      {agent.growth >= 0 ? "+" : ""}
                      {agent.growth}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent signups */}
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <UserPlus size={16} className="text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Recent Signups
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                    Name
                  </th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                    Email
                  </th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                    Plan
                  </th>
                  <th className="text-right py-2 text-muted-foreground font-medium">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockRecentSignups.map((user) => (
                  <tr
                    key={user.email}
                    className="border-b border-border/30 last:border-0"
                  >
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {user.name.charAt(0)}
                        </div>
                        <span className="text-foreground">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="py-2.5 pr-4">
                      <PlanBadge plan={user.plan} />
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground">
                      {user.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
