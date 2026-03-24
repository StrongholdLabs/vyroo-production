import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronDown,
  Settings,
  Bot,
  BookOpen,
  FolderPlus,
  Share2,
  MessageSquare,
  LayoutGrid,
  Users,
  Loader2,
  Trash2,
  Plug,
  Zap,
  Store,
  ShieldCheck,
} from "lucide-react";
import { SettingsDialog } from "@/components/SettingsDialog";
import { useConversations, useDeleteConversation } from "@/hooks/useConversations";
import vyrooLogo from "@/assets/vyroo-icon.png";
import { useBroadcastSync } from "@/hooks/useBroadcastSync";
import { groupConversationsByTime } from "@/lib/time-groups";

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
  const navigate = useNavigate();
  const { data: conversations, isLoading } = useConversations();
  const deleteConversation = useDeleteConversation();

  // Enable cross-tab sync
  useBroadcastSync();

  // Group conversations by time
  const groups = conversations ? groupConversationsByTime(conversations as any[]) : null;

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
            <img src={vyrooLogo} alt="Vyroo" width={24} height={24} />
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
            <button
              onClick={() => { onSelect(""); navigate("/dashboard"); }}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-sidebar-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors duration-150"
            >
              <span className="text-muted-foreground"><Plus size={16} /></span>
              <span>New task</span>
            </button>
            <SidebarNavItem icon={<Bot size={16} />} label="Agents" to="/agents" badge="New" />
            <SidebarNavItem icon={<Zap size={16} />} label="Skills" to="/skills" />
            <SidebarNavItem icon={<Plug size={16} />} label="Connectors" to="/connectors" />
            <SidebarNavItem icon={<Store size={16} />} label="Plugins" to="/plugins" badge="New" />
            <SidebarNavItem icon={<Search size={16} />} label="Search" />
            <SidebarNavItem icon={<BookOpen size={16} />} label="Library" to="/library" />
            <SidebarNavItem icon={<Settings size={16} />} label="Settings" to="/settings" />
            <SidebarNavItem icon={<ShieldCheck size={16} />} label="Admin" to="/admin" />
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

          {/* Time-grouped conversations */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
              </div>
            ) : groups ? (
              <>
                <TimeGroup
                  title="Today"
                  conversations={groups.today}
                  activeId={activeId}
                  onSelect={onSelect}
                  onDelete={(id) => deleteConversation.mutate(id)}
                />
                <TimeGroup
                  title="Yesterday"
                  conversations={groups.yesterday}
                  activeId={activeId}
                  onSelect={onSelect}
                  onDelete={(id) => deleteConversation.mutate(id)}
                />
                <TimeGroup
                  title="Last 7 Days"
                  conversations={groups.lastWeek}
                  activeId={activeId}
                  onSelect={onSelect}
                  onDelete={(id) => deleteConversation.mutate(id)}
                />
                <TimeGroup
                  title="Older"
                  conversations={groups.older}
                  activeId={activeId}
                  onSelect={onSelect}
                  onDelete={(id) => deleteConversation.mutate(id)}
                />
              </>
            ) : null}
          </div>

          {/* Bottom icons */}
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
          <Link to="/agents" className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Bot size={18} />
          </Link>
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

// ─── Time Group Section ───

interface TimeGroupProps {
  title: string;
  conversations: any[];
  activeId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function TimeGroup({ title, conversations, activeId, onSelect, onDelete }: TimeGroupProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (conversations.length === 0) return null;

  return (
    <div className="mb-1">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1.5 w-full px-2 py-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
      >
        <ChevronDown
          size={10}
          className={`transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`}
        />
        <span>{title}</span>
        <span className="ml-auto text-[10px] font-normal tabular-nums opacity-60">{conversations.length}</span>
      </button>
      {!collapsed && (
        <div className="space-y-px mt-0.5">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors duration-150 group text-sm ${
                activeId === conv.id
                  ? "bg-accent text-foreground"
                  : "text-sidebar-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <button
                onClick={() => onSelect(conv.id)}
                className="flex-1 min-w-0 text-left flex flex-col gap-0.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs flex-shrink-0">{conv.icon}</span>
                  <span className="truncate text-sm">{conv.title}</span>
                </div>
                {conv.last_message_preview && (
                  <span className="text-[11px] text-muted-foreground/60 truncate pl-5">
                    {conv.last_message_preview}
                  </span>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                className="p-0.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Nav Item ───

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
