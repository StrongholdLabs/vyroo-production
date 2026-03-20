import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UpgradeBannerProps {
  onTryLite?: () => void;
  onUpgrade?: () => void;
}

export function UpgradeBanner({ onTryLite, onUpgrade }: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const { toast } = useToast();

  if (dismissed) return null;

  const handleUpgrade = () => {
    toast({
      title: "Switching to Manus 1.6 Max",
      description: "Your task will now run with enhanced performance and output quality.",
    });
    onUpgrade?.();
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden relative" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent z-10"
      >
        <X size={14} />
      </button>

      <div className="flex items-start gap-4 p-4 pr-8">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground mb-1">This task needs more firepower</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your task is likely too complex for Manus 1.6 Lite. Switch to Manus 1.6 Max for better performance and output.
          </p>
        </div>
        {/* Illustration */}
        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gradient-to-br from-muted/60 to-muted/30 flex items-center justify-center">
          <div className="relative">
            <div className="w-8 h-10 rounded-sm border border-border bg-accent/50 transform -rotate-6" />
            <div className="w-8 h-10 rounded-sm border border-border bg-accent/50 absolute top-0 left-2 transform rotate-6" />
            <div className="w-8 h-10 rounded-sm border border-border bg-accent/60 absolute top-0 left-1 transform rotate-0" />
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
          className="flex-1 py-2 text-sm text-foreground border border-border rounded-lg hover:bg-accent transition-colors active:scale-[0.98] flex items-center justify-center gap-2 font-medium"
        >
          Build with 1.6 Max
          <Sparkles size={14} className="text-foreground" />
        </button>
      </div>
    </div>
  );
}
