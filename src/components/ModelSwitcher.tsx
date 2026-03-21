import { ChevronDown, Crown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useModelSettings, AVAILABLE_MODELS, type AIProvider } from "@/hooks/useModelSettings";

const FREE_MODELS = new Set(["claude-haiku-4-5-20251001", "gpt-4o-mini"]);

const PROVIDER_LABELS: Record<AIProvider, string> = {
  claude: "Claude",
  openai: "OpenAI",
  gemini: "Gemini",
  together: "Meta Llama",
};

const PROVIDER_ORDER: AIProvider[] = ["claude", "openai", "gemini", "together"];

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

  // Group models by provider
  const modelsByProvider = PROVIDER_ORDER.map((provider) => ({
    provider,
    label: PROVIDER_LABELS[provider],
    models: AVAILABLE_MODELS.filter((m) => m.provider === provider),
  })).filter((group) => group.models.length > 0);

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
          className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-border overflow-hidden shadow-xl z-50 animate-scale-in"
          style={{ backgroundColor: "hsl(var(--popover))" }}
        >
          {modelsByProvider.map((group, groupIdx) => (
            <div key={group.provider}>
              {groupIdx > 0 && <div className="h-px bg-border" />}
              <div className="px-3 py-2">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </span>
              </div>
              {group.models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setModel(m.id); setOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    model === m.id
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span>{m.name}</span>
                      {!FREE_MODELS.has(m.id) && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-500/10 text-amber-500">
                          <Crown size={9} />
                          Pro
                        </span>
                      )}
                    </div>
                    {m.description && (
                      <span className="text-[10px] text-muted-foreground/70 ml-2">{m.description}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
