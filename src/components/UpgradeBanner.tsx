import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Sparkles, X, Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpgradeBannerProps {
  onTryLite?: () => void;
  onUpgrade?: () => void;
}

export function UpgradeBanner({ onTryLite, onUpgrade }: UpgradeBannerProps) {
  // Disabled: we don't have a "Max" tier yet. Re-enable when pricing tiers are built.
  return null;
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 12, scale: visible ? 1 : 0.97 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card
        className={cn(
          "relative overflow-hidden border cursor-default group",
          "backdrop-blur-xl bg-card/80",
          "shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.08)]",
          "hover:shadow-[0_16px_48px_-12px_hsl(var(--primary)/0.15)]",
          "transition-shadow duration-500"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Animated gradient border glow */}
        <div
          className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary)/0.06), transparent, hsl(var(--primary)/0.04))",
          }}
        />

        {/* Top accent line */}
        <motion.div
          className="h-[2px] w-full"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--primary)/0.4), hsl(var(--primary)/0.6), hsl(var(--primary)/0.4), transparent)",
          }}
          animate={{ backgroundPosition: isHovered ? "200% 0" : "0% 0" }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-all duration-200 z-10"
        >
          <X size={13} />
        </button>

        <div className="p-4 space-y-3">
          {/* Header with icon */}
          <div className="flex items-start gap-3">
            <motion.div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "hsl(var(--accent))" }}
              animate={isHovered ? { rotate: [0, -5, 5, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Zap size={18} className="text-foreground" />
            </motion.div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground font-body">
                  This task needs more firepower
                </h4>
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-4 font-medium"
                >
                  PRO
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your task is likely too complex for Vyroo 1.6 Lite. Switch to Max for better performance and output.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { setDismissed(true); onTryLite?.(); }}
              className="flex-1 py-2 text-xs font-medium text-muted-foreground rounded-lg border border-border hover:bg-accent hover:text-foreground transition-all duration-200 active:scale-[0.98]"
            >
              Try lite anyway
            </button>
            <motion.button
              onClick={handleUpgrade}
              className="flex-1 py-2 text-xs font-medium text-primary-foreground rounded-lg flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 transition-all duration-200 active:scale-[0.98]"
              whileHover={{ gap: "8px" }}
            >
              <Sparkles size={13} />
              Build with Max
              <ArrowRight size={12} className="opacity-60" />
            </motion.button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
