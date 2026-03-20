import { useState } from "react";
import { Monitor, ChevronDown, Check, Loader2 } from "lucide-react";
import type { Step } from "@/data/conversations";
import BrowserStreamPreview from "@/components/ui/magnified-bento";

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
      className="rounded-xl border border-border overflow-hidden max-w-md"
      style={{ backgroundColor: "hsl(var(--surface-elevated))" }}
    >
      {/* Compact header with inline preview thumbnail */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors"
        onClick={onOpenComputer}
      >
        {/* Mini browser stream preview as thumbnail */}
        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 relative" style={{ backgroundColor: "hsl(var(--computer-bg))" }}>
          <div className="absolute inset-0 scale-[0.35] origin-top-left" style={{ width: "285%", height: "285%" }}>
            <BrowserStreamPreview />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Manus's computer</p>
          <div className="flex items-center gap-1.5">
            <Monitor size={11} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Manus is using Editor</span>
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
                  <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ backgroundColor: "hsl(210 40% 25%)" }}>
                    <Loader2 size={11} className="text-[hsl(210_50%_70%)] animate-spin" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-border flex items-center justify-center mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  </div>
                )}
                <p className={`text-sm ${step.status === "pending" ? "text-muted-foreground" : "text-foreground"}`}>
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
