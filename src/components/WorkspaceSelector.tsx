import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Sparkles, ShoppingCart, HeartPulse, GraduationCap, Landmark, Megaphone, Terminal, Puzzle } from "lucide-react";
import { verticals } from "@/lib/plugins/verticals";
import type { VerticalType } from "@/lib/plugins/types";

const iconMap: Record<string, React.ElementType> = {
  sparkles: Sparkles,
  "shopping-cart": ShoppingCart,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  landmark: Landmark,
  megaphone: Megaphone,
  terminal: Terminal,
  puzzle: Puzzle,
};

const STORAGE_KEY = "vyroo-workspace";

function getStoredWorkspace(): VerticalType {
  if (typeof window === "undefined") return "general";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored in verticals) return stored as VerticalType;
  return "general";
}

export function WorkspaceSelector() {
  const [selected, setSelected] = useState<VerticalType>(getStoredWorkspace);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = verticals[selected];
  const CurrentIcon = iconMap[current.iconName] ?? Sparkles;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [open]);

  function selectWorkspace(id: VerticalType) {
    setSelected(id);
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, id);
    window.dispatchEvent(new CustomEvent("workspace-changed", { detail: { workspace: id } }));
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
      >
        <CurrentIcon size={14} className="opacity-70" />
        <span className="font-medium">{current.name}</span>
        <ChevronDown size={12} className={`opacity-50 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 rounded-xl border border-border/50 bg-background/80 backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-1.5 max-h-[360px] overflow-y-auto">
            {Object.values(verticals).map((v) => {
              const Icon = iconMap[v.iconName] ?? Sparkles;
              const isActive = v.id === selected;
              return (
                <button
                  key={v.id}
                  onClick={() => selectWorkspace(v.id)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                    isActive
                      ? "bg-white/10 text-foreground"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <div className={`mt-0.5 flex-shrink-0 p-1.5 rounded-md ${isActive ? "bg-white/10" : "bg-white/5"}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium leading-tight">{v.name}</div>
                    <div className="text-xs text-muted-foreground/70 mt-0.5 leading-snug">{v.description}</div>
                  </div>
                  {isActive && (
                    <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-foreground" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-border/30 px-3 py-2">
            <Link
              to="/plugins"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Puzzle size={12} />
              <span>Browse Plugins</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
