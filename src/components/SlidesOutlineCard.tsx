import { useState } from "react";
import { ChevronUp, ChevronDown, Presentation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface SlideOutlineItem {
  number: number;
  title: string;
  description: string;
}

interface SlidesOutlineCardProps {
  title: string;
  subtitle: string;
  slides: SlideOutlineItem[];
  onSlideClick?: (slideNumber: number) => void;
}

export function SlidesOutlineCard({ title, subtitle, slides, onSlideClick }: SlidesOutlineCardProps) {
  const [expanded, setExpanded] = useState(true);
  const visibleSlides = expanded ? slides : slides.slice(0, 0);

  return (
    <div className="rounded-xl border border-border overflow-hidden" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(var(--secondary))" }}>
          <Presentation size={16} className="text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span>{expanded ? "Collapse" : "Expand"}</span>
        </button>
      </div>

      {/* Slide list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-border">
              {slides.map((slide, i) => (
                <button
                  key={slide.number}
                  onClick={() => onSlideClick?.(slide.number)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors group"
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5"
                    style={{
                      backgroundColor: "hsl(var(--primary))",
                      color: "hsl(var(--primary-foreground))",
                    }}
                  >
                    {slide.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground group-hover:text-foreground/90 leading-snug">
                      {slide.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {slide.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Scroll indicator for long lists */}
            {slides.length > 6 && (
              <div className="flex justify-center py-2 border-t border-border">
                <ChevronDown size={16} className="text-muted-foreground/40 animate-bounce" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
