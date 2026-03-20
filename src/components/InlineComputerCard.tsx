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
    <div className="space-y-4">
      {/* Interactive browser stream preview */}
      <div className="cursor-pointer" onClick={onOpenComputer}>
        <BrowserStreamPreview />
      </div>

      {/* Task progress card */}
      <div
        className="rounded-xl border border-border overflow-hidden"
        style={{ backgroundColor: "hsl(var(--surface-elevated))" }}
      >
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Task progress</span>
              <span className="text-xs text-muted-foreground tabular-nums">{completedSteps} / {totalSteps}</span>
            </div>
          </div>
          <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
        </div>

        {expanded && (
          <div className="px-4 pb-4 border-t border-border pt-3 space-y-2.5">
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
        )}
      </div>
    </div>
  );
}
