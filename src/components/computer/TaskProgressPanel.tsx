import { Check, Loader2, ChevronUp } from "lucide-react";
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

  return (
    <div
      className="flex-shrink-0 border-t"
      style={{ borderColor: "hsl(var(--computer-border))", backgroundColor: "hsl(var(--computer-header))" }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-2.5 text-left"
      >
        <span className="text-sm font-medium text-foreground">Task progress</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">{currentStep} / {totalSteps}</span>
          <ChevronUp
            size={14}
            className={`text-muted-foreground transition-transform duration-200 ${expanded ? "" : "rotate-180"}`}
          />
        </div>
      </button>

      {/* Task list */}
      {expanded && (
        <div className="px-4 pb-3 space-y-1.5">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start gap-2.5">
              {task.status === "complete" ? (
                <Check size={14} className="text-success flex-shrink-0 mt-0.5" />
              ) : task.status === "active" ? (
                <div className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                </div>
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-border flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <span className={`text-xs leading-snug ${
                  task.status === "complete" ? "text-foreground" :
                  task.status === "active" ? "text-foreground font-medium" :
                  "text-muted-foreground"
                }`}>
                  {task.label}
                </span>
                {task.status === "active" && task.elapsed && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-muted-foreground tabular-nums">{task.elapsed}</span>
                    {task.activity && (
                      <span className="text-[10px] text-muted-foreground">{task.activity}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
