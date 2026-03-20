import { useEffect, useRef, useMemo } from "react";
import type { CodeLine } from "@/data/conversations";
import { tokenize } from "./SyntaxHighlighter";

interface CodeMinimapProps {
  codeLines: CodeLine[];
  visibleLines: number;
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  onScroll: (ratio: number) => void;
}

const MINIMAP_COLORS: Record<string, string> = {
  keyword: "hsl(280 60% 70%)",
  string: "hsl(100 50% 60%)",
  comment: "hsl(30 6% 40%)",
  number: "hsl(30 80% 65%)",
  tag: "hsl(355 65% 65%)",
  attribute: "hsl(200 60% 65%)",
  function: "hsl(50 70% 65%)",
  variable: "hsl(200 50% 75%)",
  operator: "hsl(180 40% 60%)",
  punctuation: "hsl(30 6% 45%)",
  plain: "hsl(35 12% 70%)",
};

export function CodeMinimap({ codeLines, visibleLines, scrollTop, scrollHeight, clientHeight, onScroll }: CodeMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineHeight = 3;
  const totalHeight = codeLines.length * lineHeight;

  const lines = useMemo(() => codeLines.slice(0, visibleLines), [codeLines, visibleLines]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 60 * dpr;
    canvas.height = Math.max(totalHeight, 100) * dpr;
    canvas.style.width = "60px";
    canvas.style.height = `${Math.max(totalHeight, 100)}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, 60, Math.max(totalHeight, 100));

    lines.forEach((line, i) => {
      const tokens = tokenize(line.content);
      let x = 4;
      const y = i * lineHeight;
      tokens.forEach((token) => {
        const width = Math.max(1, token.text.length * 0.8);
        ctx.fillStyle = MINIMAP_COLORS[token.type] || MINIMAP_COLORS.plain;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(x, y, width, lineHeight - 1);
        x += width + 0.3;
      });
    });

    // Untyped lines as dim dots
    for (let i = visibleLines; i < codeLines.length; i++) {
      ctx.fillStyle = "hsl(220 10% 25%)";
      ctx.globalAlpha = 0.3;
      ctx.fillRect(4, i * lineHeight, 20, lineHeight - 1);
    }
    ctx.globalAlpha = 1;
  }, [lines, codeLines, visibleLines, totalHeight, lineHeight]);

  // Viewport indicator
  const viewportRatio = scrollHeight > 0 ? clientHeight / scrollHeight : 1;
  const viewportTop = scrollHeight > 0 ? (scrollTop / scrollHeight) * Math.max(totalHeight, 100) : 0;
  const viewportHeight = Math.max(12, viewportRatio * Math.max(totalHeight, 100));

  const handleClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const y = e.clientY - rect.top;
    const ratio = y / Math.max(totalHeight, 100);
    onScroll(ratio);
  };

  return (
    <div
      ref={containerRef}
      className="w-[60px] flex-shrink-0 relative cursor-pointer overflow-hidden select-none"
      style={{ backgroundColor: "hsl(var(--code-bg))" }}
      onClick={handleClick}
    >
      <canvas ref={canvasRef} className="block" />
      {/* Viewport indicator */}
      <div
        className="absolute left-0 right-0 rounded-sm pointer-events-none transition-[top] duration-100"
        style={{
          top: `${viewportTop}px`,
          height: `${viewportHeight}px`,
          backgroundColor: "hsl(210 17% 90% / 0.08)",
          borderTop: "1px solid hsl(210 17% 90% / 0.15)",
          borderBottom: "1px solid hsl(210 17% 90% / 0.15)",
        }}
      />
    </div>
  );
}
