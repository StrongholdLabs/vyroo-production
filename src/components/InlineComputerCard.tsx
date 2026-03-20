import { useState } from "react";
import { Monitor, ChevronDown, Check, Loader2 } from "lucide-react";
import type { Step } from "@/data/conversations";

interface InlineComputerCardProps {
  steps: Step[];
  onOpenComputer?: () => void;
}

export function InlineComputerCard({ steps, onOpenComputer }: InlineComputerCardProps) {
  const [expanded, setExpanded] = useState(true);
  const completedSteps = steps.filter((s) => s.status === "complete").length;
  const totalSteps = steps.length;

  return (
    <div
      className="rounded-xl border border-border overflow-hidden"
      style={{ backgroundColor: "hsl(var(--surface-elevated))" }}
    >
      {/* Computer header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors"
        onClick={onOpenComputer}
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "hsl(var(--computer-bg))" }}>
          <Monitor size={18} className="text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Manus's computer</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
            <span className="text-xs text-muted-foreground">Manus is inactive</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
            onClick={(e) => { e.stopPropagation(); onOpenComputer?.(); }}
          >
            <Monitor size={14} />
          </button>
          <button
            className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            <ChevronDown size={14} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Task progress */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Task progress</span>
            <span className="text-xs text-muted-foreground tabular-nums">{completedSteps} / {totalSteps}</span>
          </div>
          <div className="space-y-2.5">
            {steps.map((step) => (
              <div key={step.id} className="flex items-start gap-2.5">
                {step.status === "complete" ? (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ backgroundColor: "hsl(var(--success-soft))" }}>
                    <Check size={11} className="text-success" />
                  </div>
                ) : step.status === "active" ? (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5 bg-amber-500/20">
                    <Loader2 size={11} className="text-amber-400 animate-spin" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-border flex items-center justify-center mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className={`text-sm ${step.status === "pending" ? "text-muted-foreground" : "text-foreground"}`}>
                    {step.label}
                  </p>
                  {step.status === "active" && (
                    <p className="text-xs text-muted-foreground mt-0.5">Waiting for user...</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
