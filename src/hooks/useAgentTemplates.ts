import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { AgentTemplate, AgentCategory } from "@/types/agents";

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url.length > 0 && url !== "undefined";
};

// ─── Mock data for when Supabase is not configured ───

const mockAgentTemplates: AgentTemplate[] = [
  {
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
  {
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
  {
    id: "data-analyst-agent",
    name: "Data Analyst Agent",
    description:
      "Analyzes datasets, generates visualizations, runs statistical tests, and produces data-driven insights and dashboards.",
    icon_name: "BarChart3",
    category: "data",
    author: "Vyroo",
    is_featured: true,
    is_community: false,
    default_model: "gpt-4o",
    default_tools: ["code", "write", "search"],
    system_prompt: "You are a data analysis agent...",
    capabilities: [
      "CSV and JSON data parsing",
      "Statistical analysis",
      "Chart and visualization generation",
      "Trend identification and forecasting",
    ],
    config_schema: {},
    rating: 4.7,
    install_count: 8760,
  },
  {
    id: "web-browser-agent",
    name: "Web Browser Agent",
    description:
      "Navigates websites, extracts structured data, fills forms, and automates web-based workflows on your behalf.",
    icon_name: "Globe",
    category: "browsing",
    author: "Vyroo",
    is_featured: false,
    is_community: false,
    default_model: "claude-sonnet-4-20250514",
    default_tools: ["browse", "web_search", "write"],
    system_prompt: "You are a web browsing automation agent...",
    capabilities: [
      "Website navigation and interaction",
      "Structured data extraction",
      "Form filling and submission",
      "Multi-page workflow automation",
    ],
    config_schema: {},
    rating: 4.5,
    install_count: 6230,
  },
  {
    id: "content-creator-agent",
    name: "Content Creator Agent",
    description:
      "Creates blog posts, social media content, marketing copy, and documentation with consistent tone and style.",
    icon_name: "PenTool",
    category: "content",
    author: "Vyroo",
    is_featured: true,
    is_community: false,
    default_model: "gpt-4o",
    default_tools: ["write", "web_search", "browse"],
    system_prompt: "You are a professional content creation agent...",
    capabilities: [
      "Blog post and article writing",
      "Social media content generation",
      "SEO-optimized copywriting",
      "Documentation and technical writing",
    ],
    config_schema: {},
    rating: 4.6,
    install_count: 9840,
  },
];

// ─── List agent templates, optionally filtered by category ───

export function useAgentTemplates(category?: AgentCategory) {
  return useQuery({
    queryKey: ["agent-templates", category],
    queryFn: async (): Promise<AgentTemplate[]> => {
      if (!isSupabaseConfigured()) {
        if (category) {
          return mockAgentTemplates.filter((t) => t.category === category);
        }
        return mockAgentTemplates;
      }

      let query = supabase
        .from("agent_templates")
        .select("*")
        .order("install_count", { ascending: false });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AgentTemplate[];
    },
  });
}

// ─── Get a single agent template ───

export function useAgentTemplate(id: string) {
  return useQuery({
    queryKey: ["agent-template", id],
    enabled: !!id,
    queryFn: async (): Promise<AgentTemplate> => {
      if (!isSupabaseConfigured()) {
        const template = mockAgentTemplates.find((t) => t.id === id);
        if (!template) throw new Error(`Agent template "${id}" not found`);
        return template;
      }

      const { data, error } = await supabase
        .from("agent_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as AgentTemplate;
    },
  });
}

// ─── Get featured agent templates only ───

export function useFeaturedAgents() {
  return useQuery({
    queryKey: ["agent-templates", "featured"],
    queryFn: async (): Promise<AgentTemplate[]> => {
      if (!isSupabaseConfigured()) {
        return mockAgentTemplates.filter((t) => t.is_featured);
      }

      const { data, error } = await supabase
        .from("agent_templates")
        .select("*")
        .eq("is_featured", true)
        .order("install_count", { ascending: false });

      if (error) throw error;
      return data as AgentTemplate[];
    },
  });
}
