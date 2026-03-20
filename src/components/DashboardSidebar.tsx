import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Plus,
  Search,
  MessageSquare,
  ChevronLeft,
  Settings,
  MoreHorizontal,
} from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  preview: string;
  time: string;
  unread?: boolean;
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    title: "Build a portfolio website",
    preview: "Creating a responsive portfolio with React...",
    time: "2m ago",
    unread: true,
  },
  {
    id: "2",
    title: "Analyze Q4 sales data",
    preview: "Processing CSV data and generating charts...",
    time: "1h ago",
  },
  {
    id: "3",
    title: "Design brand identity",
    preview: "Exploring color palettes and typography...",
    time: "3h ago",
  },
  {
    id: "4",
    title: "Create pitch deck",
    preview: "12 slides with key metrics and projections...",
    time: "Yesterday",
  },
  {
    id: "5",
    title: "Research competitor pricing",
    preview: "Comparing 8 competitors across 3 markets...",
    time: "2 days ago",
  },
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
  return (
    <aside
      className={`h-full flex flex-col border-r border-border bg-sidebar transition-all duration-300 ease-out ${
        collapsed ? "w-0 overflow-hidden md:w-16" : "w-72"
      }`}
    >
      {/* Top controls */}
      <div className="flex items-center justify-between p-3 h-14">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2 font-body font-semibold text-foreground text-sm">
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
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150"
        >
          <ChevronLeft size={16} className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {!collapsed && (
        <>
          {/* New task */}
          <div className="px-3 pb-2">
            <Link
              to="/"
              className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium bg-popover border border-border rounded-lg hover:bg-secondary transition-colors duration-150 active:scale-[0.98]"
            >
              <Plus size={14} />
              <span>New task</span>
              <kbd className="ml-auto text-[10px] text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded">⌘K</kbd>
            </Link>
          </div>

          {/* Search */}
          <div className="px-3 pb-3">
            <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-secondary/50 rounded-lg">
              <Search size={14} />
              <span className="text-xs">Search tasks...</span>
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
            {mockConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors duration-150 group ${
                  activeId === conv.id
                    ? "bg-accent"
                    : "hover:bg-accent/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm truncate ${
                      conv.unread ? "font-semibold text-foreground" : "text-sidebar-foreground"
                    }`}
                  >
                    {conv.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">
                    {conv.time}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.preview}</p>
              </button>
            ))}
          </div>

          {/* Bottom */}
          <div className="p-3 border-t border-border">
            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors duration-150">
              <Settings size={14} />
              <span>Settings</span>
            </button>
          </div>
        </>
      )}

      {collapsed && (
        <div className="hidden md:flex flex-col items-center gap-2 pt-2">
          <Link
            to="/"
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Plus size={18} />
          </Link>
          <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <Search size={18} />
          </button>
          {mockConversations.slice(0, 4).map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                activeId === conv.id ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {conv.title[0]}
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
