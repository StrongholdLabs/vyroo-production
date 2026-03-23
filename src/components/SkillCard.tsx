import React from "react";
import {
  Search,
  Code,
  FileText,
  Eye,
  TrendingUp,
  Link2,
  Lock,
  Sparkles,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { Skill } from "@/hooks/useSkills";

const skillIconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  search: Search,
  code: Code,
  "file-text": FileText,
  eye: Eye,
  "trending-up": TrendingUp,
  "link-2": Link2,
};

function getSkillIcon(iconName: string) {
  return skillIconMap[iconName] ?? Sparkles;
}

const categoryColors: Record<string, { bg: string; text: string; label: string }> = {
  core: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Core" },
  analysis: { bg: "bg-purple-500/10", text: "text-purple-400", label: "Analysis" },
  integration: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Integration" },
};

interface SkillCardProps {
  skill: Skill;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  isToggling?: boolean;
}

export function SkillCard({ skill, enabled, onToggle, isToggling }: SkillCardProps) {
  const Icon = getSkillIcon(skill.icon_name);
  const category = categoryColors[skill.category] ?? categoryColors.core;

  return (
    <div
      className={`relative rounded-xl border p-4 transition-all duration-200 ${
        enabled
          ? "border-border bg-card shadow-sm"
          : "border-border/50 bg-card/50 opacity-75"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              enabled ? "bg-accent" : "bg-accent/50"
            }`}
          >
            <Icon size={18} className={enabled ? "text-foreground" : "text-muted-foreground"} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-foreground">{skill.name}</h3>
              {skill.is_premium && (
                <Lock size={12} className="text-amber-400" />
              )}
            </div>
            <span
              className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 ${category.bg} ${category.text}`}
            >
              {category.label}
            </span>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          disabled={isToggling || skill.is_premium}
        />
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        {skill.description}
      </p>

      {/* Tool chips */}
      <div className="flex flex-wrap gap-1">
        {skill.tools.map((tool) => (
          <span
            key={tool}
            className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent/60 text-muted-foreground font-mono"
          >
            {tool}
          </span>
        ))}
      </div>
    </div>
  );
}
