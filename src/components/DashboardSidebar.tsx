import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  ChevronLeft,
  Settings,
  Bookmark,
  Sparkles,
  MessageSquare,
  Users,
  ChevronDown,
  BarChart3,
  DollarSign,
  Globe,
  TrendingUp,
  Utensils,
  ShoppingBag,
  Layout,
  GitBranch,
  FlaskConical,
  HelpCircle,
  Rocket,
  LineChart,
  CalendarDays,
} from "lucide-react";
import { SettingsDialog } from "@/components/SettingsDialog";

interface Task {
  id: string;
  title: string;
  icon: React.ReactNode;
}

interface Chat {
  id: string;
  title: string;
}

const mockChats: Chat[] = [
  { id: "c1", title: "New conversation" },
  { id: "c2", title: "Health Company Landing Page Design" },
  { id: "c3", title: "Ecommerce Trends for 2026" },
  { id: "c4", title: "Competitor Analysis and Insights" },
  { id: "c5", title: "New conversation" },
];

const mockTasks: Task[] = [
  { id: "1", title: "Growth aqq Dashboard", icon: <BarChart3 size={14} /> },
  { id: "2", title: "Cash Flow Forecast", icon: <DollarSign size={14} /> },
  { id: "3", title: "Landingpage website", icon: <Globe size={14} /> },
  { id: "4", title: "New Customer Acquisition", icon: <TrendingUp size={14} /> },
  { id: "5", title: "Nutrition", icon: <Utensils size={14} /> },
  { id: "6", title: "webshop", icon: <ShoppingBag size={14} /> },
  { id: "7", title: "landing page", icon: <Layout size={14} /> },
  { id: "8", title: "Conversion Funnel Analysis", icon: <GitBranch size={14} /> },
  { id: "9", title: "Run a Market Analysis", icon: <LineChart size={14} /> },
];

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeId: string;
  onSelect: (id: string) => void;
}

