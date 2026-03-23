import { useState } from "react";
import {
  Settings, Sliders, ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";
import type { AgentRunConfig, AgentTemplate } from "@/types/agents";

const availableModels = [
  { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", provider: "Anthropic" },
  { id: "claude-haiku-3", label: "Claude Haiku 3", provider: "Anthropic" },
  { id: "gpt-4o", label: "GPT-4o", provider: "OpenAI" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI" },
];

interface AgentConfigPanelProps {
  template: AgentTemplate;
  config: AgentRunConfig;
  onConfigChange: (config: AgentRunConfig) => void;
}

export function AgentConfigPanel({ template, config, onConfigChange }: AgentConfigPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = (partial: Partial<AgentRunConfig>) => {
    onConfigChange({ ...config, ...partial });
  };

  const toggleTool = (tool: string) => {
    const current = config.enabled_tools ?? template.default_tools;
    const updated = current.includes(tool)
      ? current.filter((t) => t !== tool)
      : [...current, tool];
    update({ enabled_tools: updated });
  };

  const enabledTools = config.enabled_tools ?? template.default_tools;

  return (
    <div className="space-y-4">
      {/* Model Selection */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
          Model
        </label>
        <select
          value={config.model ?? template.default_model}
          onChange={(e) => update({ model: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {availableModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} ({m.provider})
            </option>
          ))}
        </select>
      </div>

      {/* Tool Access */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
          Tool Access
        </label>
        <div className="space-y-1.5">
          {template.capabilities.map((cap) => (
            <label
              key={cap}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                checked={enabledTools.includes(cap)}
                onChange={() => toggleTool(cap)}
                className="rounded border-border"
              />
              <span className="text-sm text-foreground capitalize">
                {cap.replace(/_/g, " ")}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Custom Instructions */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
          Custom Instructions
        </label>
        <textarea
          value={config.custom_instructions ?? ""}
          onChange={(e) => update({ custom_instructions: e.target.value })}
          placeholder="Add specific instructions for this agent run..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      {/* Advanced Settings */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Sliders size={12} />
          Advanced Settings
          {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3 pl-1">
            {/* Max Steps */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-muted-foreground">Max Steps</label>
                <span className="text-xs text-foreground font-medium">
                  {config.max_steps ?? 20}
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={config.max_steps ?? 20}
                onChange={(e) => update({ max_steps: parseInt(e.target.value) })}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground/50">
                <span>5</span>
                <span>50</span>
              </div>
            </div>

            {/* Auto-approve tools */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.auto_approve_tools ?? false}
                onChange={(e) => update({ auto_approve_tools: e.target.checked })}
                className="rounded border-border"
              />
              <div>
                <span className="text-sm text-foreground">Auto-approve tool calls</span>
                <p className="text-[11px] text-muted-foreground">
                  Skip approval prompts for tool usage
                </p>
              </div>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
