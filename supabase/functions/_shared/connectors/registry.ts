export interface ConnectorDefinition {
  id: string;
  name: string;
  icon: string; // lucide icon name
  description: string;
  category: "productivity" | "communication" | "development" | "commerce";
  authType: "oauth" | "api_key";
  capabilities: string[];
}

export const CONNECTOR_REGISTRY: Record<string, ConnectorDefinition> = {
  google: {
    id: "google",
    name: "Google",
    icon: "mail",
    description: "Gmail, Calendar, and Drive integration",
    category: "productivity",
    authType: "oauth",
    capabilities: ["email", "calendar", "drive"],
  },
  slack: {
    id: "slack",
    name: "Slack",
    icon: "message-square",
    description: "Send and receive messages in Slack channels",
    category: "communication",
    authType: "oauth",
    capabilities: ["messages", "channels"],
  },
  notion: {
    id: "notion",
    name: "Notion",
    icon: "file-text",
    description: "Access pages and databases in Notion",
    category: "productivity",
    authType: "oauth",
    capabilities: ["pages", "databases"],
  },
  github: {
    id: "github",
    name: "GitHub",
    icon: "github",
    description: "Repos, issues, and pull requests",
    category: "development",
    authType: "oauth",
    capabilities: ["repos", "issues", "pull_requests"],
  },
  shopify: {
    id: "shopify",
    name: "Shopify",
    icon: "shopping-cart",
    description: "E-commerce store management",
    category: "commerce",
    authType: "api_key",
    capabilities: ["products", "orders", "customers"],
  },
};

export function getConnector(id: string): ConnectorDefinition | undefined {
  return CONNECTOR_REGISTRY[id];
}

export function getAllConnectors(): ConnectorDefinition[] {
  return Object.values(CONNECTOR_REGISTRY);
}
