import { useState, useCallback, useRef } from "react";
import {
  Search, Code, BarChart3, Globe, PenTool, Puzzle,
  Sparkles, Bot, FileText, Cpu, Microscope, Wand2,
  Loader2, Check, AlertCircle, GripVertical, Trash2,
  Settings2, Copy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { WorkflowNode as WorkflowNodeType } from "@/types/workflows";
import type { AgentTemplate, AgentCategory } from "@/types/agents";

// ─── Icon mapping (same as AgentCard) ───

const iconMap: Record<string, LucideIcon> = {
  Search, Code, BarChart3, Globe, PenTool, Puzzle,
  Sparkles, Bot, FileText, Cpu, Microscope, Wand2,
};

function getIcon(iconName: string): LucideIcon {
  return iconMap[iconName] ?? Puzzle;
}

// ─── Category colors (same as AgentCard) ───

const categoryColors: Record<AgentCategory, { bg: string; text: string; border: string; dot: string }> = {
  research: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30", dot: "bg-blue-400" },
  coding:   { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/30", dot: "bg-purple-400" },
  data:     { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  browsing: { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30", dot: "bg-orange-400" },
  content:  { bg: "bg-pink-500/15", text: "text-pink-400", border: "border-pink-500/30", dot: "bg-pink-400" },
  custom:   { bg: "bg-zinc-500/15", text: "text-zinc-400", border: "border-zinc-500/30", dot: "bg-zinc-400" },
};

// ─── Status indicator ───

function NodeStatusIndicator({ status }: { status?: WorkflowNodeType["status"] }) {
  switch (status) {
    case "running":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20 text-[hsl(var(--success))]">
          <Loader2 size={10} className="animate-spin" />
          Running
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20 text-[hsl(var(--success))]">
          <Check size={10} />
          Done
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-destructive/10 border border-destructive/20 text-destructive">
          <AlertCircle size={10} />
          Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-muted border border-border text-muted-foreground">
          Idle
        </span>
      );
  }
}

// ─── Connection point ───

interface ConnectionPointProps {
  side: "left" | "right";
  nodeId: string;
  onMouseDown?: (e: React.MouseEvent, nodeId: string, side: "left" | "right") => void;
}

function ConnectionPoint({ side, nodeId, onMouseDown }: ConnectionPointProps) {
  return (
    <div
      className={cn(
        "absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-border bg-background cursor-crosshair hover:border-primary hover:bg-primary/20 transition-colors z-10",
        side === "left" ? "-left-1.5" : "-right-1.5",
      )}
      onMouseDown={(e) => {
        e.stopPropagation();
        onMouseDown?.(e, nodeId, side);
      }}
    />
  );
}

// ─── Props ───

interface WorkflowNodeProps {
  node: WorkflowNodeType;
  template: AgentTemplate | undefined;
  isSelected: boolean;
  isDragging: boolean;
  onDragStart: (e: React.MouseEvent, nodeId: string) => void;
  onSelect: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onConfigure: (nodeId: string) => void;
  onDuplicate?: (nodeId: string) => void;
  onConnectionStart?: (e: React.MouseEvent, nodeId: string, side: "left" | "right") => void;
}

// ─── Component ───

export function WorkflowNodeComponent({
  node,
  template,
  isSelected,
  isDragging,
  onDragStart,
  onSelect,
  onDelete,
  onConfigure,
  onDuplicate,
  onConnectionStart,
}: WorkflowNodeProps) {
  const contextRef = useRef<HTMLDivElement>(null);
  const [showContext, setShowContext] = useState(false);

  const Icon = template ? getIcon(template.icon_name) : Puzzle;
  const colors = template
    ? (categoryColors[template.category] ?? categoryColors.custom)
    : categoryColors.custom;

  const toolCount = node.config.enabled_tools?.length ?? template?.default_tools.length ?? 0;
  const modelLabel = node.config.model ?? template?.default_model ?? "default";

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContext(true);
  }, []);

  const handleClickOutside = useCallback(() => {
    setShowContext(false);
  }, []);

  return (
    <motion.div
      className={cn(
        "absolute w-[220px] rounded-xl border transition-shadow duration-200 select-none",
        "bg-card/80 backdrop-blur-md",
        isSelected
          ? "border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10"
          : "border-border/50 hover:border-primary/30",
        isDragging && "opacity-80 cursor-grabbing shadow-2xl",
        node.status === "running" && "border-primary/40 shadow-lg shadow-primary/20",
      )}
      style={{
        left: node.position.x,
        top: node.position.y,
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      onMouseDown={(e) => {
        if (e.button === 0) {
          onSelect(node.id);
          onDragStart(e, node.id);
        }
      }}
      onContextMenu={handleContextMenu}
    >
      {/* Running glow animation */}
      {node.status === "running" && (
        <div className="absolute inset-0 rounded-xl border-2 border-primary/50 animate-pulse pointer-events-none" />
      )}

      {/* Connection points */}
      <ConnectionPoint side="left" nodeId={node.id} onMouseDown={onConnectionStart} />
      <ConnectionPoint side="right" nodeId={node.id} onMouseDown={onConnectionStart} />

      <div className="p-3">
        {/* Header: icon + name + status */}
        <div className="flex items-start gap-2.5 mb-2">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border", colors.bg, colors.border)}>
            <Icon size={16} className={colors.text} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-foreground truncate">
              {template?.name ?? "Unknown Agent"}
            </h4>
            <div className="mt-0.5">
              <NodeStatusIndicator status={node.status} />
            </div>
          </div>
          <GripVertical size={12} className="text-muted-foreground/40 mt-0.5 cursor-grab" />
        </div>

        {/* Config summary */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="truncate">{modelLabel.split("-").slice(0, 2).join("-")}</span>
          <span className="text-border">|</span>
          <span>{toolCount} tools</span>
        </div>
      </div>

      {/* Context menu */}
      {showContext && (
        <>
          <div className="fixed inset-0 z-40" onClick={handleClickOutside} />
          <div
            ref={contextRef}
            className="absolute top-full left-0 mt-1 w-40 py-1 rounded-lg border border-border bg-popover shadow-xl z-50"
          >
            <button
              onClick={(e) => { e.stopPropagation(); setShowContext(false); onConfigure(node.id); }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
            >
              <Settings2 size={12} />
              Configure
            </button>
            {onDuplicate && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowContext(false); onDuplicate(node.id); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
              >
                <Copy size={12} />
                Duplicate
              </button>
            )}
            <div className="my-1 border-t border-border" />
            <button
              onClick={(e) => { e.stopPropagation(); setShowContext(false); onDelete(node.id); }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 size={12} />
              Delete
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
