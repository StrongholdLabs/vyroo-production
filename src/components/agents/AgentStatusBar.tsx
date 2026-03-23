import {
  Bot, Loader2, Check, AlertCircle, Pause, Clock, Play,
} from "lucide-react";
import type { AgentRunStatus } from "@/types/agents";

const statusConfig: Record<AgentRunStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  pulse?: boolean;
}> = {
  planning: {
    label: "Planning",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10 border-blue-400/20",
    icon: <Loader2 size={12} className="animate-spin" />,
    pulse: true,
  },
  running: {
    label: "Running",
    color: "text-[hsl(var(--success))]",
    bgColor: "bg-[hsl(var(--success))]/10 border-[hsl(var(--success))]/20",
    icon: <Loader2 size={12} className="animate-spin" />,
    pulse: true,
  },
  paused: {
    label: "Paused",
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10 border-yellow-400/20",
    icon: <Pause size={12} />,
  },
  completed: {
    label: "Completed",
    color: "text-[hsl(var(--success))]",
    bgColor: "bg-[hsl(var(--success))]/10 border-[hsl(var(--success))]/20",
    icon: <Check size={12} />,
  },
  failed: {
    label: "Failed",
    color: "text-destructive",
    bgColor: "bg-destructive/10 border-destructive/20",
    icon: <AlertCircle size={12} />,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-muted-foreground",
    bgColor: "bg-muted border-border",
    icon: <AlertCircle size={12} />,
  },
};

interface AgentStatusBarProps {
  agentName: string;
  agentIcon?: string;
  status: AgentRunStatus;
  currentStep?: string;
  stepProgress?: string; // e.g. "3/7"
  elapsedTime?: string;
  compact?: boolean;
  onClick?: () => void;
}

export function AgentStatusBar({
  agentName,
  status,
  currentStep,
  stepProgress,
  elapsedTime,
  compact = false,
  onClick,
}: AgentStatusBarProps) {
  const config = statusConfig[status];

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent/50 transition-colors w-full text-left"
      >
        <div className="relative">
          <Bot size={14} className="text-muted-foreground" />
          {config.pulse && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
          )}
        </div>
        <span className="text-xs text-foreground truncate flex-1">{agentName}</span>
        <span className={`text-[10px] ${config.color}`}>{config.label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 rounded-xl bg-card/50 border border-border/50 hover:border-primary/20 transition-all w-full text-left"
    >
      {/* Agent icon */}
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bot size={16} className="text-primary" />
        </div>
        {config.pulse && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[hsl(var(--success))]">
            <span className="absolute inset-0 rounded-full bg-[hsl(var(--success))] animate-ping opacity-75" />
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">{agentName}</span>
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${config.bgColor} ${config.color}`}
          >
            {config.icon}
            {config.label}
          </span>
        </div>
        {currentStep && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{currentStep}</p>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        {stepProgress && (
          <span className="text-[10px] text-muted-foreground font-medium">
            Step {stepProgress}
          </span>
        )}
        {elapsedTime && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60">
            <Clock size={8} />
            {elapsedTime}
          </span>
        )}
      </div>
    </button>
  );
}
