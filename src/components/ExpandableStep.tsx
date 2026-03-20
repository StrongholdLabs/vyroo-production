import { useState } from "react";
import { ChevronUp, Check, Loader2, Globe } from "lucide-react";
import type { Step } from "@/data/conversations";

interface ExpandableStepProps {
  step: Step;
  isActive?: boolean;
}

export function ExpandableStep({ step, isActive }: ExpandableStepProps) {
  const [expanded, setExpanded] = useState(isActive ?? false);

  const isComplete = step.status === "complete";
  const isPending = step.status === "pending";

  return (
    <div className="space-y-2">
      {/* Step header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 group w-full text-left"
      >
        {isComplete ? (
          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(var(--success-soft))" }}>
            <Check size={12} className="text-success" />
          </div>
        ) : isPending ? (
          <div className="w-5 h-5 rounded-full border border-border flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full flex items-center justify-center bg-amber-500/20">
            <Loader2 size={12} className="text-amber-400 animate-spin" />
          </div>
        )}
        <span className={`text-sm font-medium ${isComplete ? "text-foreground" : isPending ? "text-muted-foreground" : "text-foreground"}`}>
          {step.label}
        </span>
        <ChevronUp
          size={14}
          className={`text-muted-foreground transition-transform duration-200 ml-1 ${expanded ? "" : "rotate-180"}`}
        />
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="ml-7 space-y-3 animate-fade-in">
          <p className="text-sm text-muted-foreground leading-relaxed">{step.detail}</p>

          {/* Project card - shown for first step */}
          {step.id === 1 && (
            <div className="rounded-xl overflow-hidden max-w-md" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                  <Globe size={16} className="text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">Project Analysis</p>
                  <div className="flex items-center gap-1.5">
                    <Loader2 size={10} className="text-muted-foreground animate-spin" />
                    <span className="text-xs text-muted-foreground">Initializing...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Log lines */}
          {step.logs.length > 0 && (
            <div className="space-y-1">
              {step.logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2 text-xs log-line" style={{ animationDelay: `${i * 100}ms` }}>
                  <span className="text-muted-foreground/40 tabular-nums flex-shrink-0 w-8 text-right">{log.time}</span>
                  <span className={
                    log.type === "result" ? "text-success" :
                    log.type === "action" ? "text-foreground" :
                    "text-muted-foreground"
                  }>{log.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
