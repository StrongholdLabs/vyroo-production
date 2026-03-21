import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ─── Types ───

export type MarketplaceStatus = "draft" | "pending_review" | "published" | "rejected" | "suspended";

export interface PublishedAgent {
  id: string;
  creator_id: string;
  creator_name?: string;
  template_id?: string;
  name: string;
  description: string;
  long_description?: string;
  price_monthly: number;
  revenue_share: number;
  category: string;
  tags: string[];
  icon_name: string;
  install_count: number;
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_featured: boolean;
  status: MarketplaceStatus;
  published_at?: string;
  created_at: string;
}

export interface AgentReview {
  id: string;
  agent_id: string;
  user_id: string;
  user_name?: string;
  rating: number;
  review: string;
  created_at: string;
}

export interface MarketplaceFilters {
  search?: string;
  category?: string;
  priceType?: "free" | "paid" | "all";
  sortBy?: "popular" | "rating" | "newest" | "price_low" | "price_high";
}

// ─── Check Supabase ───

const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url.length > 0 && url !== "undefined";
};

// ─── Mock marketplace agents ───

const mockPublishedAgents: PublishedAgent[] = [
  {
    id: "mp-seo-optimizer",
    creator_id: "user-1",
    creator_name: "Sarah Chen",
    name: "SEO Optimizer Pro",
    description: "Analyzes your website content, identifies SEO issues, and generates optimized meta tags, headings, and content suggestions to improve search rankings.",
    long_description: "# SEO Optimizer Pro\n\nA comprehensive SEO analysis agent that helps you rank higher in search results.",
    price_monthly: 0,
    revenue_share: 0.80,
    category: "content",
    tags: ["seo", "marketing", "content"],
    icon_name: "Search",
    install_count: 4520,
    rating: 4.7,
    review_count: 128,
    is_verified: true,
    is_featured: true,
    status: "published",
    published_at: "2025-12-15T00:00:00Z",
    created_at: "2025-12-10T00:00:00Z",
  },
  {
    id: "mp-api-tester",
    creator_id: "user-2",
    creator_name: "Marcus Johnson",
    name: "API Test Suite",
    description: "Automatically generates and runs comprehensive API test suites. Supports REST and GraphQL endpoints with assertion validation.",
    long_description: "# API Test Suite\n\nAutomate your API testing workflow.",
    price_monthly: 9.99,
    revenue_share: 0.80,
    category: "coding",
    tags: ["api", "testing", "automation"],
    icon_name: "Code",
    install_count: 2830,
    rating: 4.8,
    review_count: 87,
    is_verified: true,
    is_featured: true,
    status: "published",
    published_at: "2026-01-05T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "mp-market-research",
    creator_id: "user-3",
    creator_name: "Priya Patel",
    name: "Market Intelligence",
    description: "Gathers competitive intelligence, tracks market trends, and generates comprehensive market analysis reports with data visualizations.",
    long_description: "# Market Intelligence\n\nStay ahead of competition with AI-powered market research.",
    price_monthly: 19.99,
    revenue_share: 0.80,
    category: "research",
    tags: ["market-research", "competitive-analysis", "trends"],
    icon_name: "BarChart3",
    install_count: 1950,
    rating: 4.6,
    review_count: 64,
    is_verified: true,
    is_featured: false,
    status: "published",
    published_at: "2026-01-20T00:00:00Z",
    created_at: "2026-01-18T00:00:00Z",
  },
  {
    id: "mp-social-manager",
    creator_id: "user-4",
    creator_name: "Alex Rivera",
    name: "Social Media Manager",
    description: "Creates, schedules, and optimizes social media posts across platforms. Includes hashtag research and engagement analytics.",
    long_description: "# Social Media Manager\n\nYour AI-powered social media assistant.",
    price_monthly: 14.99,
    revenue_share: 0.80,
    category: "content",
    tags: ["social-media", "marketing", "scheduling"],
    icon_name: "PenTool",
    install_count: 3670,
    rating: 4.5,
    review_count: 112,
    is_verified: false,
    is_featured: true,
    status: "published",
    published_at: "2026-02-01T00:00:00Z",
    created_at: "2026-01-28T00:00:00Z",
  },
  {
    id: "mp-data-pipeline",
    creator_id: "user-5",
    creator_name: "James Wright",
    name: "Data Pipeline Builder",
    description: "Designs and implements data processing pipelines. Handles CSV, JSON, and API data sources with transformation and validation steps.",
    long_description: "# Data Pipeline Builder\n\nBuild robust data pipelines without code.",
    price_monthly: 0,
    revenue_share: 0.80,
    category: "data",
    tags: ["data-pipeline", "etl", "automation"],
    icon_name: "BarChart3",
    install_count: 1280,
    rating: 4.4,
    review_count: 42,
    is_verified: false,
    is_featured: false,
    status: "published",
    published_at: "2026-02-10T00:00:00Z",
    created_at: "2026-02-08T00:00:00Z",
  },
];

