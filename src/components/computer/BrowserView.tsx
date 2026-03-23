import { useState } from "react";
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
      <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-900">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-foreground rounded-full animate-spin" />
          </div>
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
