import { useState, useRef } from "react";
import {
  Plus, Play, Square, Save, Settings2, ZoomIn, ZoomOut,
  Maximize, ChevronDown, GitBranch, LayoutGrid, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentTemplate } from "@/types/agents";

// ─── Props ───

interface WorkflowToolbarProps {
  workflowName: string;
  onNameChange: (name: string) => void;
  agents: AgentTemplate[];
  onAddAgent: (templateId: string) => void;
  onAutoLayout: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  isRunning: boolean;
  runProgress?: string; // e.g. "Step 2/4"
  onRun: () => void;
  onStop: () => void;
  onSave: () => void;
  onSettings?: () => void;
}

// ─── Component ───

export function WorkflowToolbar({
  workflowName,
  onNameChange,
  agents,
  onAddAgent,
  onAutoLayout,
  zoom,
  onZoomIn,
  onZoomOut,
  onFitView,
  isRunning,
  runProgress,
  onRun,
  onStop,
  onSave,
  onSettings,
}: WorkflowToolbarProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleNameBlur = () => {
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setIsEditingName(false);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
      {/* Workflow name */}
      <div className="flex items-center gap-2 min-w-0">
        <GitBranch size={16} className="text-primary flex-shrink-0" />
        {isEditingName ? (
          <input
            ref={nameInputRef}
            value={workflowName}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            autoFocus
            className="text-sm font-medium text-foreground bg-transparent border-b border-primary focus:outline-none min-w-[120px]"
          />
        ) : (
          <button
            onClick={() => setIsEditingName(true)}
            className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
          >
            {workflowName}
          </button>
        )}
      </div>

      {/* Left actions */}
      <div className="flex items-center gap-1 ml-2">
        {/* Add Agent dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-accent border border-border hover:border-muted-foreground/30 transition-all"
          >
            <Plus size={13} />
            Add Agent
            <ChevronDown size={11} />
          </button>

          {showAddMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
              <div className="absolute top-full left-0 mt-1 w-56 py-1 rounded-lg border border-border bg-popover shadow-xl z-50 max-h-64 overflow-y-auto">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      onAddAgent(agent.id);
                      setShowAddMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-accent transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                    <span className="truncate">{agent.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Auto-layout */}
        <button
          onClick={onAutoLayout}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border transition-all"
          title="Auto-layout"
        >
          <LayoutGrid size={13} />
        </button>
      </div>

      {/* Center: Zoom controls */}
      <div className="flex items-center gap-1 mx-auto">
        <button
          onClick={onZoomOut}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Zoom out"
        >
          <ZoomOut size={14} />
        </button>
        <span className="text-[11px] font-medium text-muted-foreground tabular-nums w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Zoom in"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={onFitView}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Fit to view"
        >
          <Maximize size={14} />
        </button>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        {isRunning ? (
          <button
            onClick={onStop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 transition-all"
          >
            <Square size={12} />
            {runProgress ? `Running... ${runProgress}` : "Stop"}
          </button>
        ) : (
          <button
            onClick={onRun}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all"
          >
            <Play size={13} />
            Run Workflow
          </button>
        )}

        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border transition-all"
        >
          <Save size={13} />
        </button>

        {onSettings && (
          <button
            onClick={onSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border transition-all"
          >
            <Settings2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
