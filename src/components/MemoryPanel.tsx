import { useState } from "react";
import {
  Brain,
  Trash2,
  Pencil,
  Check,
  X,
  AlertTriangle,
  User,
  Settings2,
  BookOpen,
  MessageSquare,
  Loader2,
} from "lucide-react";
import {
  useMemories,
  useUpdateMemory,
  useDeleteMemory,
  useClearMemories,
} from "@/hooks/useMemories";
import type { UserMemory } from "@/hooks/useMemories";

// ─── Category config ───

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string }
> = {
  fact: { label: "Facts", icon: User, color: "text-blue-400" },
  preference: { label: "Preferences", icon: Settings2, color: "text-emerald-400" },
  instruction: { label: "Instructions", icon: BookOpen, color: "text-amber-400" },
  context: { label: "Context", icon: MessageSquare, color: "text-purple-400" },
};

// ─── Memory item with inline edit ───

function MemoryItem({
  memory,
  onUpdate,
  onDelete,
  isUpdating,
}: {
  memory: UserMemory;
  onUpdate: (id: string, value: string) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(memory.value);

  const meta = CATEGORY_META[memory.category] || CATEGORY_META.context;
  const Icon = meta.icon;

  const handleSave = () => {
    if (editValue.trim() && editValue !== memory.value) {
      onUpdate(memory.id, editValue.trim());
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setEditValue(memory.value);
    setEditing(false);
  };

  return (
    <div className="group flex items-start gap-2.5 py-2 px-2 rounded-md hover:bg-accent/30 transition-colors">
      <Icon size={14} className={`${meta.color} mt-0.5 flex-shrink-0`} />

      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium">
          {memory.key.replace(/_/g, " ")}
        </p>

        {editing ? (
          <div className="flex items-center gap-1.5 mt-1">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
              className="flex-1 text-sm bg-transparent border border-border rounded px-2 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="p-0.5 text-success hover:text-success/80 transition-colors"
            >
              <Check size={14} />
            </button>
            <button
              onClick={handleCancel}
              className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <p className="text-sm text-foreground">{memory.value}</p>
        )}
      </div>

      {!editing && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onDelete(memory.id)}
            className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main MemoryPanel ───

export function MemoryPanel() {
  const { data: memories, isLoading } = useMemories();
  const updateMemory = useUpdateMemory();
  const deleteMemory = useDeleteMemory();
  const clearMemories = useClearMemories();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleUpdate = (id: string, value: string) => {
    updateMemory.mutate({ id, value });
  };

  const handleDelete = (id: string) => {
    deleteMemory.mutate(id);
  };

  const handleClearAll = () => {
    clearMemories.mutate(undefined, {
      onSuccess: () => setShowClearConfirm(false),
    });
  };

  // Group memories by category
  const grouped = (memories || []).reduce<Record<string, UserMemory[]>>(
    (acc, mem) => {
      if (!acc[mem.category]) acc[mem.category] = [];
      acc[mem.category].push(mem);
      return acc;
    },
    {}
  );

  const categoryOrder = ["fact", "preference", "instruction", "context"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
          <Brain size={18} className="text-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {memories && memories.length > 0
              ? `${memories.length} memor${memories.length === 1 ? "y" : "ies"} saved`
              : "No memories yet"}
          </p>
          <p className="text-xs text-muted-foreground">
            Vyroo remembers facts and preferences from your conversations
          </p>
        </div>
      </div>

      {/* Empty state */}
      {(!memories || memories.length === 0) && (
        <div className="rounded-lg border border-border p-6 text-center" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
          <Brain size={28} className="mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            As you chat, Vyroo will remember your preferences, projects, and instructions to personalize future conversations.
          </p>
        </div>
      )}

      {/* Grouped memories */}
      {categoryOrder.map((cat) => {
        const items = grouped[cat];
        if (!items || items.length === 0) return null;
        const meta = CATEGORY_META[cat];
        return (
          <div key={cat}>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              {meta.label}
            </h3>
            <div className="space-y-0.5">
              {items.map((mem) => (
                <MemoryItem
                  key={mem.id}
                  memory={mem}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  isUpdating={updateMemory.isPending}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Clear all */}
      {memories && memories.length > 0 && (
        <div className="border-t border-border pt-4">
          {showClearConfirm ? (
            <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
              <AlertTriangle size={16} className="text-destructive flex-shrink-0" />
              <p className="text-sm text-foreground flex-1">
                Delete all memories? This cannot be undone.
              </p>
              <button
                onClick={handleClearAll}
                disabled={clearMemories.isPending}
                className="px-3 py-1 text-xs font-medium bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {clearMemories.isPending ? "Clearing..." : "Delete all"}
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1 text-xs border border-border rounded-md text-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 size={14} />
              <span>Clear all memories</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
