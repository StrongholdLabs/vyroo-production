import { Sparkles } from "lucide-react";

interface UpgradeBannerProps {
  onTryLite?: () => void;
  onUpgrade?: () => void;
}

export function UpgradeBanner({ onTryLite, onUpgrade }: UpgradeBannerProps) {
  return (
    <div className="rounded-xl border border-amber-500/20 overflow-hidden" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
      <div className="flex items-start gap-4 p-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-amber-400 mb-1">This task needs more firepower</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your task is likely too complex for Manus 1.6 Lite. Switch to Manus 1.6 Max for better performance and output.
          </p>
        </div>
        {/* Illustration */}
        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/5 flex items-center justify-center">
          <div className="relative">
            <div className="w-8 h-10 rounded-sm border border-amber-500/30 bg-amber-500/10 transform -rotate-6" />
            <div className="w-8 h-10 rounded-sm border border-amber-500/30 bg-amber-500/10 absolute top-0 left-2 transform rotate-6" />
            <div className="w-8 h-10 rounded-sm border border-amber-500/30 bg-amber-500/10 absolute top-0 left-1 transform rotate-0" />
          </div>
        </div>
      </div>
      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={onTryLite}
          className="flex-1 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:bg-accent hover:text-foreground transition-colors active:scale-[0.98]"
        >
          Try lite anyway
        </button>
        <button
          onClick={onUpgrade}
          className="flex-1 py-2 text-sm text-foreground border border-border rounded-lg hover:bg-accent transition-colors active:scale-[0.98] flex items-center justify-center gap-2 font-medium"
        >
          Build with 1.6 Max
          <Sparkles size={14} className="text-amber-400" />
        </button>
      </div>
    </div>
  );
}
