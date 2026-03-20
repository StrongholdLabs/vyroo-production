import { Monitor } from "lucide-react";
import type { CodeLine } from "@/data/conversations";

interface ComputerThumbnailProps {
  codeLines: CodeLine[];
  fileName: string;
  onClick: () => void;
}

export function ComputerThumbnail({ codeLines, fileName, onClick }: ComputerThumbnailProps) {
  const previewLines = codeLines.slice(0, 8);

  return (
    <div
      onClick={onClick}
      className="w-56 rounded-lg border border-border overflow-hidden cursor-pointer hover:border-muted-foreground/40 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] group"
      style={{ backgroundColor: "hsl(var(--computer-bg))" }}
    >
      {/* Mini header */}
      <div
        className="flex items-center gap-1.5 px-2 py-1 border-b"
        style={{ borderColor: "hsl(var(--computer-border))", backgroundColor: "hsl(var(--computer-header))" }}
      >
        <Monitor size={9} className="text-muted-foreground" />
        <span className="text-[8px] text-muted-foreground truncate">{fileName}</span>
      </div>

      {/* Mini code preview */}
      <div className="px-2 py-1.5 font-mono" style={{ backgroundColor: "hsl(var(--code-bg))" }}>
        {previewLines.map((line, i) => (
          <div key={i} className="flex text-[6px] leading-[1.6]">
            <span className="w-3 text-right pr-1 text-muted-foreground/20 select-none flex-shrink-0">
              {line.num}
            </span>
            <span className={`${line.color || "text-foreground"} truncate opacity-70`}>
              {line.content || "\u00A0"}
            </span>
          </div>
        ))}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors rounded-lg pointer-events-none" />
    </div>
  );
}
