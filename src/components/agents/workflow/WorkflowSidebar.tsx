import { useState } from "react";
import {
  X, ChevronDown, ChevronRight, Trash2, Settings2,
  GitBranch, Clock, Layers, Zap, FileText,
  Search, Code, BarChart3, Globe, PenTool, Puzzle,
  Sparkles, Bot, Cpu, Microscope, Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import type { Workflow, WorkflowNode, WorkflowEdge } from "@/types/workflows";
import type { AgentTemplate, AgentCategory } from "@/types/agents";

// ─── Icon mapping ───

const iconMap: Record<string, LucideIcon> = {
  Search, Code, BarChart3, Globe, PenTool, Puzzle,
  Sparkles, Bot, FileText, Cpu, Microscope, Wand2,
};

function getIcon(iconName: string): LucideIcon {
  return iconMap[iconName] ?? Puzzle;
}

const categoryColors: Record<AgentCategory, { bg: string; text: string }> = {
  research: { bg: "bg-blue-500/15", text: "text-blue-400" },
  coding:   { bg: "bg-purple-500/15", text: "text-purple-400" },
  data:     { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  browsing: { bg: "bg-orange-500/15", text: "text-orange-400" },
  content:  { bg: "bg-pink-500/15", text: "text-pink-400" },
  custom:   { bg: "bg-zinc-500/15", text: "text-zinc-400" },
};

// ─── Collapsible section ───

function Section({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {icon}
        <span className="flex-1 text-left uppercase tracking-wider">{title}</span>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Workflow overview (no node selected) ───

function WorkflowOverview({ workflow }: { workflow: Workflow }) {
  const nodeCount = workflow.nodes.length;
  const edgeCount = workflow.edges.length;

  return (
    <div className="space-y-0">
      <Section title="Overview" icon={<GitBranch size={12} />}>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Name</label>
            <p className="text-sm text-foreground mt-0.5">{workflow.name}</p>
          </div>
          {workflow.description && (
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Description</label>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{workflow.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-muted/50 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Nodes</span>
              <p className="text-lg font-semibold text-foreground tabular-nums">{nodeCount}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Edges</span>
              <p className="text-lg font-semibold text-foreground tabular-nums">{edgeCount}</p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Status" icon={<Clock size={12} />}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status</span>
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              workflow.status === "draft" && "bg-muted text-muted-foreground",
              workflow.status === "running" && "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
              workflow.status === "completed" && "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
              workflow.status === "failed" && "bg-destructive/10 text-destructive",
            )}>
              {workflow.status}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Created</span>
            <span className="text-xs text-foreground">{new Date(workflow.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Updated</span>
            <span className="text-xs text-foreground">{new Date(workflow.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </Section>
    </div>
  );
}

// ─── Node detail (node selected) ───

function NodeDetail({
  node,
  template,
  edges,
  onDelete,
  onConfigChange,
}: {
  node: WorkflowNode;
  template: AgentTemplate | undefined;
  edges: WorkflowEdge[];
  onDelete: (nodeId: string) => void;
  onConfigChange: (nodeId: string, config: WorkflowNode["config"]) => void;
}) {
  const Icon = template ? getIcon(template.icon_name) : Puzzle;
  const colors = template
    ? (categoryColors[template.category] ?? categoryColors.custom)
    : categoryColors.custom;

  const incomingEdges = edges.filter((e) => e.target_node_id === node.id);
  const outgoingEdges = edges.filter((e) => e.source_node_id === node.id);

  return (
    <div className="space-y-0">
      {/* Agent header */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", colors.bg)}>
            <Icon size={16} className={colors.text} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {template?.name ?? "Unknown Agent"}
            </h3>
            <span className="text-[10px] text-muted-foreground">{template?.category}</span>
          </div>
        </div>
      </div>

      <Section title="Configuration" icon={<Settings2 size={12} />}>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Model</label>
            <select
              value={node.config.model ?? template?.default_model ?? ""}
              onChange={(e) => onConfigChange(node.id, { ...node.config, model: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-lg bg-muted border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="claude-sonnet-4-20250514">Claude Sonnet</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Custom Instructions</label>
            <textarea
              value={node.config.custom_instructions ?? ""}
              onChange={(e) => onConfigChange(node.id, { ...node.config, custom_instructions: e.target.value })}
              placeholder="Add specific instructions for this agent..."
              rows={3}
              className="w-full px-2.5 py-1.5 rounded-lg bg-muted border border-border text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
              Tools ({node.config.enabled_tools?.length ?? template?.default_tools.length ?? 0})
            </label>
            <div className="flex flex-wrap gap-1">
              {(node.config.enabled_tools ?? template?.default_tools ?? []).map((tool) => (
                <span
                  key={tool}
                  className="text-[10px] text-muted-foreground bg-accent/50 px-2 py-0.5 rounded-md"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Connections" icon={<Layers size={12} />} defaultOpen={false}>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
              Incoming ({incomingEdges.length})
            </label>
            {incomingEdges.length === 0 ? (
              <p className="text-xs text-muted-foreground/50">No incoming connections</p>
            ) : (
              <div className="space-y-1">
                {incomingEdges.map((edge) => (
                  <div key={edge.id} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))]" />
                    From: {edge.source_node_id.split("-").slice(0, 2).join("-")}
                    {edge.condition && <span className="text-[10px] text-muted-foreground/60">({edge.condition})</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
              Outgoing ({outgoingEdges.length})
            </label>
            {outgoingEdges.length === 0 ? (
              <p className="text-xs text-muted-foreground/50">No outgoing connections</p>
            ) : (
              <div className="space-y-1">
                {outgoingEdges.map((edge) => (
                  <div key={edge.id} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    To: {edge.target_node_id.split("-").slice(0, 2).join("-")}
                    {edge.condition && <span className="text-[10px] text-muted-foreground/60">({edge.condition})</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Delete button */}
      <div className="px-4 py-3">
        <button
          onClick={() => onDelete(node.id)}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-destructive border border-destructive/30 hover:bg-destructive/10 transition-all"
        >
          <Trash2 size={12} />
          Remove from workflow
        </button>
      </div>
    </div>
  );
}

// ─── Main sidebar ───

interface WorkflowSidebarProps {
  workflow: Workflow;
  selectedNodeId: string | null;
  templates: AgentTemplate[];
  onClose: () => void;
  onDeleteNode: (nodeId: string) => void;
  onNodeConfigChange: (nodeId: string, config: WorkflowNode["config"]) => void;
}

export function WorkflowSidebar({
  workflow,
  selectedNodeId,
  templates,
  onClose,
  onDeleteNode,
  onNodeConfigChange,
}: WorkflowSidebarProps) {
  const selectedNode = selectedNodeId
    ? workflow.nodes.find((n) => n.id === selectedNodeId)
    : null;
  const selectedTemplate = selectedNode
    ? templates.find((t) => t.id === selectedNode.agent_template_id)
    : undefined;

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-[320px] h-full border-l border-border bg-card/50 backdrop-blur-sm flex flex-col flex-shrink-0 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {selectedNode ? "Node Details" : "Workflow"}
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedNode ? (
          <NodeDetail
            node={selectedNode}
            template={selectedTemplate}
            edges={workflow.edges}
            onDelete={onDeleteNode}
            onConfigChange={onNodeConfigChange}
          />
        ) : (
          <WorkflowOverview workflow={workflow} />
        )}
      </div>
    </motion.div>
  );
}
