import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  ChevronLeft,
  Settings,
  Bot,
  BookOpen,
  FolderPlus,
  Share2,
  MessageSquare,
  LayoutGrid,
  Users,
} from "lucide-react";
import { SettingsDialog } from "@/components/SettingsDialog";

interface Task {
  id: string;
  title: string;
  icon?: string;
}

const mockTasks: Task[] = [
  { id: "10", title: "Hottest DTC Nutrition and Fitness...", icon: "🔬" },
  { id: "1", title: "Top 5 DTC Skincare Brands and P...", icon: "📊" },
  { id: "2", title: "Hottest 2026 DTC Products to Re...", icon: "🔥" },
  { id: "3", title: "Hello", icon: "👋" },
  { id: "4", title: "Designing a Website for Vyroo.ai I...", icon: "🎨" },
  { id: "5", title: "Using Meta Ads to Attract More C...", icon: "📱" },
  { id: "6", title: "Waar komen katten vandaan?", icon: "🐱" },
  { id: "7", title: "Minimalist Online Store for Specia...", icon: "🛒" },
  { id: "8", title: "Designing a Website for Vyroo.ai I...", icon: "🌐" },
  { id: "9", title: "Build a Landing Page", icon: "🚀" },
  { id: "11", title: "Stock Analysis", icon: "📈" },
  { id: "12", title: "Scheduling Tool with Event Creati...", icon: "📅" },
  { id: "13", title: "How to Test a Product Before Selli...", icon: "🧪" },
  { id: "14", title: "What Can I Do?", icon: "❓" },
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
      className={`h-full flex flex-col border-r border-sidebar-border transition-all duration-300 ease-out ${
        collapsed ? "w-0 overflow-hidden md:w-14" : "w-64"
      }`}
      style={{ backgroundColor: "hsl(var(--sidebar-background))" }}
    >
      {/* Top: logo + collapse */}
      <div className="flex items-center justify-between px-3 h-12 flex-shrink-0">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2 font-body font-semibold text-foreground text-sm tracking-tight">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-foreground">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
            <span>manus</span>
          </Link>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
        >
          <ChevronLeft size={16} className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Navigation items */}
          <div className="px-2 space-y-0.5">
            <SidebarNavItem icon={<Plus size={16} />} label="New task" to="/" />
            <SidebarNavItem icon={<Bot size={16} />} label="Agents" badge="New" />
            <SidebarNavItem icon={<Search size={16} />} label="Search" />
            <SidebarNavItem icon={<BookOpen size={16} />} label="Library" />
          </div>

          {/* Projects section */}
          <div className="px-3 mt-5 mb-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Projects</span>
              <button className="p-0.5 text-muted-foreground hover:text-foreground transition-colors">
                <Plus size={12} />
              </button>
            </div>
          </div>
          <div className="px-2 mb-2">
            <button className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-sidebar-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors duration-150">
              <FolderPlus size={14} className="text-muted-foreground" />
              <span>New project</span>
            </button>
          </div>

          {/* All tasks */}
          <div className="px-3 mt-2 mb-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">All tasks</span>
              <button className="p-0.5 text-muted-foreground hover:text-foreground transition-colors">
                <Settings size={12} />
              </button>
            </div>
          </div>

          {/* Task list */}
          <div className="flex-1 overflow-y-auto px-2 space-y-px">
            {mockTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => onSelect(task.id)}
                className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors duration-150 group text-sm ${
                  activeId === task.id
                    ? "bg-accent text-foreground"
                    : "text-sidebar-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <span className="text-xs flex-shrink-0">{task.icon}</span>
                <span className="truncate">{task.title}</span>
              </button>
            ))}
          </div>

          {/* Bottom referral + icons */}
          <div className="flex-shrink-0 border-t border-sidebar-border">
            <div className="flex items-center justify-between px-3 pb-2">
              <div className="flex items-center gap-1">
                <button onClick={() => setSettingsOpen(true)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent">
                  <Users size={16} />
                </button>
                <button onClick={() => setSettingsOpen(true)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent">
                  <Settings size={16} />
                </button>
                <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent">
                  <MessageSquare size={16} />
                </button>
              </div>
              
            </div>
          </div>
        </>
      )}

      {/* Collapsed mini icons */}
      {collapsed && (
        <div className="hidden md:flex flex-col items-center gap-1 pt-2 px-1">
          <Link to="/" className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Plus size={18} />
          </Link>
          <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Bot size={18} />
          </button>
          <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Search size={18} />
          </button>
          <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <BookOpen size={18} />
          </button>
        </div>
      )}
    </aside>
    </>
  );
}

function SidebarNavItem({ icon, label, badge, to }: { icon: React.ReactNode; label: string; badge?: string; to?: string }) {
  const content = (
    <>
      <span className="text-muted-foreground">{icon}</span>
      <span>{label}</span>
      {badge && (
        <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-success/20 text-success">
          {badge}
        </span>
      )}
    </>
  );

  const className = "flex items-center gap-2 w-full px-2 py-1.5 text-sm text-sidebar-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors duration-150";

  if (to) {
    return <Link to={to} className={className}>{content}</Link>;
  }
  return <button className={className}>{content}</button>;
}
