import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useModelSettings, AVAILABLE_MODELS } from "@/hooks/useModelSettings";

export function ModelSwitcher() {
  const { model, currentModel, setModel } = useModelSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const claudeModels = AVAILABLE_MODELS.filter((m) => m.provider === "claude");
  const openaiModels = AVAILABLE_MODELS.filter((m) => m.provider === "openai");

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
      >
        <span>{currentModel.name}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 w-56 rounded-xl border border-border overflow-hidden shadow-xl z-50 animate-scale-in"
          style={{ backgroundColor: "hsl(var(--popover))" }}
        >
          {/* Claude models */}
          <div className="px-3 py-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Claude</span>
          </div>
          {claudeModels.map((m) => (
            <button
              key={m.id}
              onClick={() => { setModel(m.id); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                model === m.id
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              {m.name}
            </button>
          ))}

          <div className="h-px bg-border" />

          {/* OpenAI models */}
          <div className="px-3 py-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">OpenAI</span>
          </div>
          {openaiModels.map((m) => (
            <button
              key={m.id}
              onClick={() => { setModel(m.id); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                model === m.id
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
