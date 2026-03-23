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
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [inputValue, setInputValue] = useState("");
  const termRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const allLines = generateTerminalLines(steps);
  const prevStepsRef = useRef(steps);
  const MAX_HISTORY = 50;

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

  // Extract commands from visible lines to populate history
  useEffect(() => {
    const commands = allLines
      .slice(0, visibleCount)
      .filter(l => l.type === "command" && l.text.startsWith("$"))
      .map(l => l.text.replace(/^\$\s*/, "").replace(/█$/, "").trim())
      .filter(Boolean);
    if (commands.length > 0) {
      setCommandHistory(prev => {
        const merged = [...new Set([...prev, ...commands])];
        return merged.slice(-MAX_HISTORY);
      });
    }
  }, [visibleCount, allLines]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
      setHistoryIndex(newIndex);
      setInputValue(commandHistory[commandHistory.length - 1 - newIndex] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex <= 0) {
        setHistoryIndex(-1);
        setInputValue("");
      } else {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex] || "");
      }
    } else if (e.key === "Enter" && inputValue.trim()) {
      setCommandHistory(prev => [...prev.slice(-(MAX_HISTORY - 1)), inputValue.trim()]);
      setInputValue("");
      setHistoryIndex(-1);
    }
  };

  const isFinished = visibleCount >= allLines.length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "hsl(var(--code-bg))" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes terminal-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .terminal-cursor {
          display: inline-block;
          width: 7px;
          height: 14px;
          background: hsl(50 70% 65% / 0.8);
          animation: terminal-blink 1s step-end infinite;
          vertical-align: text-bottom;
          margin-left: 1px;
        }
      ` }} />
      {/* Terminal header bar */}
      <div className="flex items-center gap-2 px-4 py-1.5 border-b flex-shrink-0" style={{ borderColor: "hsl(var(--computer-border))", backgroundColor: "hsl(var(--computer-header))" }}>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "hsl(0 60% 50%)" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "hsl(45 70% 50%)" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "hsl(142 50% 45%)" }} />
        </div>
        <span className="text-[10px] text-muted-foreground ml-2 font-mono">vyroo — bash — 80×24</span>
      </div>

      <div
        ref={termRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed"
        onClick={() => inputRef.current?.focus()}
      >
        {allLines.slice(0, visibleCount).map((line, i) => (
          <div key={i} className={`${TYPE_COLORS[line.type]} ${line.text === "" ? "h-3" : ""}`}>
            {line.text}
          </div>
        ))}
        {!isFinished && (
          <span className="terminal-cursor" />
        )}
        {isFinished && (
          <div className="flex items-center">
            <span className="text-[hsl(50_70%_65%)]">$ </span>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={e => { setInputValue(e.target.value); setHistoryIndex(-1); }}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none outline-none text-[hsl(50_70%_65%)] flex-1 font-mono text-xs caret-transparent"
              spellCheck={false}
              autoComplete="off"
            />
            <span className="terminal-cursor" />
          </div>
        )}
      </div>
    </div>
  );
}
