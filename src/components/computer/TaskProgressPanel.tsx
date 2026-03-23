import { Check, Loader2, ChevronUp, Circle } from "lucide-react";
import { useState } from "react";

export interface ResearchTask {
  id: number;
  label: string;
  status: "complete" | "active" | "pending";
  elapsed?: string;
  activity?: string;
}

interface TaskProgressPanelProps {
  tasks: ResearchTask[];
  currentStep: number;
  totalSteps: number;
}

export function TaskProgressPanel({ tasks, currentStep, totalSteps }: TaskProgressPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const completedCount = tasks.filter(t => t.status === "complete").length;
  const activeTask = tasks.find(t => t.status === "active");

  return (
    <div
      className="flex-shrink-0 border-t"
      style={{ borderColor: "hsl(var(--computer-border))", backgroundColor: "hsl(var(--computer-header))" }}
    >
      {/* Header with arc progress */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-accent/30 transition-colors"
      >
        {/* Circular mini progress */}
        <div className="relative w-7 h-7 flex-shrink-0">
          <svg viewBox="0 0 28 28" className="w-full h-full -rotate-90">
            <circle cx="14" cy="14" r="11" fill="none" stroke="hsl(var(--step-line))" strokeWidth="2.5" />
            <circle
              cx="14" cy="14" r="11" fill="none"
              stroke="hsl(var(--success))"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 11}`}
              strokeDashoffset={`${2 * Math.PI * 11 * (1 - completedCount / totalSteps)}`}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-foreground tabular-nums">
            {completedCount}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-foreground">
            {activeTask ? activeTask.label : "All tasks complete"}
          </span>
          {activeTask?.elapsed && (
            <span className="text-[10px] text-muted-foreground ml-2">{activeTask.elapsed}</span>
          )}
        </div>

        <ChevronUp
          size={14}
          className={`text-muted-foreground transition-transform duration-200 ${expanded ? "" : "rotate-180"}`}
        />
      </button>

      {/* Expanded task list */}
      {expanded && (
        <div className="px-4 pb-3 space-y-0.5">
          {tasks.map((task, i) => (
            <div
              key={task.id}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                task.status === "active" ? "bg-accent/50" : ""
              }`}
            >
              {/* Vertical connector */}
              <div className="relative flex flex-col items-center w-4">
                {task.status === "complete" ? (
                  <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(var(--success) / 0.15)" }}>
                    <Check size={10} className="text-success" />
                  </div>
                ) : task.status === "active" ? (
                  <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(var(--foreground) / 0.1)" }}>
                    <Loader2 size={10} className="text-foreground animate-spin" />
                  </div>
                ) : (
                  <Circle size={14} className="text-muted-foreground/30" />
                )}
              </div>

              <span className={`text-xs leading-snug flex-1 ${
                task.status === "complete" ? "text-muted-foreground line-through decoration-muted-foreground/30" :
                task.status === "active" ? "text-foreground font-medium" :
                "text-muted-foreground/60"
              }`}>
                {task.label}
              </span>

              {task.status === "active" && task.activity && (
                <span className="text-[10px] text-muted-foreground/70 flex-shrink-0">{task.activity}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}