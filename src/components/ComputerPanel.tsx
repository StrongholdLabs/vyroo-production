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

interface CodeLine {
  num: number;
  content: string;
  color?: string;
}

const mockCode: CodeLine[] = [
  { num: 1, content: "# Comparative Analysis: Top 5 DTC Skincare Brands and Pricing Strategies", color: "text-red-400" },
  { num: 2, content: "(2025-2026)", color: "text-red-400" },
  { num: 3, content: "" },
  { num: 4, content: "This report provides a comprehensive analysis of the top five Direct-to-", color: "text-foreground" },
  { num: 5, content: "Consumer (DTC) skincare brands currently leading the market. It examines", color: "text-foreground" },
  { num: 6, content: "their market positioning, key product pricing, and the underlying", color: "text-foreground" },
  { num: 7, content: "strategies that drive their commercial success.", color: "text-foreground" },
  { num: 8, content: "" },
  { num: 9, content: "## 1. Overview of the Top 5 DTC Skincare Brands", color: "text-red-400" },
  { num: 10, content: "" },
  { num: 11, content: "The following brands have been selected based on their market influence,", color: "text-foreground" },
  { num: 12, content: "viral growth, and distinct pricing models:", color: "text-foreground" },
  { num: 13, content: "" },
  { num: 14, content: "| Brand | Market Positioning | Core Philosophy | Target Audience |", color: "text-foreground" },
  { num: 15, content: "| :---- | :---- | :---- | :---- |", color: "text-muted-foreground" },
  { num: 16, content: "| **The Ordinary** | Value/Budget Leader | Clinical formulations with", color: "text-foreground" },
  { num: 17, content: "price integrity. | Budget-conscious, ingredient-savvy consumers. |", color: "text-foreground" },
  { num: 18, content: "| **Glossier** | Mid-Tier Lifestyle | \"Skin first, makeup second\"", color: "text-foreground" },
  { num: 19, content: "community-driven beauty. | Millennials and Gen Z seeking a \"cool-girl\"", color: "text-foreground" },
  { num: 20, content: "aesthetic. |", color: "text-foreground" },
  { num: 21, content: "| **Rhode Skin** | Viral/Celebrity-Led | Curated essentials for a", color: "text-foreground" },
  { num: 22, content: "\"glazed\" look. | Trend-followers and fans of Hailey Bieber. |", color: "text-foreground" },
  { num: 23, content: "| **Dieux Skin** | Science/Transparency | Radically transparent,", color: "text-foreground" },
  { num: 24, content: "clinically vetted formulas. | Conscious consumers valuing science and", color: "text-foreground" },
  { num: 25, content: "ethics. |", color: "text-foreground" },
  { num: 26, content: "| **Drunk Elephant** | Premium/Luxury | \"Clean-clinical\" biocompatible", color: "text-foreground" },
  { num: 27, content: "skincare. | High-income consumers seeking high-performance results. |", color: "text-foreground" },
  { num: 28, content: "" },
  { num: 29, content: "## 2. Comparative Pricing Table", color: "text-red-400" },
  { num: 30, content: "" },
  { num: 31, content: "The table below compares the pricing of key product categories across", color: "text-foreground" },
  { num: 32, content: "the five brands (prices are approximate for 2025-2026).", color: "text-foreground" },
];

interface Step {
  id: number;
  label: string;
  status: "complete" | "active" | "pending";
}

const computerSteps: Step[] = [
  { id: 1, label: "Research DTC skincare market data", status: "complete" },
  { id: 2, label: "Analyze pricing strategies across brands", status: "complete" },
  { id: 3, label: "Build comparative framework", status: "complete" },
  { id: 4, label: "Compile and deliver the final comparative report", status: "complete" },
];

interface ComputerPanelProps {
  visible: boolean;
  onClose: () => void;
}

export function ComputerPanel({ visible, onClose }: ComputerPanelProps) {
  const [activeStep, setActiveStep] = useState(4);
  const [stepsExpanded, setStepsExpanded] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);

  if (!visible) return null;

  const currentStep = computerSteps[activeStep - 1];
  const totalSteps = computerSteps.length;

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
        <Loader2 size={12} className="text-success animate-spin-slow" />
        <span>Manus is using <span className="text-foreground font-medium">Editor</span></span>
        <span className="text-muted-foreground/50">·</span>
        <span>Creating file dtc_skincare_analysis_final.md</span>
      </div>

      {/* File tab */}
      <div className="px-4 py-1.5 border-b flex-shrink-0" style={{ borderColor: "hsl(var(--computer-border))" }}>
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs text-muted-foreground"
          style={{ backgroundColor: "hsl(var(--code-bg))" }}
        >
          <span>dtc_skincare_analysis_final.md</span>
        </div>
      </div>

      {/* Code view */}
      <div ref={codeRef} className="flex-1 overflow-y-auto code-block">
        <div className="p-4 text-xs leading-[1.7]">
          {mockCode.map((line) => (
            <div key={line.num} className="flex">
              <span className="w-8 text-right pr-3 text-muted-foreground/30 select-none tabular-nums flex-shrink-0">
                {line.num}
              </span>
              <span className={`${line.color || "text-foreground"} break-all`}>
                {line.content || "\u00A0"}
              </span>
            </div>
          ))}
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

        {/* Timeline scrubber */}
        <div className="flex-1 mx-3 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "hsl(var(--step-line))" }}>
            <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: "100%" }} />
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-[10px] text-muted-foreground">live</span>
          </div>
        </div>
      </div>

      {/* Step indicator at bottom */}
      <div
        className="border-t flex-shrink-0 cursor-pointer"
        style={{ borderColor: "hsl(var(--computer-border))", backgroundColor: "hsl(var(--computer-header))" }}
        onClick={() => setStepsExpanded(!stepsExpanded)}
      >
        {stepsExpanded && (
          <div className="px-4 py-2 space-y-1 border-b" style={{ borderColor: "hsl(var(--computer-border))" }}>
            {computerSteps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                  step.id === activeStep ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStep(step.id);
                }}
              >
                <Check size={12} className="text-success flex-shrink-0" />
                <span className="truncate">{step.label}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Check size={16} className="text-success flex-shrink-0" />
          <span className="text-sm text-foreground flex-1 truncate">{currentStep.label}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{activeStep} / {totalSteps}</span>
          <ChevronUp
            size={14}
            className={`text-muted-foreground transition-transform duration-200 ${stepsExpanded ? "" : "rotate-180"}`}
          />
        </div>
      </div>
    </div>
  );
}