export function DashboardSidebar({
  collapsed,
  onToggle,
  activeId,
  onSelect,
}: DashboardSidebarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <aside
        className={`h-full flex flex-col transition-all duration-300 ease-out ${
          collapsed ? "w-0 overflow-hidden md:w-14" : "w-64"
        }`}
        style={{ backgroundColor: "hsl(var(--sidebar-background))" }}
      >
        {/* Top: logo + collapse */}
        <div className="flex items-center justify-between px-3 h-12 flex-shrink-0">
          {!collapsed && (
            <Link
              to="/"
              className="flex items-center gap-2 font-body font-semibold text-foreground text-sm tracking-tight"
            >
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(var(--success) / 0.15)" }}>
                <Sparkles size={14} style={{ color: "hsl(var(--success))" }} />
              </div>
              <span className="font-display text-base">Vyroo</span>
            </Link>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
          >
            <ChevronLeft
              size={16}
              className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {!collapsed && (
          <>
            {/* Quick actions */}
            <div className="px-2 mt-1 space-y-0.5">
              <SidebarNavItem icon={<Plus size={16} />} label="New task" to="/" />
              <SidebarNavItem icon={<Bookmark size={16} />} label="Saved" />
              <SidebarNavItem icon={<Search size={16} />} label="Search" />
            </div>

            {/* Section divider: PROJECTS */}
            <SectionDivider label="Projects" showAdd />

            <div className="px-2 mb-1">
              <button
                onClick={() => onSelect("project-1")}
                className="flex items-center gap-2.5 w-full px-2.5 py-2 text-sm rounded-xl transition-all duration-150 group"
                style={{
                  backgroundColor: activeId === "project-1" ? "hsl(var(--success) / 0.08)" : "transparent",
                  border: activeId === "project-1" ? "1px solid hsl(var(--success) / 0.15)" : "1px solid transparent",
                }}
              >
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "hsl(var(--success) / 0.15)" }}
                >
                  <Rocket size={11} style={{ color: "hsl(var(--success))" }} />
                </div>
                <span className="text-sidebar-foreground group-hover:text-foreground transition-colors truncate">
                  Product Launch
                </span>
              </button>
            </div>

            {/* Section divider: CHATS */}
            <SectionDivider label="Chats" showAdd />

            <div className="px-2 space-y-0.5 mb-1">
              {mockChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onSelect(chat.id)}
                  className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-150 text-sm ${
                    activeId === chat.id
                      ? "text-foreground"
                      : "text-sidebar-foreground hover:text-foreground"
                  }`}
                  style={{
                    backgroundColor:
                      activeId === chat.id
                        ? "hsl(var(--sidebar-accent))"
                        : undefined,
                  }}
                >
                  <span className="truncate">{chat.title}</span>
                </button>
              ))}
            </div>

            {/* Section divider: TASKS */}
            <SectionDivider label="Tasks" />

            {/* Task cards */}
            <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-2">
              {mockTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onSelect(task.id)}
                  className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-150 group text-sm ${
                    activeId === task.id
                      ? "text-foreground shadow-sm"
                      : "text-sidebar-foreground hover:text-foreground"
                  }`}
                  style={{
                    backgroundColor:
                      activeId === task.id
                        ? "hsl(var(--sidebar-accent))"
                        : undefined,
                    border:
                      activeId === task.id
                        ? "1px solid hsl(var(--sidebar-border))"
                        : "1px solid transparent",
                  }}
                >
                  <span
                    className="flex-shrink-0 transition-colors"
                    style={{
                      color:
                        activeId === task.id
                          ? "hsl(var(--success))"
                          : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {task.icon}
                  </span>
                  <span className="truncate">{task.title}</span>
                </button>
              ))}
            </div>

            {/* Footer: user profile */}
            <div className="flex-shrink-0 px-2 pb-2">
              <div
                className="rounded-xl px-2.5 py-2 flex items-center justify-between"
                style={{
                  backgroundColor: "hsl(var(--sidebar-accent))",
                  border: "1px solid hsl(var(--sidebar-border))",
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{
                      backgroundColor: "hsl(var(--success) / 0.15)",
                      color: "hsl(var(--success))",
                    }}
                  >
                    R
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate leading-tight">
                      Roel Mangal
                    </div>
                    <div className="text-[11px] truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
                      roel_mangal@hotmail.com
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Settings size={14} />
                  </button>
                  <ChevronDown size={14} className="text-muted-foreground" />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Collapsed mini icons */}
        {collapsed && (
          <div className="hidden md:flex flex-col items-center gap-1 pt-2 px-1">
            <Link
              to="/"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Plus size={18} />
            </Link>
            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Bookmark size={18} />
            </button>
            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Search size={18} />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

/* ─── Section divider ─── */
function SectionDivider({ label, showAdd }: { label: string; showAdd?: boolean }) {
  return (
    <div className="px-3 mt-4 mb-1.5 flex items-center justify-between">
      <span
        className="text-[11px] font-semibold uppercase tracking-widest"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        {label}
      </span>
      {showAdd && (
        <button
          className="p-0.5 rounded-md transition-colors"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <Plus size={13} />
        </button>
      )}
    </div>
  );
}

/* ─── Nav item ─── */
function SidebarNavItem({
  icon,
  label,
  badge,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  to?: string;
}) {
  const content = (
    <>
      <span className="text-muted-foreground">{icon}</span>
      <span>{label}</span>
      {badge && (
        <span
          className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full"
          style={{
            backgroundColor: "hsl(var(--success) / 0.15)",
            color: "hsl(var(--success))",
          }}
        >
          {badge}
        </span>
      )}
    </>
  );

  const className =
    "flex items-center gap-2 w-full px-2.5 py-1.5 text-sm text-sidebar-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors duration-150";

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }
  return <button className={className}>{content}</button>;
}
