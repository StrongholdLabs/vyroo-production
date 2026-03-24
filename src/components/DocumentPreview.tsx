import { useState, useMemo, useEffect, useCallback } from "react";
import {
  X,
  Share2,
  Download,
  Maximize2,
  MoreHorizontal,
  Copy,
  Star,
  History,
  FileText,
  ChevronLeft,
  ChevronRight,
  FileDown,
  List,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DocumentPreviewProps {
  open: boolean;
  onClose: () => void;
  title: string;
  summary: string;
  tableData?: { headers: string[]; rows: string[][] };
  fullContent?: string;
}

// Build pages from the document content (NO mock data — only uses real title/summary/table)
function buildPages(title: string, summary: string, tableData?: { headers: string[]; rows: string[][] }) {
  const pages = [
    {
      id: 1,
      label: title || "Report",
      content: (
        <>
          <h1 className="text-3xl font-display text-foreground leading-tight mb-6" style={{ lineHeight: "1.15" }}>
            {title || "Report"}
          </h1>
          {summary && <p className="text-sm text-muted-foreground leading-relaxed mb-8">{summary}</p>}
          {!summary && <p className="text-sm text-muted-foreground leading-relaxed mb-8">The full report content is being loaded. If this page appears empty, the report data may not have been saved yet. Try generating a new report.</p>}
          {tableData && (
            <div className="rounded-lg border border-border overflow-hidden mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
                    {tableData.headers.map((h, i) => (
                      <th key={i} className="text-left py-3 px-4 font-semibold text-foreground border-b border-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                      {row.map((cell, ci) => (
                        <td key={ci} className={`py-3 px-4 ${ci === 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ),
    },
  ];
  return pages;
}

function generateMarkdown(title: string, summary: string, tableData?: { headers: string[]; rows: string[][] }) {
  let md = `# ${title}\n\n${summary}\n\n`;

  if (tableData) {
    md += `| ${tableData.headers.join(" | ")} |\n`;
    md += `| ${tableData.headers.map(() => "---").join(" | ")} |\n`;
    tableData.rows.forEach((row) => {
      md += `| ${row.join(" | ")} |\n`;
    });
    md += "\n";
  }

  return md;
}

export function DocumentPreview({ open, onClose, title, summary, tableData, fullContent }: DocumentPreviewProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [tocOpen, setTocOpen] = useState(true);

  // If we have full markdown content, split into sections by ## headings for pagination
  const pages = useMemo(() => {
    if (fullContent && fullContent.length > 50) {
      // Split on ## headings, keeping content before first ## as intro
      const parts = fullContent.split(/(?=^## )/m).filter(s => s.trim());

      // If no ## headings found, try splitting on # headings
      const sections = parts.length <= 1
        ? fullContent.split(/(?=^# )/m).filter(s => s.trim())
        : parts;

      if (sections.length === 0) sections.push(fullContent);

      return sections.map((section, i) => {
        const firstLine = section.trim().split('\n')[0].replace(/^#+\s*/, '');
        return {
          id: i + 1,
          label: firstLine.substring(0, 60) || `Section ${i + 1}`,
          content: (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground/80 prose-li:text-foreground/80 prose-strong:text-foreground prose-td:text-foreground/70 prose-th:text-foreground prose-table:text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{section}</ReactMarkdown>
            </div>
          ),
        };
      });
    }
    return buildPages(title, summary, tableData);
  }, [title, summary, tableData, fullContent]);
  const totalPages = pages.length;

  const goNext = useCallback(() => setCurrentPage(p => Math.min(totalPages - 1, p + 1)), [totalPages]);
  const goPrev = useCallback(() => setCurrentPage(p => Math.max(0, p - 1)), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); goPrev(); }
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, goNext, goPrev, onClose]);

  if (!open) return null;

  const handleDownloadMarkdown = () => {
    const md = fullContent || generateMarkdown(title, summary, tableData);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "Markdown file saved successfully." });
  };

  const handleDownloadHTML = () => {
    const md = fullContent || generateMarkdown(title, summary, tableData);
    // Simple HTML wrapper
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#1a1a1a;line-height:1.6}table{border-collapse:collapse;width:100%;margin:16px 0}th,td{border:1px solid #ddd;padding:8px 12px;text-align:left}th{background:#f5f5f5;font-weight:600}h1{font-size:28px}h2{font-size:20px;margin-top:32px}</style></head><body>${md.replace(/^# (.*$)/gm, '<h1>$1</h1>').replace(/^## (.*$)/gm, '<h2>$1</h2>').replace(/\n/g, '<br>')}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "HTML file saved successfully." });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Header bar */}
      <div className="flex items-center gap-3 px-5 h-14 flex-shrink-0 border-b border-border" style={{ backgroundColor: "hsl(var(--computer-header))" }}>
        <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "hsl(210 40% 35%)" }}>
          <FileText size={16} className="text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{title}</p>
          <p className="text-xs text-muted-foreground">Page {currentPage + 1} of {totalPages}</p>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent">
            <Share2 size={16} />
          </button>

          {/* Download dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent">
                <Download size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleDownloadMarkdown}>
                <FileDown size={14} className="mr-2 text-muted-foreground" />
                Download as Markdown
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDownloadHTML}>
                <FileText size={14} className="mr-2 text-muted-foreground" />
                Download as HTML
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* More menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent">
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {[
                { icon: Copy, label: "Copy" },
                { icon: Star, label: "Add to favorite" },
                { icon: History, label: "History" },
                { icon: FileText, label: "Edit in Google Docs" },
              ].map((item) => (
                <DropdownMenuItem key={item.label}>
                  <item.icon size={14} className="mr-2 text-muted-foreground" />
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={() => setTocOpen(!tocOpen)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
            title={tocOpen ? "Hide contents" : "Show contents"}
          >
            {tocOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent">
            <Maximize2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Page tabs */}
      <div className="flex items-center gap-1 px-5 py-2 border-b border-border overflow-x-auto" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
        {pages.map((page, i) => (
          <button
            key={page.id}
            onClick={() => setCurrentPage(i)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              currentPage === i
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            {page.label}
          </button>
        ))}
      </div>

      {/* Body with TOC sidebar + content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Table of Contents sidebar */}
        {tocOpen && (
          <div className="w-52 flex-shrink-0 border-r border-border overflow-y-auto py-4 px-3" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
            <div className="flex items-center gap-2 px-2 mb-3">
              <List size={14} className="text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contents</span>
            </div>
            <nav className="space-y-0.5">
              {pages.map((page, i) => (
                <button
                  key={page.id}
                  onClick={() => setCurrentPage(i)}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors ${
                    currentPage === i
                      ? "bg-accent text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <span className="text-[10px] text-muted-foreground mr-2">{i + 1}</span>
                  {page.label}
                </button>
              ))}
            </nav>
            <div className="mt-6 px-2">
              <p className="text-[10px] text-muted-foreground">← → to navigate pages</p>
            </div>
          </div>
        )}

        {/* Document content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-10">
            {pages[currentPage].content}
          </div>
        </div>
      </div>

      {/* Bottom navigation bar */}
      <div className="flex-shrink-0 border-t border-border px-4 py-3 flex items-center justify-between" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
        <button
          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-accent transition-colors disabled:opacity-40 disabled:pointer-events-none text-foreground"
        >
          <ChevronLeft size={14} />
          Previous
        </button>

        <div className="flex items-center gap-1.5">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${
                currentPage === i
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage === totalPages - 1}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-accent transition-colors disabled:opacity-40 disabled:pointer-events-none text-foreground"
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
