import {
  Star,
  Download,
  Play,
  Settings2,
  Search,
  Code,
  BarChart3,
  Globe,
  PenTool,
  Puzzle,
  Sparkles,
  Bot,
  FileText,
  Cpu,
  Microscope,
  Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AgentTemplate, AgentCategory } from "@/types/agents";

// ─── Icon mapping ───

const iconMap: Record<string, LucideIcon> = {
  Search,
  Code,
  BarChart3,
  Globe,
  PenTool,
  Puzzle,
  Sparkles,
  Bot,
  FileText,
  Cpu,
  Microscope,
  Wand2,
};

function getIcon(iconName: string): LucideIcon {
  return iconMap[iconName] ?? Puzzle;
}

// ─── Category colors ───

const categoryColors: Record<AgentCategory, { bg: string; text: string; border: string; dot: string }> = {
  research: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30", dot: "bg-blue-400" },
  coding:   { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/30", dot: "bg-purple-400" },
  data:     { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  browsing: { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30", dot: "bg-orange-400" },
  content:  { bg: "bg-pink-500/15", text: "text-pink-400", border: "border-pink-500/30", dot: "bg-pink-400" },
  custom:   { bg: "bg-zinc-500/15", text: "text-zinc-400", border: "border-zinc-500/30", dot: "bg-zinc-400" },
};

const categoryLabels: Record<AgentCategory, string> = {
  research: "Research",
  coding: "Coding",
  data: "Data Analysis",
  browsing: "Web Browsing",
  content: "Content",
  custom: "Custom",
};

// ─── Helpers ───

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

// ─── AgentCard ───

interface AgentCardProps {
  template: AgentTemplate;
  onRun: () => void;
  onConfigure: () => void;
  isRunning?: boolean;
}

export function AgentCard({ template, onRun, onConfigure, isRunning }: AgentCardProps) {
  const Icon = getIcon(template.icon_name);
  const colors = categoryColors[template.category] ?? categoryColors.custom;

  return (
    <div
      className={`group relative rounded-xl border transition-all duration-200 hover:shadow-lg hover:shadow-black/20 bg-card/50 backdrop-blur ${
        isRunning
          ? "border-primary/40 bg-primary/5"
          : "border-border/50 hover:border-primary/30"
      }`}
    >
      {/* Featured badge */}
      {template.is_featured && (
        <div className="absolute top-3 right-3 flex items-center gap-1">
          <Sparkles size={11} className="text-amber-400" />
          <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wider">
            Featured
          </span>
        </div>
      )}

      {/* Running indicator */}
      {isRunning && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span className="text-[10px] font-medium text-primary uppercase tracking-wider">
            Running
          </span>
        </div>
      )}

      <div className="p-5">
        {/* Icon + Name + Author */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colors.bg} ${colors.border} border`}
          >
            <Icon size={20} className={colors.text} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{template.name}</h3>
            <span className="text-[11px] text-muted-foreground">by {template.author}</span>
          </div>
        </div>

        {/* Category badge */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
            {categoryLabels[template.category] ?? template.category}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
          {template.description}
        </p>

        {/* Capability tags */}
        {template.capabilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {template.capabilities.slice(0, 3).map((cap) => (
              <span
                key={cap}
                className="text-[10px] text-muted-foreground bg-accent/50 px-2 py-0.5 rounded-md truncate max-w-[140px]"
              >
                {cap}
              </span>
            ))}
            {template.capabilities.length > 3 && (
              <span className="text-[10px] text-muted-foreground/60 px-1 py-0.5">
                +{template.capabilities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Star size={11} className="text-amber-400 fill-amber-400" />
            <span className="tabular-nums">{template.rating.toFixed(1)}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Download size={11} />
            <span className="tabular-nums">{formatCount(template.install_count)}</span>
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRun}
            disabled={isRunning}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              isRunning
                ? "opacity-50 cursor-not-allowed bg-accent text-muted-foreground"
                : "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
            }`}
          >
            <Play size={13} />
            {isRunning ? "Running..." : "Run Agent"}
          </button>
          <button
            onClick={onConfigure}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground border border-border hover:border-muted-foreground/30 hover:bg-accent transition-all duration-200"
          >
            <Settings2 size={13} />
            Configure
          </button>
        </div>
      </div>
    </div>
  );
}
