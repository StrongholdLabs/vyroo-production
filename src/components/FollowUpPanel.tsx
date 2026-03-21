import { motion, AnimatePresence } from "motion/react";
import { ArrowRight } from "lucide-react";
import { getFollowUpIcon } from "@/lib/follow-up-icons";

interface FollowUp {
  text: string;
  category: string;
}

interface FollowUpPanelProps {
  followUps: FollowUp[];
  onSelect: (text: string) => void;
  visible: boolean;
}

export function FollowUpPanel({ followUps, onSelect, visible }: FollowUpPanelProps) {
  if (!visible || followUps.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-2 pt-2"
      >
        <span className="text-xs text-muted-foreground font-medium">Suggested follow-ups</span>
        {followUps.map((item, i) => {
          const Icon = getFollowUpIcon(item.category);
          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onSelect(item.text)}
              className="suggested-followup w-full text-left"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Icon size={16} className="text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-foreground truncate">{item.text}</span>
              </div>
              <ArrowRight size={16} className="text-muted-foreground flex-shrink-0" />
            </motion.button>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
