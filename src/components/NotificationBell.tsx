import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  icon: string;
}

const mockNotifications: Notification[] = [
  { id: "1", title: "Task completed", description: "DTC Skincare Analysis report is ready", time: "2m ago", read: false, icon: "✅" },
  { id: "2", title: "New agent available", description: "Try the Research Agent for deeper analysis", time: "1h ago", read: false, icon: "🤖" },
  { id: "3", title: "Credits low", description: "You have 993 credits remaining", time: "3h ago", read: true, icon: "⚡" },
  { id: "4", title: "Website deployed", description: "Vyroo.ai landing page is live", time: "Yesterday", read: true, icon: "🚀" },
];

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border overflow-hidden shadow-xl z-50 animate-scale-in"
          style={{ backgroundColor: "hsl(var(--popover))" }}
        >
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Notifications</span>
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {mockNotifications.map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3 flex items-start gap-3 hover:bg-accent/50 transition-colors cursor-pointer border-b border-border/50 last:border-0 ${
                  !n.read ? "bg-accent/20" : ""
                }`}
              >
                <span className="text-sm flex-shrink-0 mt-0.5">{n.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{n.title}</span>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.description}</p>
                  <span className="text-[10px] text-muted-foreground/60 mt-1 block">{n.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
