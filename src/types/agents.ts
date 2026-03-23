export type AgentCategory = "research" | "coding" | "data" | "browsing" | "content" | "custom";
export type AgentRunStatus = "planning" | "running" | "paused" | "completed" | "failed" | "cancelled";
export type AgentStepType = "plan" | "tool_call" | "llm_call" | "browse" | "code" | "write" | "search" | "think" | "delegate";
export type AgentStepStatus = "pending" | "active" | "complete" | "failed" | "skipped";

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  category: AgentCategory;
  author: string;
  is_featured: boolean;
  is_community: boolean;
  default_model: string;
  default_tools: string[];
  system_prompt: string;
  capabilities: string[];
  config_schema: Record<string, unknown>;
  rating: number;
  install_count: number;
}

export interface AgentRun {
  id: string;
  user_id: string;
  conversation_id?: string;
  agent_template_id: string;
  title: string;
  status: AgentRunStatus;
  goal: string;
  plan: AgentStepPlan[];
  result: Record<string, unknown>;
  config: AgentRunConfig;
  model: string;
  tokens_used: number;
  started_at: string;
  completed_at?: string;
  error?: string;
}

export interface AgentStepPlan {
  label: string;
  type: AgentStepType;
  description: string;
}

export interface AgentStep {
  id: string;
  run_id: string;
  step_number: number;
  type: AgentStepType;
  label: string;
  detail?: string;
  status: AgentStepStatus;
  icon_name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  tool_name?: string;
  delegated_to?: string;
  duration_ms?: number;
  started_at?: string;
  completed_at?: string;
}

export interface AgentRunConfig {
  model?: string;
  custom_instructions?: string;
  enabled_tools?: string[];
  max_steps?: number;
  auto_approve_tools?: boolean;
}

export interface UserAgent {
  id: string;
  user_id: string;
  agent_template_id: string;
  custom_name?: string;
  custom_instructions?: string;
  model_override?: string;
  tools_override?: string[];
  is_favorited: boolean;
  run_count: number;
  last_run_at?: string;
  template?: AgentTemplate;
}
