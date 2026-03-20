import { useState, useEffect, useRef } from "react";

interface MarkdownRendererProps {
  codeLines: { num: number; content: string; color?: string }[];
  visibleChars: number;
  totalChars: number;
}

function parseMarkdownLine(line: string): React.ReactNode {
  // Headings
  const h1 = line.match(/^# (.+)/);
  if (h1) return <h1 className="text-xl font-bold text-foreground mt-4 mb-2 font-body">{parseInline(h1[1])}</h1>;
  const h2 = line.match(/^## (.+)/);
  if (h2) return <h2 className="text-base font-semibold text-foreground mt-4 mb-1.5 font-body">{parseInline(h2[1])}</h2>;
  const h3 = line.match(/^### (.+)/);
  if (h3) return <h3 className="text-sm font-semibold text-foreground mt-3 mb-1 font-body">{parseInline(h3[1])}</h3>;

  // Horizontal rule
  if (/^---+$/.test(line.trim())) return <hr className="border-border my-3" />;

  // List items
  const bullet = line.match(/^(\s*)[-*]\s+(.+)/);
  if (bullet) {
    const indent = Math.floor((bullet[1]?.length || 0) / 2);
    return (
      <div className="flex gap-2 text-foreground/80" style={{ paddingLeft: `${indent * 16}px` }}>
        <span className="text-muted-foreground mt-0.5">•</span>
        <span>{parseInline(bullet[2])}</span>
      </div>
    );
  }

  // Table rows
  if (line.startsWith("|")) {
    // Separator row
    if (/^\|[\s:-]+\|/.test(line)) return null;
    const cells = line.split("|").filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim());
    // Detect header (first table row)
    return cells;
  }

  // Empty line
  if (!line.trim()) return <div className="h-2" />;

  // Paragraph
  return <p className="text-foreground/80">{parseInline(line)}</p>;
}

function parseInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
      parts.push(<strong key={key++} className="font-semibold text-foreground">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    // Inline code
    const codeMatch = remaining.match(/`(.+?)`/);
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) parts.push(<span key={key++}>{remaining.slice(0, codeMatch.index)}</span>);
      parts.push(
        <code key={key++} className="px-1 py-0.5 rounded text-[11px] font-mono" style={{ backgroundColor: "hsl(var(--code-bg))" }}>
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
      continue;
    }

    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return <>{parts}</>;
}

export function MarkdownRenderer({ codeLines, visibleChars, totalChars }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isTyping = visibleChars < totalChars;

  // Calculate visible content
  const visibleContent: string[] = [];
  let chars = 0;
  for (let i = 0; i < codeLines.length; i++) {
    const lineLen = (codeLines[i].content?.length || 0) + 1;
    if (chars + lineLen <= visibleChars) {
      visibleContent.push(codeLines[i].content);
      chars += lineLen;
    } else {
      const partial = visibleChars - chars;
      if (partial > 0) visibleContent.push(codeLines[i].content?.slice(0, partial) || "");
      break;
    }
  }

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [visibleChars]);

  // Group table rows
  const elements: React.ReactNode[] = [];
  let tableBuffer: string[][] = [];
  let isFirstTableRow = true;

  const flushTable = () => {
    if (tableBuffer.length === 0) return;
    const headers = tableBuffer[0];
    const rows = tableBuffer.slice(1);
    elements.push(
      <div key={`table-${elements.length}`} className="my-3 rounded-lg border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: "hsl(var(--accent))" }}>
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left font-medium text-foreground">{parseInline(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-t border-border">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-1.5 text-foreground/70">{parseInline(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableBuffer = [];
    isFirstTableRow = true;
  };

  visibleContent.forEach((line, i) => {
    if (line.startsWith("|")) {
      const result = parseMarkdownLine(line);
      if (result === null) return; // separator row
      if (Array.isArray(result)) {
        tableBuffer.push(result);
        return;
      }
    } else {
      flushTable();
    }

    if (!line.startsWith("|")) {
      const parsed = parseMarkdownLine(line);
      elements.push(<div key={i}>{parsed}</div>);
    }
  });
  flushTable();

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto"
      style={{ backgroundColor: "hsl(var(--computer-bg))" }}
    >
      <div className="max-w-lg mx-auto px-6 py-6 text-sm leading-relaxed font-body">
        {elements}
        {isTyping && (
          <span className="inline-block w-[2px] h-4 bg-foreground/70 animate-pulse ml-0.5 align-text-bottom" />
        )}
      </div>
    </div>
  );
}
