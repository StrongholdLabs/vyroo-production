import { Presentation, Globe, Smartphone, Palette, MoreHorizontal } from "lucide-react";

const actions = [
  { icon: Presentation, label: "Create slides" },
  { icon: Globe, label: "Build website" },
  { icon: Smartphone, label: "Develop apps" },
  { icon: Palette, label: "Design" },
  { icon: MoreHorizontal, label: "More" },
];

export function ActionChips() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {actions.map((action) => (
        <button key={action.label} className="chip">
          <action.icon size={16} className="text-muted-foreground" />
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}
