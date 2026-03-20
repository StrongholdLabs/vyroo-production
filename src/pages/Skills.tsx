import { Link } from "react-router-dom";
import { ArrowLeft, Zap, Loader2 } from "lucide-react";
import { SkillCard } from "@/components/SkillCard";
import {
  useAvailableSkills,
  useUserSkills,
  useToggleSkill,
} from "@/hooks/useSkills";
import type { Skill } from "@/hooks/useSkills";

const categoryOrder: Skill["category"][] = ["core", "analysis", "integration"];
const categoryLabels: Record<string, string> = {
  core: "Core Skills",
  analysis: "Analysis",
  integration: "Integrations",
};

export default function Skills() {
  const { data: skills, isLoading: skillsLoading } = useAvailableSkills();
  const { data: enabledSkills, isLoading: userLoading } = useUserSkills();
  const toggleSkill = useToggleSkill();

  const isLoading = skillsLoading || userLoading;
  const enabledSet = new Set(enabledSkills ?? []);
  const enabledCount = enabledSkills?.length ?? 0;
  const totalCount = skills?.length ?? 0;

  const grouped = categoryOrder.reduce(
    (acc, cat) => {
      acc[cat] = (skills ?? []).filter((s) => s.category === cat);
      return acc;
    },
    {} as Record<string, Skill[]>,
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(var(--background))" }}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <Link
            to="/dashboard"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-foreground" />
            <h1 className="text-xl font-semibold text-foreground font-body">
              Skills
            </h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-6 ml-10">
          Choose which capabilities Vyroo can use
        </p>

        {/* Summary bar */}
        {!isLoading && (
          <div className="flex items-center gap-2 mb-8 ml-10">
            <div className="text-xs font-medium text-muted-foreground px-3 py-1.5 rounded-lg border border-border bg-card">
              <span className="text-foreground tabular-nums">{enabledCount}</span>
              {" of "}
              <span className="tabular-nums">{totalCount}</span>
              {" skills enabled"}
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Category sections */}
        {!isLoading && (
          <div className="space-y-10 ml-10">
            {categoryOrder.map((cat) => {
              const items = grouped[cat];
              if (!items || items.length === 0) return null;
              return (
                <section key={cat}>
                  <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                    {categoryLabels[cat]}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((skill) => (
                      <SkillCard
                        key={skill.id}
                        skill={skill}
                        enabled={enabledSet.has(skill.id)}
                        onToggle={(enabled) =>
                          toggleSkill.mutate({ skillId: skill.id, enabled })
                        }
                        isToggling={toggleSkill.isPending}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
