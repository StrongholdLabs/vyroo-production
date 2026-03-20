import { useState, useEffect } from "react";
import { Check, Loader2, ChevronRight, ExternalLink, Globe, Code, FileText, Search } from "lucide-react";

interface Step {
  id: number;
  label: string;
  detail: string;
  status: "complete" | "active" | "pending";
  icon: React.ReactNode;
}

const mockSteps: Step[] = [
  { id: 1, label: "Understanding task", detail: "Parsing your requirements and planning approach", status: "complete", icon: <Search size={14} /> },
  { id: 2, label: "Researching", detail: "Browsing documentation and gathering references", status: "complete", icon: <Globe size={14} /> },
  { id: 3, label: "Setting up project", detail: "Creating file structure and installing dependencies", status: "complete", icon: <FileText size={14} /> },
  { id: 4, label: "Writing code", detail: "Building components and implementing logic", status: "active", icon: <Code size={14} /> },
  { id: 5, label: "Testing & refining", detail: "Running tests and polishing the output", status: "pending", icon: <Check size={14} /> },
];

export function TaskExecution() {
  const [steps, setSteps] = useState(mockSteps);
  const [expandedStep, setExpandedStep] = useState<number | null>(4);

  // Simulate progress
  useEffect(() => {
    const t = setTimeout(() => {
      setSteps((prev) =>
        prev.map((s) =>
          s.id === 4 ? { ...s, status: "complete" as const } : s.id === 5 ? { ...s, status: "active" as const } : s
        )
      );
      setExpandedStep(5);
    }, 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Left: Steps panel */}
      <div className="w-full lg:w-96 lg:border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-display text-xl text-foreground">Build a portfolio website</h2>
          <p className="text-xs text-muted-foreground mt-1">Started 2 minutes ago</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {steps.map((step, i) => (
              <div key={step.id} className="relative">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div
                    className={`absolute left-[11px] top-8 w-[1.5px] h-[calc(100%-8px)] transition-colors duration-500 ${
                      step.status === "complete" ? "bg-success" : "bg-border"
                    }`}
                  />
                )}

                <button
                  onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                  className="relative flex items-start gap-3 w-full text-left p-2 rounded-lg hover:bg-accent/50 transition-colors duration-150 group"
                >
                  {/* Status dot */}
                  <div className="mt-0.5 flex-shrink-0">
                    {step.status === "complete" ? (
                      <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
                        <Check size={12} className="text-success" />
                      </div>
                    ) : step.status === "active" ? (
                      <div className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center">
                        <Loader2 size={12} className="text-foreground animate-spin" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm ${
                          step.status === "active"
                            ? "font-medium text-foreground"
                            : step.status === "complete"
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                      {step.status === "active" && (
                        <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                          In progress
                        </span>
                      )}
                    </div>

                    {expandedStep === step.id && (
                      <p className="text-xs text-muted-foreground mt-1 animate-fade-in">
                        {step.detail}
                      </p>
                    )}
                  </div>

                  <ChevronRight
                    size={14}
                    className={`mt-1 text-muted-foreground/50 transition-transform duration-200 ${
                      expandedStep === step.id ? "rotate-90" : ""
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Input area at bottom */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 px-3 py-2 bg-popover border border-border rounded-xl">
            <input
              type="text"
              placeholder="Send a message..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none font-body"
            />
            <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Right: Preview/Output panel */}
      <div className="flex-1 flex flex-col bg-popover">
        {/* Browser-like toolbar */}
        <div className="flex items-center gap-2 px-4 h-10 border-b border-border bg-card">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-[hsl(45_80%_55%)]" />
            <div className="w-2.5 h-2.5 rounded-full bg-success/50" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-1.5 px-3 py-0.5 bg-secondary/60 rounded-md text-xs text-muted-foreground max-w-xs truncate">
              <Globe size={10} />
              <span>localhost:3000</span>
            </div>
          </div>
          <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <ExternalLink size={14} />
          </button>
        </div>

        {/* Preview content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-md animate-fade-up">
            {/* Mock portfolio preview */}
            <div className="mx-auto w-full aspect-video bg-secondary/50 rounded-xl border border-border overflow-hidden">
              <div className="h-8 bg-card border-b border-border flex items-center px-3 gap-2">
                <div className="w-2 h-2 rounded-full bg-border" />
                <div className="w-2 h-2 rounded-full bg-border" />
                <div className="w-2 h-2 rounded-full bg-border" />
                <div className="flex-1 mx-6 h-3 bg-secondary rounded-full" />
              </div>
              <div className="p-4 space-y-3">
                <div className="h-3 w-32 bg-border/80 rounded-full" />
                <div className="h-2 w-48 bg-border/50 rounded-full" />
                <div className="h-2 w-40 bg-border/50 rounded-full" />
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="aspect-square bg-border/40 rounded-lg" />
                  <div className="aspect-square bg-border/40 rounded-lg" />
                  <div className="aspect-square bg-border/40 rounded-lg" />
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Building your portfolio...
              </p>
              <div className="mt-3 h-1 bg-secondary rounded-full overflow-hidden max-w-48 mx-auto">
                <div className="h-full bg-foreground/30 rounded-full animate-pulse" style={{ width: "72%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
