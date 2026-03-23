import { Search, Code, FileText, BarChart3, Image, Lightbulb } from "lucide-react";

const suggestions = [
  { icon: Search, label: "Research" },
  { icon: Code, label: "Code" },
  { icon: FileText, label: "Write" },
  { icon: BarChart3, label: "Analyze" },
  { icon: Image, label: "Create" },
  { icon: Lightbulb, label: "Brainstorm" },
];

export function ActionChips() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {suggestions.map((item) => (
        <button
          key={item.label}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-muted-foreground/70 hover:text-foreground border border-border/30 hover:border-border/60 hover:bg-secondary/30 transition-all duration-150"
        >
          <item.icon size={12} />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
