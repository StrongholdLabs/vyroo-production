import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselSlide {
  title: string;
  subtitle: string;
  icons: string[];
  bgGradient: string;
}

const slides: CarouselSlide[] = [
  {
    title: "Customize your AI agent for your business",
    subtitle: "A distinct identity that grows with your business.",
    icons: ["🟢", "💬", "✈️", "💬", "🟣", "💚"],
    bgGradient: "from-[hsl(220_9%_16%)] to-[hsl(220_9%_12%)]",
  },
  {
    title: "Automate your workflow with integrations",
    subtitle: "Connect tools you already use, seamlessly.",
    icons: ["📧", "📅", "🐙", "📊", "🔗", "⚡"],
    bgGradient: "from-[hsl(220_9%_16%)] to-[hsl(220_9%_12%)]",
  },
  {
    title: "Research at lightning speed",
    subtitle: "Deep analysis across the web in minutes, not hours.",
    icons: ["🔍", "📰", "🌐", "📈", "🧠", "📝"],
    bgGradient: "from-[hsl(220_9%_16%)] to-[hsl(220_9%_12%)]",
  },
  {
    title: "Build and deploy with one prompt",
    subtitle: "From idea to live app — no setup required.",
    icons: ["🚀", "💻", "🎨", "⚙️", "🌍", "✨"],
    bgGradient: "from-[hsl(220_9%_16%)] to-[hsl(220_9%_12%)]",
  },
];

export function PromoCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [paused, next]);

  const slide = slides[current];

  return (
    <div
      className="w-full max-w-2xl mx-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${slide.bgGradient} border border-border transition-all duration-500`}
      >
        <div className="flex items-center justify-between p-5">
          {/* Text */}
          <div className="flex-1 min-w-0 pr-6">
            <h3 className="text-sm font-medium text-foreground font-body leading-snug">{slide.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{slide.subtitle}</p>
          </div>

          {/* Floating icons cluster */}
          <div className="relative w-24 h-16 flex-shrink-0">
            {slide.icons.map((icon, i) => {
              const positions = [
                { top: "0%", left: "20%", scale: 1.1 },
                { top: "50%", left: "60%", scale: 0.9 },
                { top: "10%", left: "70%", scale: 1 },
                { top: "55%", left: "10%", scale: 0.85 },
                { top: "25%", left: "0%", scale: 0.75 },
                { top: "60%", left: "45%", scale: 0.7 },
              ];
              const pos = positions[i] || positions[0];
              return (
                <span
                  key={i}
                  className="absolute text-sm transition-all duration-700"
                  style={{
                    top: pos.top,
                    left: pos.left,
                    transform: `scale(${pos.scale})`,
                  }}
                >
                  {icon}
                </span>
              );
            })}
          </div>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={prev}
          className="absolute left-1 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={next}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
        >
          <ChevronRight size={16} />
        </button>

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5 pb-3">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "bg-foreground w-3" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
