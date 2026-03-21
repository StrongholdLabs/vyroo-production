import {
  Check, Clock, Zap, FileText, Download, RefreshCw, Share2,
  ExternalLink,
} from "lucide-react";
import { motion } from "motion/react";

interface Artifact {
  name: string;
  type: "file" | "report" | "data" | "code" | "url";
  url?: string;
  size?: string;
}

interface AgentResultCardProps {
  summary: string;
  artifacts?: Artifact[];
  tokensUsed: number;
  duration: string;
  stepsCompleted: number;
  totalSteps: number;
  onRunAgain?: () => void;
  onShare?: () => void;
  onExport?: () => void;
}

const artifactIcons: Record<string, React.ReactNode> = {
  file: <FileText size={14} />,
  report: <FileText size={14} />,
  data: <Download size={14} />,
  code: <FileText size={14} />,
  url: <ExternalLink size={14} />,
};

export function AgentResultCard({
  summary,
  artifacts = [],
  tokensUsed,
  duration,
  stepsCompleted,
  totalSteps,
  onRunAgain,
  onShare,
  onExport,
}: AgentResultCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-3 my-2 rounded-xl border border-[hsl(var(--success))]/20 bg-[hsl(var(--success))]/5 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[hsl(var(--success))]/10">
        <div className="w-8 h-8 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center">
          <Check size={16} className="text-[hsl(var(--success))]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Agent Completed</p>
          <p className="text-xs text-muted-foreground">
            {stepsCompleted}/{totalSteps} steps • {duration}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 py-3 border-b border-[hsl(var(--success))]/10">
        <p className="text-sm text-foreground leading-relaxed">{summary}</p>
      </div>

      {/* Artifacts */}
      {artifacts.length > 0 && (
        <div className="px-4 py-3 border-b border-[hsl(var(--success))]/10">
          <p className="text-xs text-muted-foreground font-medium mb-2">Artifacts</p>
          <div className="space-y-1.5">
            {artifacts.map((artifact, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              >
                <span className="text-muted-foreground">
                  {artifactIcons[artifact.type] || <FileText size={14} />}
                </span>
                <span className="text-xs text-foreground flex-1 truncate">{artifact.name}</span>
                {artifact.size && (
                  <span className="text-[10px] text-muted-foreground">{artifact.size}</span>
                )}
                {artifact.url && (
                  <ExternalLink size={10} className="text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="px-4 py-2 flex items-center gap-4 border-b border-[hsl(var(--success))]/10">
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock size={10} />
          {duration}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Zap size={10} />
          {tokensUsed.toLocaleString()} tokens
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Check size={10} />
          {stepsCompleted} steps
        </span>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-2">
        {onRunAgain && (
          <button
            onClick={onRunAgain}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
          >
            <RefreshCw size={12} />
            Run Again
          </button>
        )}
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-accent transition-colors"
          >
            <Download size={12} />
            Export
          </button>
        )}
        {onShare && (
          <button
            onClick={onShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-accent transition-colors"
          >
            <Share2 size={12} />
            Share
          </button>
        )}
      </div>
    </motion.div>
  );
}
