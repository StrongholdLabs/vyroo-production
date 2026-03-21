export interface WorkflowNode {
  id: string;
  agent_template_id: string;
  position: { x: number; y: number };
  config: {
    custom_instructions?: string;
    model?: string;
    enabled_tools?: string[];
  };
  // Runtime state
  status?: "idle" | "running" | "completed" | "failed";
  run_id?: string;
}

export interface WorkflowEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  condition?: string; // e.g., "on_success", "on_failure", "always"
  data_mapping?: Record<string, string>; // map output fields to next agent's input
}

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  // Persisted status: draft | active | archived
  // Runtime-only status: running | completed | failed (not stored in DB)
  status: "draft" | "active" | "archived" | "running" | "completed" | "failed";
  last_run_at?: string;
  run_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ScheduledAgent {
  id: string;
  user_id: string;
  agent_template_id?: string;
  workflow_id?: string;
  name: string;
  cron_expression: string;
  input_config: Record<string, unknown>;
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
  run_count: number;
  created_at: string;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: "running" | "completed" | "failed";
  node_results: Record<string, unknown>;
  started_at: string;
  completed_at?: string;
}
