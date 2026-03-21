import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Plus,
  Search,
  ChevronLeft,
  Bot,
  BookOpen,
  Plug,
  Zap,
  Store,
  Settings,
  MessageSquare,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function LandingSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "h-full flex flex-col border-r border-sidebar-border transition-all duration-300 ease-out",
        collapsed ? "w-0 overflow-hidden md:w-14" : "w-60"
      )}
      style={{ backgroundColor: "hsl(var(--sidebar-background))" }}
    >
      {/* Top: logo + collapse */}
      <div className="flex items-center justify-between px-3 h-12 flex-shrink-0">
        {!collapsed && (
          <Link
            to="/"
            className="flex items-center gap-2 font-body font-semibold text-foreground text-sm tracking-tight"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-foreground">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
            <span>Vyroo</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
        >
          <ChevronLeft
            size={16}
            className={cn(
              "transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Navigation — same as dashboard, app-first */}
          <div className="px-2 space-y-0.5 mt-1">
            <NavItem icon={<Plus size={16} />} label="New task" to="/" active={location.pathname === "/"} />
            <NavItem icon={<Bot size={16} />} label="Agents" to="/agents" />
            <NavItem icon={<Zap size={16} />} label="Skills" to="/skills" />
            <NavItem icon={<Plug size={16} />} label="Connectors" to="/connectors" />
            <NavItem icon={<Store size={16} />} label="Plugins" to="/plugins" />
            <NavItem icon={<Search size={16} />} label="Search" />
            <NavItem icon={<BookOpen size={16} />} label="Library" />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom icons — matches dashboard sidebar */}
          <div className="flex-shrink-0 border-t border-sidebar-border">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-1">
                <Link to="/login" className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent">
                  <Users size={16} />
                </Link>
                <Link to="/settings" className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent">
                  <Settings size={16} />
                </Link>
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
          <Link to="/agents" className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Bot size={18} />
          </Link>
          <Link to="/plugins" className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Store size={18} />
          </Link>
          <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Search size={18} />
          </button>
        </div>
      )}
    </aside>
  );
}

// ─── Nav Item ───

function NavItem({
  icon,
  label,
  to,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  to?: string;
  active?: boolean;
}) {
  const content = (
    <>
      <span className="text-muted-foreground">{icon}</span>
      <span>{label}</span>
    </>
  );

  const cls = cn(
    "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md transition-colors duration-150",
    active
      ? "bg-accent text-foreground"
      : "text-sidebar-foreground hover:text-foreground hover:bg-accent"
  );

  if (to) {
    return <Link to={to} className={cls}>{content}</Link>;
  }
  return <button className={cls}>{content}</button>;
}
