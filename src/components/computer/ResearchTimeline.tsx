import { Globe, Search, FileText, Download, Eye, Clock, ExternalLink, BarChart3 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

export interface TimelineEntry {
  id: number;
  timestamp: string;
  type: "search" | "browse" | "read" | "save" | "analyze";
  title: string;
  url?: string;
  domain?: string;
  snippet?: string;
  faviconColor?: string;
  duration?: string;
}

interface ResearchTimelineProps {
  entries: TimelineEntry[];
  onEntryClick?: (entry: TimelineEntry) => void;
}

const typeConfig = {
  search: { icon: Search, label: "Search", accent: "hsl(210 80% 55%)" },
  browse: { icon: Globe, label: "Visited", accent: "hsl(150 60% 45%)" },
  read: { icon: Eye, label: "Read", accent: "hsl(270 60% 55%)" },
  save: { icon: Download, label: "Saved", accent: "hsl(45 80% 50%)" },
  analyze: { icon: FileText, label: "Analyzed", accent: "hsl(340 65% 50%)" },
};

/* ── Sources Panel ── */

interface SourceGroup {
  domain: string;
  faviconColor: string;
  visits: number;
  totalDuration: string;
  entries: TimelineEntry[];
}

function buildSources(entries: TimelineEntry[]): SourceGroup[] {
  const map = new Map<string, { entries: TimelineEntry[]; color: string; totalSec: number }>();

  for (const e of entries) {
    if (!e.domain) continue;
    const existing = map.get(e.domain);
    const sec = parseDuration(e.duration);
    if (existing) {
      existing.entries.push(e);
      existing.totalSec += sec;
    } else {
      map.set(e.domain, { entries: [e], color: e.faviconColor || "hsl(var(--muted-foreground))", totalSec: sec });
    }
  }

  return Array.from(map.entries())
    .map(([domain, data]) => ({
      domain,
      faviconColor: data.color,
      visits: data.entries.length,
      totalDuration: formatSec(data.totalSec),
      entries: data.entries,
    }))
    .sort((a, b) => b.visits - a.visits);
}

function parseDuration(d?: string): number {
  if (!d) return 0;
  const m = d.match(/(\d+)s/);
  return m ? parseInt(m[1]) : 0;
}

function formatSec(s: number): string {
  if (s === 0) return "—";
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function SourcesPanel({ entries, onEntryClick }: { entries: TimelineEntry[]; onEntryClick?: (e: TimelineEntry) => void }) {
  const sources = buildSources(entries);
  const totalSites = sources.length;
  const totalVisits = sources.reduce((s, g) => s + g.visits, 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "hsl(var(--computer-bg))" }}>
      <div className="px-5 pt-4 pb-3 flex-shrink-0 space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={14} className="text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sources</span>
        </div>
        {/* Summary stats */}
        <div className="flex gap-4">
          <div className="flex-1 rounded-lg border border-border px-3 py-2" style={{ backgroundColor: "hsl(var(--code-bg))" }}>
            <p className="text-lg font-semibold text-foreground tabular-nums">{totalSites}</p>
            <p className="text-[10px] text-muted-foreground">Sites visited</p>
          </div>
          <div className="flex-1 rounded-lg border border-border px-3 py-2" style={{ backgroundColor: "hsl(var(--code-bg))" }}>
            <p className="text-lg font-semibold text-foreground tabular-nums">{totalVisits}</p>
            <p className="text-[10px] text-muted-foreground">Total visits</p>
          </div>
          <div className="flex-1 rounded-lg border border-border px-3 py-2" style={{ backgroundColor: "hsl(var(--code-bg))" }}>
            <p className="text-lg font-semibold text-foreground tabular-nums">{entries.length}</p>
            <p className="text-[10px] text-muted-foreground">Events</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-1">
        {sources.map((source, i) => (
          <motion.div
            key={source.domain}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-lg border border-border overflow-hidden"
            style={{ backgroundColor: "hsl(var(--code-bg))" }}
          >
            {/* Domain header */}
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ backgroundColor: source.faviconColor }}
              >
                {source.domain.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-foreground truncate">{source.domain}</p>
                <p className="text-[10px] text-muted-foreground">
                  {source.visits} visit{source.visits > 1 ? "s" : ""} · {source.totalDuration} spent
                </p>
              </div>
            </div>

            {/* Pages visited */}
            <div className="border-t border-border">
              {source.entries.map((entry) => {
                const isClickable = entry.type === "browse" || entry.type === "search";
                return (
                  <button
                    key={entry.id}
                    onClick={() => isClickable && onEntryClick?.(entry)}
                    disabled={!isClickable}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors ${
                      isClickable ? "hover:bg-accent/50 cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <span className="text-[10px] text-muted-foreground/50 tabular-nums w-8 flex-shrink-0">{entry.timestamp}</span>
                    <span className="text-[11px] text-muted-foreground truncate flex-1">{entry.title}</span>
                    {isClickable && (
                      <ExternalLink size={10} className="text-muted-foreground/30 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Timeline ── */

export function ResearchTimeline({ entries, onEntryClick }: ResearchTimelineProps) {
  const [view, setView] = useState<"timeline" | "sources">("timeline");

  if (view === "sources") {
    return (
      <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "hsl(var(--computer-bg))" }}>
        {/* View toggle */}
        <div className="px-5 pt-3 pb-1 flex-shrink-0 flex items-center gap-1">
          <button
            onClick={() => setView("timeline")}
            className="text-[11px] px-2.5 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            Timeline
          </button>
          <button
            onClick={() => setView("sources")}
            className="text-[11px] px-2.5 py-1 rounded-md text-foreground bg-accent font-medium"
          >
            Sources
          </button>
        </div>
        <SourcesPanel entries={entries} onEntryClick={onEntryClick} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "hsl(var(--computer-bg))" }}>
      {/* Header with view toggle */}
      <div className="px-5 pt-3 pb-1 flex-shrink-0 flex items-center gap-1">
        <button
          onClick={() => setView("timeline")}
          className="text-[11px] px-2.5 py-1 rounded-md text-foreground bg-accent font-medium"
        >
          Timeline
        </button>
        <button
          onClick={() => setView("sources")}
          className="text-[11px] px-2.5 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          Sources
        </button>
        <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">{entries.length} events</span>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-[15px] top-2 bottom-2 w-px"
            style={{ backgroundColor: "hsl(var(--border))" }}
          />

          <div className="space-y-0.5">
            {entries.map((entry, i) => {
              const config = typeConfig[entry.type];
              const Icon = config.icon;
              const isClickable = entry.type === "browse" || entry.type === "search";

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className={`relative flex gap-3 py-2 group rounded-lg transition-colors ${
                    isClickable ? "cursor-pointer hover:bg-accent/40 active:scale-[0.99]" : ""
                  }`}
                  onClick={() => isClickable && onEntryClick?.(entry)}
                >
                  {/* Node */}
                  <div className="relative z-10 flex-shrink-0 w-[31px] flex justify-center">
                    <div
                      className="w-[31px] h-[31px] rounded-full flex items-center justify-center border-2 transition-transform duration-200 group-hover:scale-110"
                      style={{
                        borderColor: config.accent,
                        backgroundColor: "hsl(var(--computer-bg))",
                      }}
                    >
                      <Icon size={13} style={{ color: config.accent }} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-medium tabular-nums text-muted-foreground">{entry.timestamp}</span>
                      <span
                        className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                        style={{ color: config.accent, backgroundColor: `color-mix(in srgb, ${config.accent} 12%, transparent)` }}
                      >
                        {config.label}
                      </span>
                      {entry.duration && (
                        <span className="text-[10px] text-muted-foreground/50 tabular-nums">{entry.duration}</span>
                      )}
                      {isClickable && (
                        <ExternalLink size={9} className="text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>

                    <p className="text-[12px] font-medium text-foreground leading-snug">{entry.title}</p>

                    {entry.domain && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <div
                          className="w-3.5 h-3.5 rounded-sm flex items-center justify-center text-[7px] font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: entry.faviconColor || "hsl(var(--muted-foreground))" }}
                        >
                          {entry.domain.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate">{entry.domain}</span>
                        {entry.url && (
                          <span className="text-[10px] text-muted-foreground/40 truncate hidden group-hover:inline">· {entry.url}</span>
                        )}
                      </div>
                    )}

                    {entry.snippet && (
                      <p className="text-[11px] text-muted-foreground/70 mt-1 leading-relaxed line-clamp-2">
                        {entry.snippet}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