const mockReviews: AgentReview[] = [
  {
    id: "rev-1",
    agent_id: "mp-seo-optimizer",
    user_id: "u1",
    user_name: "Emily Park",
    rating: 5,
    review: "Incredibly useful for optimizing my blog content. Saw a 40% increase in organic traffic within 2 months.",
    created_at: "2026-02-15T00:00:00Z",
  },
  {
    id: "rev-2",
    agent_id: "mp-seo-optimizer",
    user_id: "u2",
    user_name: "David Kim",
    rating: 4,
    review: "Great for quick SEO audits. Would love to see more detailed keyword analysis.",
    created_at: "2026-02-20T00:00:00Z",
  },
  {
    id: "rev-3",
    agent_id: "mp-api-tester",
    user_id: "u3",
    user_name: "Lisa Chen",
    rating: 5,
    review: "Saves hours of manual testing. The GraphQL support is excellent.",
    created_at: "2026-03-01T00:00:00Z",
  },
];

// ─── Hooks ───

export function usePublishedAgents(filters?: MarketplaceFilters) {
  return useQuery({
    queryKey: ["marketplace-agents", filters],
    queryFn: async (): Promise<PublishedAgent[]> => {
      if (!isSupabaseConfigured()) {
        let results = [...mockPublishedAgents];

        if (filters?.search) {
          const q = filters.search.toLowerCase();
          results = results.filter(
            (a) =>
              a.name.toLowerCase().includes(q) ||
              a.description.toLowerCase().includes(q) ||
              a.tags.some((t) => t.toLowerCase().includes(q)),
          );
        }

        if (filters?.category && filters.category !== "all") {
          results = results.filter((a) => a.category === filters.category);
        }

        if (filters?.priceType === "free") {
          results = results.filter((a) => a.price_monthly === 0);
        } else if (filters?.priceType === "paid") {
          results = results.filter((a) => a.price_monthly > 0);
        }

        switch (filters?.sortBy) {
          case "rating":
            results.sort((a, b) => b.rating - a.rating);
            break;
          case "newest":
            results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            break;
          case "price_low":
            results.sort((a, b) => a.price_monthly - b.price_monthly);
            break;
          case "price_high":
            results.sort((a, b) => b.price_monthly - a.price_monthly);
            break;
          default:
            results.sort((a, b) => b.install_count - a.install_count);
        }

        return results;
      }

      let query = supabase
        .from("published_agents")
        .select("*")
        .eq("status", "published");

      if (filters?.category && filters.category !== "all") {
        query = query.eq("category", filters.category);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.priceType === "free") {
        query = query.eq("price_monthly", 0);
      } else if (filters?.priceType === "paid") {
        query = query.gt("price_monthly", 0);
      }

      switch (filters?.sortBy) {
        case "rating":
          query = query.order("rating", { ascending: false });
          break;
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        case "price_low":
          query = query.order("price_monthly", { ascending: true });
          break;
        case "price_high":
          query = query.order("price_monthly", { ascending: false });
          break;
        default:
          query = query.order("install_count", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PublishedAgent[];
    },
  });
}

export function usePublishAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agent: {
      name: string;
      description: string;
      long_description?: string;
      price_monthly?: number;
      category: string;
      tags?: string[];
      icon_name?: string;
      template_id?: string;
    }) => {
      if (!isSupabaseConfigured()) {
        return { id: `mp-${Date.now()}`, ...agent, status: "pending_review" };
      }

      const { data, error } = await supabase
        .from("published_agents")
        .insert({
          ...agent,
          status: "pending_review",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-agents"] });
    },
  });
}

export function useInstallAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentId: string) => {
      if (!isSupabaseConfigured()) {
        return { agent_id: agentId, installed: true };
      }

      const { data, error } = await supabase
        .from("agent_installs")
        .insert({ agent_id: agentId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-agents"] });
      queryClient.invalidateQueries({ queryKey: ["installed-agents"] });
    },
  });
}

export function useUninstallAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentId: string) => {
      if (!isSupabaseConfigured()) {
        return { agent_id: agentId, uninstalled: true };
      }

      const { error } = await supabase
        .from("agent_installs")
        .delete()
        .eq("agent_id", agentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-agents"] });
      queryClient.invalidateQueries({ queryKey: ["installed-agents"] });
    },
  });
}

export function useAgentReviews(agentId: string) {
  return useQuery({
    queryKey: ["agent-reviews", agentId],
    enabled: !!agentId,
    queryFn: async (): Promise<AgentReview[]> => {
      if (!isSupabaseConfigured()) {
        return mockReviews.filter((r) => r.agent_id === agentId);
      }

      const { data, error } = await supabase
        .from("agent_reviews")
        .select("*")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AgentReview[];
    },
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: {
      agent_id: string;
      rating: number;
      review: string;
    }) => {
      if (!isSupabaseConfigured()) {
        return { id: `rev-${Date.now()}`, ...review };
      }

      const { data, error } = await supabase
        .from("agent_reviews")
        .upsert(review)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["agent-reviews", variables.agent_id] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-agents"] });
    },
  });
}
