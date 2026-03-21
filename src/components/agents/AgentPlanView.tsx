import { useState } from "react";
import {
  Search, Code, Globe, PenTool, BarChart2, Brain, Wrench,
  ChevronRight, Check, Loader2, AlertCircle, SkipForward, Clock,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { AgentStep, AgentStepType, AgentStepStatus } from "@/types/agents";

const stepTypeIcons: Record<AgentStepType, React.ReactNode> = {
  plan: <Brain size={14} />,
  tool_call: <Wrench size={14} />,
  llm_call: <Sparkles size={14} />,
  browse: <Globe size={14} />,
  code: <Code size={14} />,
  write: <PenTool size={14} />,
  search: <Search size={14} />,
  think: <Brain size={14} />,
  delegate: <Sparkles size={14} />,
};

const stepTypeLabels: Record<AgentStepType, string> = {
  plan: "Planning",
  tool_call: "Tool Call",
  llm_call: "AI Reasoning",
  browse: "Browsing",
  code: "Coding",
  write: "Writing",
  search: "Searching",
  think: "Thinking",
  delegate: "Delegating",
};

const statusColors: Record<AgentStepStatus, string> = {
  pending: "text-muted-foreground",
  active: "text-primary",
  complete: "text-[hsl(var(--success))]",
  failed: "text-destructive",
  skipped: "text-muted-foreground/50",
};

function StatusIcon({ status }: { status: AgentStepStatus }) {
  switch (status) {
    case "complete":
      return <Check size={14} className="text-[hsl(var(--success))]" />;
    case "active":
      return <Loader2 size={14} className="text-primary animate-spin" />;
    case "failed":
      return <AlertCircle size={14} className="text-destructive" />;
    case "skipped":
      return <SkipForward size={14} className="text-muted-foreground/50" />;
    default:
      return <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30" />;
  }
}

interface AgentPlanViewProps {
  steps: AgentStep[];
  onRetryStep?: (stepNumber: number) => void;
}

export function AgentPlanView({ steps, onRetryStep }: AgentPlanViewProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const activeStep = steps.find((s) => s.status === "active");
  const completedCount = steps.filter((s) => s.status === "complete").length;

  return (
    <div className="space-y-1">
      {/* Progress summary */}
      <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
        <span>
          {completedCount}/{steps.length} steps completed
        </span>
        {activeStep && (
          <span className="flex items-center gap-1 text-primary">
            <Loader2 size={10} className="animate-spin" />
            Step {activeStep.step_number}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mx-3 h-1 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(completedCount / Math.max(steps.length, 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Step list */}
      <div className="mt-2">
        {steps.map((step, index) => {
          const isExpanded = expandedStep === step.step_number;
          const isActive = step.status === "active";

          return (
            <div key={step.id || index}>
              {/* Connector line */}
              {index > 0 && (
                <div className="ml-[22px] h-3 border-l-2 border-border/50" />
              )}

              <button
                onClick={() => setExpandedStep(isExpanded ? null : step.step_number)}
                className={`w-full flex items-start gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary/5 border border-primary/20"
                    : "hover:bg-accent/50"
                }`}
              >
                {/* Status indicator */}
                <div className="mt-0.5 flex-shrink-0">
                  <StatusIcon status={step.status} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        step.status === "active"
                          ? "text-foreground"
                          : step.status === "complete"
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {stepTypeIcons[step.type]}
                      {stepTypeLabels[step.type]}
                    </span>
                  </div>

                  {/* Detail / live output */}
                  {step.detail && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {step.detail}
                    </p>
                  )}

                  {/* Duration */}
                  {step.duration_ms != null && step.status === "complete" && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60 mt-1">
                      <Clock size={8} />
                      {(step.duration_ms / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>

                {/* Expand chevron */}
                {(step.status === "complete" || step.status === "failed") && (
                  <ChevronRight
                    size={14}
                    className={`text-muted-foreground transition-transform flex-shrink-0 mt-1 ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                )}
              </button>

              {/* Expanded output */}
              <AnimatePresence>
                {isExpanded && (step.status === "complete" || step.status === "failed") && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-8 mr-3 mb-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                      {step.tool_name && (
                        <div className="text-xs text-muted-foreground mb-2">
                          Tool: <span className="font-mono text-foreground">{step.tool_name}</span>
                        </div>
                      )}
                      {step.output && Object.keys(step.output).length > 0 && (
                        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {typeof step.output === "string"
                            ? step.output
                            : JSON.stringify(step.output, null, 2)}
                        </pre>
                      )}
                      {step.status === "failed" && onRetryStep && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRetryStep(step.step_number);
                          }}
                          className="mt-2 text-xs text-primary hover:text-primary/80 font-medium"
                        >
                          Retry this step →
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
