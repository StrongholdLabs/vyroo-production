import { Globe, Search, FileText, Download, Eye, Clock } from "lucide-react";
import { motion } from "motion/react";

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
}

const typeConfig = {
  search: { icon: Search, label: "Search", accent: "hsl(210 80% 55%)" },
  browse: { icon: Globe, label: "Visited", accent: "hsl(150 60% 45%)" },
  read: { icon: Eye, label: "Read", accent: "hsl(270 60% 55%)" },
  save: { icon: Download, label: "Saved", accent: "hsl(45 80% 50%)" },
  analyze: { icon: FileText, label: "Analyzed", accent: "hsl(340 65% 50%)" },
};

export function ResearchTimeline({ entries }: ResearchTimelineProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "hsl(var(--computer-bg))" }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Research Timeline</span>
          <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">{entries.length} events</span>
        </div>
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

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="relative flex gap-3 py-2 group"
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
