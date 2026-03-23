import { Presentation } from "lucide-react";

export interface SlideData {
  title: string;
  subtitle?: string;
  content?: string[];
  bgColor?: string;
  accentColor?: string;
  badge?: string;
}

interface SlidePreviewCardProps {
  slide: SlideData;
  slideNumber: number;
  totalSlides: number;
  onClick?: () => void;
}

export function SlidePreviewCard({ slide, slideNumber, totalSlides, onClick }: SlidePreviewCardProps) {
  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-border overflow-hidden cursor-pointer hover:border-muted-foreground/40 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] group"
      style={{ backgroundColor: "hsl(var(--surface-elevated))" }}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border" style={{ backgroundColor: "hsl(var(--secondary))" }}>
        <Presentation size={14} className="text-muted-foreground" />
        <span className="text-xs font-medium text-foreground truncate flex-1">{slide.title}</span>
        <span className="text-[10px] text-muted-foreground flex-shrink-0">{slideNumber} / {totalSlides}</span>
      </div>

      {/* Slide preview — miniature render */}
      <div
        className="relative aspect-[16/9] overflow-hidden"
        style={{ backgroundColor: slide.bgColor || "hsl(220 14% 96%)" }}
      >
        {/* Badge */}
        {slide.badge && (
          <div
            className="absolute top-3 right-4 w-12 h-12 rounded-full flex items-center justify-center text-[7px] font-bold leading-tight text-center"
            style={{
              backgroundColor: slide.accentColor || "hsl(35 70% 65%)",
              color: "hsl(var(--foreground))",
            }}
          >
            {slide.badge}
          </div>
        )}

        {/* Main content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <h3
            className="text-lg md:text-xl font-serif font-semibold leading-tight"
            style={{ color: "hsl(220 9% 20%)" }}
          >
            {slide.title}
          </h3>
          {slide.subtitle && (
            <p className="text-[10px] mt-2 leading-relaxed max-w-[80%]" style={{ color: "hsl(215 10% 44%)" }}>
              {slide.subtitle}
            </p>
          )}
          {slide.content && slide.content.length > 0 && (
            <div className="mt-3 space-y-1 text-left w-full max-w-[85%]">
              {slide.content.slice(0, 3).map((line, i) => (
                <p key={i} className="text-[8px] leading-relaxed" style={{ color: "hsl(215 10% 44%)" }}>
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Bottom accent bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: slide.accentColor || "hsl(35 70% 65%)" }} />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors pointer-events-none" />
      </div>
    </div>
  );
}
