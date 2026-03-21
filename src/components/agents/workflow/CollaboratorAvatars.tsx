import { cn } from "@/lib/utils";
import type { WorkflowPresenceUser } from "@/hooks/useRealtimeWorkflow";

// ─── Props ───

interface CollaboratorAvatarsProps {
  users: WorkflowPresenceUser[];
  maxVisible?: number;
  className?: string;
}

// ─── Component ───

export function CollaboratorAvatars({
  users,
  maxVisible = 5,
  className,
}: CollaboratorAvatarsProps) {
  if (users.length === 0) return null;

  const visible = users.slice(0, maxVisible);
  const overflow = users.length - maxVisible;

  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {visible.map((user) => (
        <div
          key={user.id}
          className="relative group"
        >
          {/* Avatar */}
          <div
            className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-semibold text-white cursor-default select-none ring-2 ring-background"
            style={{
              borderColor: user.color,
              backgroundColor: user.avatar_url ? "transparent" : user.color,
            }}
          >
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(user.name)
            )}
          </div>

          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md bg-popover border border-border shadow-lg text-xs text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {user.name}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-popover" />
          </div>
        </div>
      ))}

      {/* Overflow indicator */}
      {overflow > 0 && (
        <div className="w-7 h-7 rounded-full border-2 border-muted-foreground/30 bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground ring-2 ring-background">
          +{overflow}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ───

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
