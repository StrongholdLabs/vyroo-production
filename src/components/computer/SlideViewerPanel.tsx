import { useState } from "react";
import { Download, Share2, Play, MoreHorizontal, Sparkles } from "lucide-react";
import type { SlideData } from "@/components/SlidePreviewCard";

interface SlideViewerPanelProps {
  slides: SlideData[];
  presentationTitle: string;
  lastModified?: string;
}

export function SlideViewerPanel({ slides, presentationTitle, lastModified }: SlideViewerPanelProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const current = slides[activeSlide];

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "hsl(var(--computer-bg))" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-11 border-b flex-shrink-0" style={{ borderColor: "hsl(var(--computer-border))" }}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{presentationTitle}</p>
          {lastModified && <p className="text-[10px] text-muted-foreground">Last modified: {lastModified}</p>}
        </div>
        <div className="flex items-center gap-1">
          {[Share2, Download, Play, MoreHorizontal].map((Icon, i) => (
            <button key={i} className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors">
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar thumbnails */}
        <div
          className="w-[140px] flex-shrink-0 overflow-y-auto border-r py-3 px-2 space-y-2"
          style={{ borderColor: "hsl(var(--computer-border))", backgroundColor: "hsl(var(--surface-sunken))" }}
        >
          {slides.map((slide, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`w-full rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                i === activeSlide
                  ? "border-[hsl(210_60%_55%)] shadow-md"
                  : "border-transparent hover:border-border"
              }`}
            >
              <div
                className="aspect-[16/9] relative overflow-hidden"
                style={{ backgroundColor: slide.bgColor || "hsl(220 14% 96%)" }}
              >
                {slide.badge && (
                  <div
                    className="absolute top-1 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[4px] font-bold"
                    style={{ backgroundColor: slide.accentColor || "hsl(35 70% 65%)" }}
                  >
                    {slide.badge}
                  </div>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
                  <p className="text-[5px] font-semibold leading-tight" style={{ color: "hsl(220 9% 20%)" }}>
                    {slide.title}
                  </p>
                  {slide.subtitle && (
                    <p className="text-[3px] mt-0.5" style={{ color: "hsl(215 10% 44%)" }}>
                      {slide.subtitle}
                    </p>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: slide.accentColor || "hsl(35 70% 65%)" }} />
              </div>
              <div className="text-center py-0.5">
                <span className="text-[9px] text-muted-foreground font-medium">{i + 1}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Main canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
            <div
              className="w-full max-w-3xl aspect-[16/9] rounded-lg border border-border shadow-lg relative overflow-hidden"
              style={{ backgroundColor: current?.bgColor || "hsl(220 14% 96%)" }}
            >
              {current?.badge && (
                <div
                  className="absolute top-6 right-8 w-16 h-16 rounded-full flex items-center justify-center text-[9px] font-bold leading-tight text-center"
                  style={{
                    backgroundColor: current.accentColor || "hsl(35 70% 65%)",
                    color: "hsl(220 9% 20%)",
                  }}
                >
                  {current.badge}
                </div>
              )}

              <div className="absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
                <h2
                  className="text-2xl md:text-3xl font-serif font-semibold leading-tight"
                  style={{ color: "hsl(220 9% 20%)" }}
                >
                  {current?.title}
                </h2>
                {current?.subtitle && (
                  <p className="text-sm mt-4 max-w-lg leading-relaxed" style={{ color: "hsl(215 10% 44%)" }}>
                    {current.subtitle}
                  </p>
                )}
                {current?.content && current.content.length > 0 && (
                  <div className="mt-5 space-y-1.5 text-left max-w-lg w-full">
                    {current.content.map((line, i) => (
                      <p key={i} className="text-xs leading-relaxed" style={{ color: "hsl(215 10% 44%)" }}>
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: current?.accentColor || "hsl(35 70% 65%)" }} />
            </div>
          </div>

          {/* Speaker notes */}
          <div className="border-t px-4 py-2.5 flex items-center gap-2" style={{ borderColor: "hsl(var(--computer-border))" }}>
            <input
              type="text"
              placeholder="Enter your presentation speaker notes"
              className="flex-1 text-xs bg-transparent text-muted-foreground placeholder:text-muted-foreground/50 outline-none"
            />
            <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-accent transition-colors">
              <Sparkles size={12} />
              Let Vyroo generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
