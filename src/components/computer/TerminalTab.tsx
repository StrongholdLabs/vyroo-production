import { useState, useEffect, useRef } from "react";
import type { Step, LogEntry } from "@/data/conversations";

interface TerminalTabProps {
  steps: Step[];
  isActive: boolean;
}

interface TerminalLine {
  text: string;
  type: "command" | "output" | "success" | "error" | "info" | "dim";
}

function generateTerminalLines(steps: Step[]): TerminalLine[] {
  const lines: TerminalLine[] = [
    { text: "$ vyroo run --task=analyze", type: "command" },
    { text: "", type: "dim" },
    { text: "⏳ Initializing Vyroo v2.4.1...", type: "info" },
    { text: "✓ Connected to workspace", type: "success" },
    { text: "", type: "dim" },
  ];

  steps.forEach((step, idx) => {
    lines.push({ text: `$ vyroo step ${idx + 1} --label="${step.label}"`, type: "command" });

    step.logs.forEach((log: LogEntry) => {
      if (log.type === "action") {
        lines.push({ text: `  → ${log.text}`, type: "info" });
      } else if (log.type === "result") {
        lines.push({ text: `  ✓ ${log.text}`, type: "success" });
      } else {
        lines.push({ text: `  ℹ ${log.text}`, type: "output" });
      }
    });

    if (step.status === "complete") {
      lines.push({ text: `  ✓ Step ${idx + 1} completed [${step.logs[step.logs.length - 1]?.time || "0:00"}]`, type: "success" });
    } else if (step.status === "active") {
      lines.push({ text: `  ⏳ Running...`, type: "info" });
    } else {
      lines.push({ text: `  ○ Pending`, type: "dim" });
    }
    lines.push({ text: "", type: "dim" });
  });

  const hasActive = steps.some(s => s.status === "active");
  const hasPending = steps.some(s => s.status === "pending");

  if (!hasActive && !hasPending) {
    lines.push({ text: "─".repeat(40), type: "dim" });
    lines.push({ text: "✓ All steps completed successfully", type: "success" });
    lines.push({ text: `  Total steps: ${steps.length}`, type: "output" });
    lines.push({ text: `  Duration: ${steps[steps.length - 1]?.logs[steps[steps.length - 1]?.logs.length - 1]?.time || "—"}`, type: "output" });
    lines.push({ text: "", type: "dim" });
    lines.push({ text: "$ █", type: "command" });
  }

  return lines;
}

const TYPE_COLORS: Record<TerminalLine["type"], string> = {
  command: "text-[hsl(50_70%_65%)]",
  output: "text-foreground/80",
  success: "text-[hsl(142_60%_55%)]",
  error: "text-[hsl(0_72%_60%)]",
  info: "text-[hsl(200_50%_65%)]",
  dim: "text-muted-foreground/30",
};

export function TerminalTab({ steps, isActive }: TerminalTabProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const termRef = useRef<HTMLDivElement>(null);
  const allLines = generateTerminalLines(steps);
  const prevStepsRef = useRef(steps);

  useEffect(() => {
    if (prevStepsRef.current !== steps) {
      setVisibleCount(0);
      prevStepsRef.current = steps;
    }
  }, [steps]);

  useEffect(() => {
    if (!isActive || visibleCount >= allLines.length) return;
    const delay = visibleCount === 0 ? 200 : 30 + Math.random() * 60;
    const timer = setTimeout(() => setVisibleCount(v => v + 1), delay);
    return () => clearTimeout(timer);
  }, [visibleCount, allLines.length, isActive]);

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [visibleCount]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "hsl(var(--surface-sunken))" }}>
      {/* Terminal header bar */}
      <div className="flex items-center gap-2 px-4 py-1.5 border-b flex-shrink-0" style={{ borderColor: "hsl(var(--computer-border))", backgroundColor: "hsl(var(--computer-bg))" }}>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "hsl(0 60% 50%)" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "hsl(45 70% 50%)" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "hsl(142 50% 45%)" }} />
        </div>
        <span className="text-[10px] text-muted-foreground ml-2 font-mono">vyroo — bash — 80×24</span>
      </div>

      <div ref={termRef} className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
        {allLines.slice(0, visibleCount).map((line, i) => (
          <div key={i} className={`${TYPE_COLORS[line.type]} ${line.text === "" ? "h-3" : ""}`}>
            {line.text}
          </div>
        ))}
        {visibleCount < allLines.length && (
          <span className="inline-block w-2 h-3.5 bg-foreground/70 animate-pulse" />
        )}
      </div>
    </div>
  );
}
