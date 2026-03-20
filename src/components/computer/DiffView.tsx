import type { CodeLine } from "@/data/conversations";

export interface DiffLine {
  num: number;
  content: string;
  type: "added" | "removed" | "unchanged" | "context";
}

// Generate a simulated diff from code lines (showing the "creation" as all additions)
export function generateDiff(codeLines: CodeLine[]): DiffLine[] {
  return codeLines.map((line) => ({
    num: line.num,
    content: line.content,
    type: "added" as const,
  }));
}

const DIFF_GUTTER_COLORS = {
  added: "bg-[hsl(142_40%_18%)]",
  removed: "bg-[hsl(0_40%_18%)]",
  unchanged: "",
  context: "",
};

const DIFF_LINE_COLORS = {
  added: "bg-[hsl(142_30%_12%)]",
  removed: "bg-[hsl(0_30%_12%)]",
  unchanged: "",
  context: "",
};

const DIFF_TEXT_COLORS = {
  added: "text-[hsl(142_60%_65%)]",
  removed: "text-[hsl(0_60%_65%)]",
  unchanged: "text-foreground",
  context: "text-muted-foreground",
};

interface DiffViewProps {
  diffLines: DiffLine[];
  visibleCount: number;
}

export function DiffView({ diffLines, visibleCount }: DiffViewProps) {
  return (
    <div className="p-4 text-[13px] leading-[1.7] font-mono">
      {diffLines.slice(0, visibleCount).map((line, i) => (
        <div key={i} className={`flex ${DIFF_LINE_COLORS[line.type]}`}>
          {/* Diff gutter */}
          <span className={`w-5 flex items-center justify-center flex-shrink-0 text-[10px] select-none ${DIFF_GUTTER_COLORS[line.type]}`}>
            {line.type === "added" ? "+" : line.type === "removed" ? "−" : " "}
          </span>
          <span className="w-8 text-right pr-3 text-muted-foreground/30 select-none tabular-nums flex-shrink-0">
            {line.num}
          </span>
          <span className={`${DIFF_TEXT_COLORS[line.type]} break-all`}>
            {line.content || "\u00A0"}
          </span>
        </div>
      ))}
    </div>
  );
}
