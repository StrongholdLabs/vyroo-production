import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Lock, Star, X, Plus } from "lucide-react";

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  active?: boolean;
}

export interface BrowserPageContent {
  type: "website";
  siteName?: string;
  pageTitle: string;
  sections: BrowserSection[];
}

export interface BrowserSection {
  type: "nav" | "hero" | "text" | "table" | "tags" | "list";
  content: string;
  items?: string[];
  tableHeaders?: string[];
  tableRows?: string[][];
  tags?: { label: string; color: string }[];
}

interface BrowserViewProps {
  tabs: BrowserTab[];
  url: string;
  pageContent: BrowserPageContent;
  isLoading?: boolean;
}

function BrowserProgressBar({ isLoading }: { isLoading: boolean }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      setVisible(true);
      // Fast phase: 0-80% in ~800ms
      let current = 0;
      intervalRef.current = setInterval(() => {
        current += Math.random() * 12 + 3;
        if (current >= 80) {
          current = 80 + Math.random() * 5; // slow crawl 80-85
        }
        if (current > 92) current = 92; // cap before completion
        setProgress(current);
      }, 100);
    } else {
      // Jump to 100% then fade out
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(100);
      const timeout = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(timeout);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div className="absolute top-0 left-0 right-0 h-[2px] z-20">
      <div
        className="h-full bg-blue-500 transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: progress < 100 ? "0 0 8px hsl(210 100% 60% / 0.6)" : "none",
          opacity: progress >= 100 ? 0 : 1,
          transition: progress >= 100 ? "width 200ms, opacity 300ms 200ms" : "width 200ms ease-out",
        }}
      />
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="p-4 space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-700">
        <div className="w-6 h-6 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
        <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
        <div className="ml-auto flex gap-3">
          <div className="h-3 w-14 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
          <div className="h-3 w-14 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
          <div className="h-3 w-10 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
        </div>
      </div>
      {/* Title skeleton */}
      <div className="h-5 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
      {/* Tags skeleton */}
      <div className="flex gap-2">
        <div className="h-5 w-16 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
        <div className="h-5 w-20 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
        <div className="h-5 w-14 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
      </div>
      {/* Text block skeletons */}
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
        <div className="h-3 w-5/6 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
        <div className="h-3 w-4/6 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
      </div>
      {/* Table skeleton */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-zinc-50 dark:bg-zinc-800 p-2 flex gap-4">
          <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
          <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
          <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
        </div>
        {[1, 2, 3].map(row => (
          <div key={row} className="p-2 flex gap-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
          </div>
        ))}
      </div>
      {/* More text */}
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
        <div className="h-3 w-2/3 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
      </div>
    </div>
  );
}

export function BrowserView({ tabs, url, pageContent, isLoading }: BrowserViewProps) {
  const [activeTabId, setActiveTabId] = useState(tabs.find(t => t.active)?.id || tabs[0]?.id);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "hsl(var(--computer-bg))" }}>
      {/* URL bar */}
      <div className="px-3 py-2 flex-shrink-0" style={{ backgroundColor: "hsl(var(--computer-header))" }}>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
          style={{ backgroundColor: "hsl(var(--code-bg))" }}
        >
          <Lock size={10} className="text-muted-foreground/50" />
          <span className="text-muted-foreground truncate flex-1">{url}</span>
        </div>
      </div>

      {/* Browser chrome — tabs */}
      <div
        className="flex items-center gap-0 px-2 border-b flex-shrink-0 overflow-x-auto"
        style={{ borderColor: "hsl(var(--computer-border))", backgroundColor: "hsl(var(--computer-header))" }}
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] max-w-[160px] cursor-pointer transition-colors border-b-2 ${
              tab.id === activeTabId
                ? "text-foreground border-foreground"
                : "text-muted-foreground border-transparent hover:text-foreground/70"
            }`}
          >
            {tab.favicon && (
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0 flex items-center justify-center text-[7px] font-bold text-white"
                style={{ backgroundColor: tab.favicon }}
              >
                {tab.title.charAt(0)}
              </div>
            )}
            <span className="truncate">{tab.title}</span>
            <X size={8} className="text-muted-foreground/40 flex-shrink-0 ml-auto" />
          </div>
        ))}
        <button className="p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors flex-shrink-0">
          <Plus size={10} />
        </button>
      </div>

      {/* Navigation bar */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 border-b flex-shrink-0"
        style={{ borderColor: "hsl(var(--computer-border))", backgroundColor: "hsl(var(--computer-header))" }}
      >
        <button className="p-0.5 text-muted-foreground/50"><ArrowLeft size={12} /></button>
        <button className="p-0.5 text-muted-foreground/50"><ArrowRight size={12} /></button>
        <button className="p-0.5 text-muted-foreground/50"><RotateCw size={10} /></button>
        <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px]" style={{ backgroundColor: "hsl(var(--code-bg))" }}>
          <Lock size={8} className="text-success/60" />
          <span className="text-muted-foreground truncate">{url}</span>
        </div>
        <button className="p-0.5 text-muted-foreground/50"><Star size={12} /></button>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-900 relative">
        <BrowserProgressBar isLoading={!!isLoading} />
        {isLoading ? (
          <SkeletonLoader />
        ) : (
          <div className="p-4 space-y-4">
            {/* Site header */}
            {pageContent.siteName && (
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-700">
                <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold">
                  {pageContent.siteName.charAt(0)}
                </div>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{pageContent.siteName}</span>
                <div className="ml-auto flex items-center gap-3 text-[10px] text-zinc-500">
                  <span>Use Cases ▾</span>
                  <span>Top Trends</span>
                  <span>API</span>
                  <span>Our Data</span>
                </div>
              </div>
            )}

            {/* Page title */}
            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
              {pageContent.pageTitle}
            </h1>

            {/* Sections */}
            {pageContent.sections.map((section, i) => {
              if (section.type === "tags" && section.tags) {
                return (
                  <div key={i} className="flex flex-wrap gap-1.5">
                    {section.tags.map((tag, ti) => (
                      <span
                        key={ti}
                        className="px-2 py-0.5 rounded text-[10px] font-medium text-white"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                );
              }

              if (section.type === "text") {
                return (
                  <p key={i} className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {section.content}
                  </p>
                );
              }

              if (section.type === "table" && section.tableHeaders && section.tableRows) {
                return (
                  <div key={i} className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-800">
                          {section.tableHeaders.map((h, hi) => (
                            <th key={hi} className="text-left px-2 py-1.5 font-medium text-zinc-700 dark:text-zinc-300">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.tableRows.map((row, ri) => (
                          <tr key={ri} className="border-t border-zinc-100 dark:border-zinc-800">
                            {row.map((cell, ci) => (
                              <td key={ci} className="px-2 py-1 text-zinc-600 dark:text-zinc-400">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }

              if (section.type === "list" && section.items) {
                return (
                  <ul key={i} className="space-y-1">
                    {section.items.map((item, ii) => (
                      <li key={ii} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-1.5">
                        <span className="text-zinc-400 mt-0.5">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                );
              }

              return (
                <p key={i} className="text-xs text-zinc-500 dark:text-zinc-400">{section.content}</p>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
