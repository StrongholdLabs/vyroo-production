import { useState, useEffect, useRef } from "react";
import {
  X,
  Monitor,
  Maximize2,
  Square,
  SkipBack,
  SkipForward,
  ChevronUp,
  Check,
  Loader2,
} from "lucide-react";
import type { CodeLine, Step } from "@/data/conversations";

interface ComputerPanelProps {
  visible: boolean;
  onClose: () => void;
  codeLines: CodeLine[];
  steps: Step[];
  fileName: string;
  editorLabel: string;
}

export function ComputerPanel({ visible, onClose, codeLines, steps, fileName, editorLabel }: ComputerPanelProps) {
  const [activeStep, setActiveStep] = useState(steps.length);
  const [stepsExpanded, setStepsExpanded] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const codeRef = useRef<HTMLDivElement>(null);
  const prevCodeRef = useRef(codeLines);

  // Reset typing animation when code changes (conversation switch)
  useEffect(() => {
    if (prevCodeRef.current !== codeLines) {
      setVisibleLines(0);
      setActiveStep(steps.length);
      prevCodeRef.current = codeLines;
    }
  }, [codeLines, steps.length]);

  // Typing animation: reveal lines one by one
  useEffect(() => {
    if (visibleLines >= codeLines.length) return;
    const delay = visibleLines === 0 ? 300 : 60 + Math.random() * 80;
    const timer = setTimeout(() => {
      setVisibleLines((v) => v + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [visibleLines, codeLines.length]);

  // Auto-scroll as lines appear
  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, [visibleLines]);

  if (!visible) return null;

  const currentStep = steps[activeStep - 1] || steps[steps.length - 1];
  const totalSteps = steps.length;
  const isTyping = visibleLines < codeLines.length;
  const progress = codeLines.length > 0 ? Math.round((visibleLines / codeLines.length) * 100) : 100;

  return (
    <div className="computer-panel flex flex-col h-full w-full lg:w-[480px] xl:w-[540px] flex-shrink-0">
      {/* Header */}
      <div className="computer-header flex items-center justify-between px-4 h-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Monitor size={14} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground font-body">Manus's Computer</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded">
            <Square size={14} />
          </button>
          <button className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded">
            <Maximize2 size={14} />
          </button>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 border-b flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0"
        style={{ borderColor: "hsl(var(--computer-border))" }}
      >
        {isTyping ? (
          <Loader2 size={12} className="text-success animate-spin" />
        ) : (
          <Check size={12} className="text-success" />
        )}
        <span>Manus is using <span className="text-foreground font-medium">{editorLabel}</span></span>
        <span className="text-muted-foreground/50">·</span>
        <span>{isTyping ? "Creating" : "Created"} file {fileName}</span>
      </div>

      {/* File tab */}
      <div className="px-4 py-1.5 border-b flex-shrink-0" style={{ borderColor: "hsl(var(--computer-border))" }}>
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs text-muted-foreground"
          style={{ backgroundColor: "hsl(var(--code-bg))" }}
        >
          <span>{fileName}</span>
        </div>
      </div>

      {/* Code view with typing effect */}
      <div ref={codeRef} className="flex-1 overflow-y-auto code-block">
        <div className="p-4 text-xs leading-[1.7]">
          {codeLines.slice(0, visibleLines).map((line, i) => (
            <div key={`${line.num}-${i}`} className="flex typing-line">
              <span className="w-8 text-right pr-3 text-muted-foreground/30 select-none tabular-nums flex-shrink-0">
                {line.num}
              </span>
              <span className={`${line.color || "text-foreground"} break-all`}>
                {line.content || "\u00A0"}
              </span>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center mt-1">
              <span className="w-8 text-right pr-3 text-muted-foreground/30 select-none tabular-nums flex-shrink-0">
                {visibleLines + 1}
              </span>
              <span className="typing-cursor" />
            </div>
          )}
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex items-center justify-between px-4 py-2 border-t flex-shrink-0"
        style={{ borderColor: "hsl(var(--computer-border))", backgroundColor: "hsl(var(--computer-header))" }}
      >
        <div className="flex items-center gap-2">
          <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <SkipBack size={14} />
          </button>
          <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <SkipForward size={14} />
          </button>
        </div>
        <div className="flex-1 mx-3 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "hsl(var(--step-line))" }}>
            <div className="h-full rounded-full bg-success transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${isTyping ? "bg-success animate-pulse" : "bg-success"}`} />
            <span className="text-[10px] text-muted-foreground">{isTyping ? "writing" : "done"}</span>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div
        className="border-t flex-shrink-0 cursor-pointer"
        style={{ borderColor: "hsl(var(--computer-border))", backgroundColor: "hsl(var(--computer-header))" }}
        onClick={() => setStepsExpanded(!stepsExpanded)}
      >
        {stepsExpanded && (
          <div className="px-4 py-2 space-y-1 border-b" style={{ borderColor: "hsl(var(--computer-border))" }}>
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                  step.id === activeStep ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={(e) => { e.stopPropagation(); setActiveStep(step.id); }}
              >
                <Check size={12} className="text-success flex-shrink-0" />
                <span className="truncate">{step.label}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Check size={16} className="text-success flex-shrink-0" />
          <span className="text-sm text-foreground flex-1 truncate">{currentStep?.label}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{Math.min(activeStep, totalSteps)} / {totalSteps}</span>
          <ChevronUp
            size={14}
            className={`text-muted-foreground transition-transform duration-200 ${stepsExpanded ? "" : "rotate-180"}`}
          />
        </div>
      </div>
    </div>
  );
}
