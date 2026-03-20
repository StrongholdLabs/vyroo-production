import { Globe, ExternalLink } from "lucide-react";
import type { ProjectInfo } from "@/data/conversations";

interface ProjectInitCardProps {
  project: ProjectInfo;
  onView?: () => void;
}

export function ProjectInitCard({ project, onView }: ProjectInitCardProps) {
  const statusLabel =
    project.status === "initialized"
      ? "Project initialized"
      : project.status === "building"
        ? "Building..."
        : "Ready";

  return (
    <div
      className="rounded-xl border border-border overflow-hidden transition-shadow hover:shadow-md"
      style={{ backgroundColor: "hsl(var(--surface-elevated))" }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "hsl(var(--success-soft))" }}
        >
          <Globe size={16} className="text-success" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
          <p className="text-xs text-muted-foreground">{statusLabel}</p>
        </div>
        <button
          onClick={onView}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg border border-border text-foreground hover:bg-accent transition-colors active:scale-[0.97]"
        >
          View
          <ExternalLink size={12} />
        </button>
      </div>
    </div>
  );
}
