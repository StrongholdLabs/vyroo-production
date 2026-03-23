import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { UserAgent } from "@/types/agents";

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url.length > 0 && url !== "undefined";
};

// ─── Mock data for when Supabase is not configured ───

const mockUserAgents: UserAgent[] = [
  {
    id: "ua-1",
    user_id: "mock-user",
    agent_template_id: "research-agent",
    is_favorited: true,
    run_count: 12,
    last_run_at: new Date(Date.now() - 3600000).toISOString(),
    template: {
      id: "research-agent",
      name: "Research Agent",
      description:
        "Conducts deep research across the web, synthesizes findings, and produces comprehensive reports with cited sources.",
      icon_name: "Search",
      category: "research",
      author: "Vyroo",
      is_featured: true,
      is_community: false,
      default_model: "claude-sonnet-4-20250514",
      default_tools: ["web_search", "browse", "write"],
      system_prompt: "You are a meticulous research agent...",
      capabilities: [
        "Web search and synthesis",
        "Source citation and verification",
        "Multi-step research plans",
        "Report generation with summaries",
      ],
      config_schema: {},
      rating: 4.8,
      install_count: 12450,
    },
  },
  {
    id: "ua-2",
    user_id: "mock-user",
    agent_template_id: "coding-agent",
    custom_instructions: "Prefer TypeScript and functional patterns.",
    model_override: "claude-sonnet-4-20250514",
    is_favorited: false,
    run_count: 5,
    last_run_at: new Date(Date.now() - 86400000).toISOString(),
    template: {
      id: "coding-agent",
      name: "Coding Agent",
      description:
        "Writes, reviews, and refactors code across multiple languages. Can plan architecture, implement features, and fix bugs.",
      icon_name: "Code",
      category: "coding",
      author: "Vyroo",
      is_featured: true,
      is_community: false,
      default_model: "claude-sonnet-4-20250514",
      default_tools: ["code", "terminal", "write", "search"],
      system_prompt: "You are an expert software engineer agent...",
      capabilities: [
        "Multi-file code generation",
        "Architecture planning",
        "Bug detection and fixing",
        "Code review and refactoring",
      ],
      config_schema: {},
      rating: 4.9,
      install_count: 18320,
    },
  },
];

// ─── List user's saved agents with template joined ───

export function useUserAgents() {
  return useQuery({
    queryKey: ["user-agents"],
    queryFn: async (): Promise<UserAgent[]> => {
      if (!isSupabaseConfigured()) {
        return mockUserAgents;
      }

      const { data, error } = await supabase
        .from("user_agents")
        .select("*, template:agent_templates(*)")
        .order("is_favorited", { ascending: false });

      if (error) throw error;
      return data as UserAgent[];
    },
  });
}

// ─── Save or update a user agent config ───

export function useSaveAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentTemplateId,
      customName,
      customInstructions,
      modelOverride,
      toolsOverride,
    }: {
      agentTemplateId: string;
      customName?: string;
      customInstructions?: string;
      modelOverride?: string;
      toolsOverride?: string[];
    }) => {
      if (!isSupabaseConfigured()) {
        return {
          id: `ua-${Date.now()}`,
          agent_template_id: agentTemplateId,
          custom_name: customName,
          is_favorited: false,
          run_count: 0,
        };
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_agents")
        .upsert(
          {
            user_id: user.id,
            agent_template_id: agentTemplateId,
            custom_name: customName,
            custom_instructions: customInstructions,
            model_override: modelOverride,
            tools_override: toolsOverride,
          },
          { onConflict: "user_id,agent_template_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-agents"] });
    },
  });
}

// ─── Delete a user agent ───

export function useDeleteUserAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userAgentId: string) => {
      if (!isSupabaseConfigured()) return;

      const { error } = await supabase
        .from("user_agents")
        .delete()
        .eq("id", userAgentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-agents"] });
    },
  });
}

// ─── Toggle favorite status ───

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userAgentId,
      isFavorited,
    }: {
      userAgentId: string;
      isFavorited: boolean;
    }) => {
      if (!isSupabaseConfigured()) return;

      const { error } = await supabase
        .from("user_agents")
        .update({ is_favorited: isFavorited })
        .eq("id", userAgentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-agents"] });
    },
  });
}
