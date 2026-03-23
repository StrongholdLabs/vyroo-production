import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  AgentRun,
  AgentStep,
  AgentRunConfig,
  AgentRunStatus,
} from "@/types/agents";

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url.length > 0 && url !== "undefined";
};

// ─── Mock data for when Supabase is not configured ───

const mockAgentRuns: (AgentRun & { steps?: AgentStep[] })[] = [
  {
    id: "run-1",
    user_id: "mock-user",
    agent_template_id: "research-agent",
    title: "Market analysis for AI startups in 2025",
    status: "completed",
    goal: "Research the current AI startup landscape, key players, funding trends, and emerging opportunities in 2025.",
    plan: [
      {
        label: "Search for AI startup funding data",
        type: "search",
        description: "Find recent funding rounds and investment trends",
      },
      {
        label: "Analyze key players",
        type: "browse",
        description: "Identify top AI startups and their market positions",
      },
      {
        label: "Compile report",
        type: "write",
        description: "Synthesize findings into a comprehensive report",
      },
    ],
    result: { report_url: "/reports/ai-startups-2025.md" },
    config: { model: "claude-sonnet-4-20250514", max_steps: 10 },
    model: "claude-sonnet-4-20250514",
    tokens_used: 14520,
    started_at: new Date(Date.now() - 3600000).toISOString(),
    completed_at: new Date(Date.now() - 1800000).toISOString(),
    steps: [
      {
        id: "step-1-1",
        run_id: "run-1",
        step_number: 1,
        type: "search",
        label: "Search for AI startup funding data",
        detail: "Found 24 relevant sources on AI funding trends",
        status: "complete",
        icon_name: "Search",
        input: { query: "AI startup funding 2025" },
        output: { sources_found: 24 },
        duration_ms: 4200,
        started_at: new Date(Date.now() - 3600000).toISOString(),
        completed_at: new Date(Date.now() - 3540000).toISOString(),
      },
      {
        id: "step-1-2",
        run_id: "run-1",
        step_number: 2,
        type: "browse",
        label: "Analyze key players",
        detail: "Reviewed 8 company profiles and market data",
        status: "complete",
        icon_name: "Globe",
        input: { urls: ["crunchbase.com", "pitchbook.com"] },
        output: { companies_analyzed: 8 },
        duration_ms: 12400,
        started_at: new Date(Date.now() - 3540000).toISOString(),
        completed_at: new Date(Date.now() - 2800000).toISOString(),
      },
      {
        id: "step-1-3",
        run_id: "run-1",
        step_number: 3,
        type: "write",
        label: "Compile report",
        detail: "Generated 2,400-word market analysis report",
        status: "complete",
        icon_name: "FileText",
        input: {},
        output: { word_count: 2400 },
        duration_ms: 8600,
        started_at: new Date(Date.now() - 2800000).toISOString(),
        completed_at: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
  },
  {
    id: "run-2",
    user_id: "mock-user",
    agent_template_id: "coding-agent",
    title: "Refactor authentication module",
    status: "running",
    goal: "Refactor the auth module to use the new token-based authentication flow with refresh token rotation.",
    plan: [
      {
        label: "Analyze current auth code",
        type: "code",
        description: "Review existing authentication implementation",
      },
      {
        label: "Design new token flow",
        type: "think",
        description: "Plan the refactored architecture",
      },
      {
        label: "Implement changes",
        type: "code",
        description: "Write the refactored authentication code",
      },
      {
        label: "Write tests",
        type: "code",
        description: "Add unit and integration tests",
      },
    ],
    result: {},
    config: {
      model: "claude-sonnet-4-20250514",
      max_steps: 15,
      auto_approve_tools: true,
    },
    model: "claude-sonnet-4-20250514",
    tokens_used: 8340,
    started_at: new Date(Date.now() - 900000).toISOString(),
    steps: [
      {
        id: "step-2-1",
        run_id: "run-2",
        step_number: 1,
        type: "code",
        label: "Analyze current auth code",
        detail: "Identified 6 files requiring changes",
        status: "complete",
        icon_name: "Code",
        input: { path: "src/auth/" },
        output: { files_found: 6 },
        duration_ms: 3100,
        started_at: new Date(Date.now() - 900000).toISOString(),
        completed_at: new Date(Date.now() - 850000).toISOString(),
      },
      {
        id: "step-2-2",
        run_id: "run-2",
        step_number: 2,
        type: "think",
        label: "Design new token flow",
        status: "active",
        icon_name: "Brain",
        input: {},
        output: {},
        started_at: new Date(Date.now() - 850000).toISOString(),
      },
    ],
  },
  {
    id: "run-3",
    user_id: "mock-user",
    agent_template_id: "data-analyst-agent",
    title: "Q4 revenue analysis",
    status: "failed",
    goal: "Analyze Q4 revenue data from the provided CSV and generate trend charts.",
    plan: [
      {
        label: "Parse CSV data",
        type: "code",
        description: "Load and validate the revenue dataset",
      },
      {
        label: "Run statistical analysis",
        type: "code",
        description: "Calculate key metrics and trends",
      },
    ],
    result: {},
    config: { model: "gpt-4o" },
    model: "gpt-4o",
    tokens_used: 3200,
    started_at: new Date(Date.now() - 86400000).toISOString(),
    error: "Failed to parse CSV: unexpected delimiter at row 142",
    steps: [
      {
        id: "step-3-1",
        run_id: "run-3",
        step_number: 1,
        type: "code",
        label: "Parse CSV data",
        detail: "Error: unexpected delimiter at row 142",
        status: "failed",
        icon_name: "FileSpreadsheet",
        input: { file: "q4-revenue.csv" },
        output: { error: "unexpected delimiter at row 142" },
        duration_ms: 1800,
        started_at: new Date(Date.now() - 86400000).toISOString(),
        completed_at: new Date(Date.now() - 86395000).toISOString(),
      },
    ],
  },
];

// ─── List user's agent runs ───

export function useAgentRuns() {
  return useQuery({
    queryKey: ["agent-runs"],
    queryFn: async (): Promise<AgentRun[]> => {
      if (!isSupabaseConfigured()) {
        return mockAgentRuns.map(({ steps: _steps, ...run }) => run);
      }

      const { data, error } = await supabase
        .from("agent_runs")
        .select("*")
        .order("started_at", { ascending: false });

      if (error) throw error;
      return data as AgentRun[];
    },
  });
}

// ─── Get a single agent run with its steps ───

export function useAgentRun(id: string) {
  return useQuery({
    queryKey: ["agent-run", id],
    enabled: !!id,
    queryFn: async (): Promise<AgentRun & { steps: AgentStep[] }> => {
      if (!isSupabaseConfigured()) {
        const run = mockAgentRuns.find((r) => r.id === id);
        if (!run) throw new Error(`Agent run "${id}" not found`);
        return { ...run, steps: run.steps ?? [] };
      }

      const [runResult, stepsResult] = await Promise.all([
        supabase.from("agent_runs").select("*").eq("id", id).single(),
        supabase
          .from("agent_steps")
          .select("*")
          .eq("run_id", id)
          .order("step_number", { ascending: true }),
      ]);

      if (runResult.error) throw runResult.error;

      return {
        ...(runResult.data as AgentRun),
        steps: (stepsResult.data ?? []) as AgentStep[],
      };
    },
  });
}

// ─── Create a new agent run ───

export function useCreateAgentRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentTemplateId,
      goal,
      title,
      config,
      conversationId,
    }: {
      agentTemplateId: string;
      goal: string;
      title: string;
      config?: AgentRunConfig;
      conversationId?: string;
    }) => {
      if (!isSupabaseConfigured()) {
        const newId = `run-${Date.now()}`;
        return {
          id: newId,
          agent_template_id: agentTemplateId,
          goal,
          title,
          status: "planning" as AgentRunStatus,
        };
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("agent_runs")
        .insert({
          user_id: user.id,
          agent_template_id: agentTemplateId,
          goal,
          title,
          status: "planning",
          config: config ?? {},
          model: config?.model ?? "claude-sonnet-4-20250514",
          conversation_id: conversationId,
        })
        .select("id, agent_template_id, goal, title, status")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-runs"] });
    },
  });
}

// ─── Pause an agent run ───

export function usePauseAgentRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (runId: string) => {
      if (!isSupabaseConfigured()) return;

      const { error } = await supabase
        .from("agent_runs")
        .update({ status: "paused" })
        .eq("id", runId);

      if (error) throw error;
    },
    onSuccess: (_, runId) => {
      queryClient.invalidateQueries({ queryKey: ["agent-runs"] });
      queryClient.invalidateQueries({ queryKey: ["agent-run", runId] });
    },
  });
}

// ─── Cancel an agent run ───

export function useCancelAgentRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (runId: string) => {
      if (!isSupabaseConfigured()) return;

      const { error } = await supabase
        .from("agent_runs")
        .update({ status: "cancelled" })
        .eq("id", runId);

      if (error) throw error;
    },
    onSuccess: (_, runId) => {
      queryClient.invalidateQueries({ queryKey: ["agent-runs"] });
      queryClient.invalidateQueries({ queryKey: ["agent-run", runId] });
    },
  });
}
