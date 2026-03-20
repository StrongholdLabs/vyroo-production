import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ConnectorInfo } from "@/types/connectors";

// Client-side registry (mirrors the edge function shared registry)
const CONNECTOR_REGISTRY: Omit<ConnectorInfo, "status" | "accountInfo">[] = [
  {
    id: "google",
    name: "Google",
    icon: "mail",
    description: "Gmail, Calendar, and Drive integration",
    category: "productivity",
    authType: "oauth",
    capabilities: ["email", "calendar", "drive"],
  },
  {
    id: "slack",
    name: "Slack",
    icon: "message-square",
    description: "Send and receive messages in Slack channels",
    category: "communication",
    authType: "oauth",
    capabilities: ["messages", "channels"],
  },
  {
    id: "notion",
    name: "Notion",
    icon: "file-text",
    description: "Access pages and databases in Notion",
    category: "productivity",
    authType: "oauth",
    capabilities: ["pages", "databases"],
  },
  {
    id: "github",
    name: "GitHub",
    icon: "github",
    description: "Repos, issues, and pull requests",
    category: "development",
    authType: "oauth",
    capabilities: ["repos", "issues", "pull_requests"],
  },
  {
    id: "shopify",
    name: "Shopify",
    icon: "shopping-cart",
    description: "E-commerce store management",
    category: "commerce",
    authType: "api_key",
    capabilities: ["products", "orders", "customers"],
  },
];

const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url.length > 0 && url !== "undefined";
};

// ─── List all connectors (registry merged with user status) ───

export function useConnectors() {
  return useQuery({
    queryKey: ["connectors"],
    queryFn: async (): Promise<ConnectorInfo[]> => {
      if (!isSupabaseConfigured()) {
        // Return registry with all disconnected
        return CONNECTOR_REGISTRY.map((c) => ({
          ...c,
          status: "disconnected" as const,
        }));
      }

      const { data: userConnectors, error } = await supabase
        .from("user_connectors")
        .select("connector_id, status, account_info");

      if (error) throw error;

      const connectorMap = new Map(
        (userConnectors || []).map((uc) => [uc.connector_id, uc])
      );

      return CONNECTOR_REGISTRY.map((def) => {
        const userConn = connectorMap.get(def.id);
        return {
          ...def,
          status: (userConn?.status as ConnectorInfo["status"]) || "disconnected",
          accountInfo: (userConn?.account_info as ConnectorInfo["accountInfo"]) || undefined,
        };
      });
    },
  });
}

// ─── Connect via API key ───

export function useConnectAPIKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      connectorId,
      apiKey,
    }: {
      connectorId: string;
      apiKey: string;
    }) => {
      if (!isSupabaseConfigured()) {
        // Simulate success
        return { success: true };
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("user_connectors").upsert(
        {
          user_id: user.id,
          connector_id: connectorId,
          status: "connected",
          access_token_encrypted: apiKey,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,connector_id" }
      );

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connectors"] });
    },
  });
}

// ─── Disconnect a connector ───

export function useDisconnectConnector() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectorId: string) => {
      if (!isSupabaseConfigured()) {
        return { success: true };
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_connectors")
        .delete()
        .eq("user_id", user.id)
        .eq("connector_id", connectorId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connectors"] });
    },
  });
}
