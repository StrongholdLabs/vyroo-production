import { useState, useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UpgradeBannerProps {
  onTryLite?: () => void;
  onUpgrade?: () => void;
}

export function UpgradeBanner({ onTryLite, onUpgrade }: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  if (dismissed) return null;

  const handleUpgrade = () => {
    toast({
      title: "Switching to Vyroo 1.6 Max",
      description: "Your task will now run with enhanced performance and output quality.",
    });
    onUpgrade?.();
  };

  return (
    <div
      className={`rounded-xl border overflow-hidden relative transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
      style={{
        backgroundColor: "hsl(var(--surface-elevated))",
        borderColor: "hsl(var(--border))",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Subtle gradient accent line at top */}
      <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg, hsl(var(--success)), hsl(38 60% 45%), hsl(var(--success)))" }} />

      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent z-10"
      >
        <X size={14} />
      </button>

      <div className="flex items-start gap-4 p-4 pr-8">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground mb-1">This task needs more firepower</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your task is likely too complex for Vyroo 1.6 Lite. Switch to Vyroo 1.6 Max for better performance and output.
          </p>
        </div>
        {/* Illustration */}
        <div className="flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(210 30% 22%)" }}>
          <div className="relative">
            <div className="w-8 h-10 rounded-sm border bg-accent/50 transform -rotate-6" style={{ borderColor: "hsl(210 20% 35%)" }} />
            <div className="w-8 h-10 rounded-sm border bg-accent/50 absolute top-0 left-2 transform rotate-6" style={{ borderColor: "hsl(210 20% 35%)" }} />
            <div className="w-8 h-10 rounded-sm border bg-accent/60 absolute top-0 left-1 transform rotate-0" style={{ borderColor: "hsl(210 20% 40%)" }} />
          </div>
        </div>
      </div>
      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={() => { setDismissed(true); onTryLite?.(); }}
          className="flex-1 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:bg-accent hover:text-foreground transition-colors active:scale-[0.98]"
        >
          Try lite anyway
        </button>
        <button
          onClick={handleUpgrade}
          className="flex-1 py-2 text-sm text-foreground rounded-lg transition-colors active:scale-[0.98] flex items-center justify-center gap-2 font-medium"
          style={{ backgroundColor: "hsl(210 40% 35%)", }}
        >
          Build with 1.6 Max
          <Sparkles size={14} className="text-foreground" />
        </button>
      </div>
    </div>
  );
}
