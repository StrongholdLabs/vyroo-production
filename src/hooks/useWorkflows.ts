import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Workflow, WorkflowNode, WorkflowEdge } from "@/types/workflows";

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url.length > 0 && url !== "undefined";
};

// ─── Mock data ───

const mockWorkflows: Workflow[] = [
  {
    id: "wf-research-report",
    user_id: "demo",
    name: "Research & Report Pipeline",
    description: "Research a topic, analyze findings, and produce a polished report.",
    nodes: [
      { id: "n1", agent_template_id: "research-agent", position: { x: 100, y: 200 }, config: {}, status: "idle" },
      { id: "n2", agent_template_id: "data-analyst-agent", position: { x: 420, y: 200 }, config: {}, status: "idle" },
      { id: "n3", agent_template_id: "content-creator-agent", position: { x: 740, y: 200 }, config: {}, status: "idle" },
    ],
    edges: [
      { id: "e1", source_node_id: "n1", target_node_id: "n2", condition: "on_success" },
      { id: "e2", source_node_id: "n2", target_node_id: "n3", condition: "on_success" },
    ],
    status: "active",
    run_count: 12,
    last_run_at: "2026-03-20T14:30:00Z",
    created_at: "2026-03-18T10:00:00Z",
    updated_at: "2026-03-20T14:30:00Z",
  },
  {
    id: "wf-code-review",
    user_id: "demo",
    name: "Code Review Automation",
    description: "Analyze code changes, run quality checks, and generate a review summary.",
    nodes: [
      { id: "n1", agent_template_id: "coding-agent", position: { x: 100, y: 200 }, config: {}, status: "idle" },
      { id: "n2", agent_template_id: "research-agent", position: { x: 420, y: 200 }, config: {}, status: "idle" },
    ],
    edges: [
      { id: "e1", source_node_id: "n1", target_node_id: "n2", condition: "on_success" },
    ],
    status: "draft",
    run_count: 0,
    created_at: "2026-03-19T08:00:00Z",
    updated_at: "2026-03-21T09:00:00Z",
  },
];

// ─── List all workflows ───

export function useWorkflows() {
  return useQuery({
    queryKey: ["workflows"],
    queryFn: async (): Promise<Workflow[]> => {
      if (!isSupabaseConfigured()) {
        return mockWorkflows;
      }

      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        description: row.description ?? undefined,
        nodes: (row.nodes as unknown as WorkflowNode[]) ?? [],
        edges: (row.edges as unknown as WorkflowEdge[]) ?? [],
        status: row.status as Workflow["status"],
        last_run_at: row.last_run_at ?? undefined,
        run_count: row.run_count ?? 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    },
  });
}

// ─── Get a single workflow ───

export function useWorkflow(id: string | undefined) {
  return useQuery({
    queryKey: ["workflow", id],
    enabled: !!id && id !== "new",
    queryFn: async (): Promise<Workflow | null> => {
      if (!isSupabaseConfigured()) {
        return mockWorkflows.find((w) => w.id === id) ?? null;
      }

      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .eq("id", id!)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null; // Not found
        throw error;
      }

      return {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        description: data.description ?? undefined,
        nodes: (data.nodes as unknown as WorkflowNode[]) ?? [],
        edges: (data.edges as unknown as WorkflowEdge[]) ?? [],
        status: data.status as Workflow["status"],
        last_run_at: data.last_run_at ?? undefined,
        run_count: data.run_count ?? 0,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    },
  });
}

// ─── Save (upsert) a workflow ───

export function useSaveWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workflow: {
      id?: string;
      name: string;
      description?: string;
      nodes: WorkflowNode[];
      edges: WorkflowEdge[];
      status?: Workflow["status"];
    }) => {
      if (!isSupabaseConfigured()) {
        // Mock: return the workflow as-is
        return {
          id: workflow.id ?? `wf-${Date.now()}`,
          ...workflow,
        };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        user_id: user.id,
        name: workflow.name,
        description: workflow.description ?? null,
        nodes: workflow.nodes as unknown as Record<string, unknown>,
        edges: workflow.edges as unknown as Record<string, unknown>,
        status: workflow.status ?? "draft",
        updated_at: new Date().toISOString(),
      };

      if (workflow.id) {
        // Update existing
        const { data, error } = await supabase
          .from("workflows")
          .update(payload)
          .eq("id", workflow.id)
          .select("id")
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from("workflows")
          .insert(payload)
          .select("id")
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

// ─── Delete a workflow ───

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workflowId: string) => {
      if (!isSupabaseConfigured()) return;

      const { error } = await supabase
        .from("workflows")
        .delete()
        .eq("id", workflowId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}
