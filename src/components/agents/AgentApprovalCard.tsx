import { useState } from "react";
import { Shield, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "motion/react";

interface AgentApprovalCardProps {
  stepNumber: number;
  toolName: string;
  toolDescription?: string;
  args: Record<string, unknown>;
  onApprove: (alwaysApprove: boolean) => void;
  onDeny: () => void;
}

export function AgentApprovalCard({
  stepNumber,
  toolName,
  toolDescription,
  args,
  onApprove,
  onDeny,
}: AgentApprovalCardProps) {
  const [alwaysApprove, setAlwaysApprove] = useState(false);
  const [showArgs, setShowArgs] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="mx-3 my-2 rounded-xl border-2 border-yellow-400/30 bg-yellow-400/5 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-yellow-400/20">
        <div className="w-7 h-7 rounded-lg bg-yellow-400/10 flex items-center justify-center flex-shrink-0">
          <Shield size={14} className="text-yellow-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Approval Required</p>
          <p className="text-xs text-muted-foreground">
            Step {stepNumber} wants to use <span className="font-mono text-yellow-400">{toolName}</span>
          </p>
        </div>
      </div>

      {/* Tool description */}
      {toolDescription && (
        <div className="px-4 py-2 border-b border-yellow-400/10">
          <p className="text-xs text-muted-foreground">{toolDescription}</p>
        </div>
      )}

      {/* Arguments preview */}
      <div className="px-4 py-2 border-b border-yellow-400/10">
        <button
          onClick={() => setShowArgs(!showArgs)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showArgs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {showArgs ? "Hide" : "View"} arguments
        </button>
        {showArgs && (
          <pre className="mt-2 text-xs font-mono text-muted-foreground bg-muted/50 rounded-lg p-2 overflow-x-auto max-h-32 overflow-y-auto">
            {JSON.stringify(args, null, 2)}
          </pre>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => onApprove(alwaysApprove)}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] text-sm font-medium hover:bg-[hsl(var(--success))]/20 transition-colors"
        >
          <Check size={14} />
          Approve
        </button>
        <button
          onClick={onDeny}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
        >
          <X size={14} />
          Deny
        </button>

        <label className="flex items-center gap-2 ml-auto cursor-pointer">
          <input
            type="checkbox"
            checked={alwaysApprove}
            onChange={(e) => setAlwaysApprove(e.target.checked)}
            className="rounded border-border"
          />
          <span className="text-[11px] text-muted-foreground">Always approve this tool</span>
        </label>
      </div>
    </motion.div>
  );
}
