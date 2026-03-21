export interface ConnectorInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: "productivity" | "communication" | "development" | "commerce";
  authType: "oauth" | "api_key";
  status: "connected" | "disconnected" | "error";
  accountInfo?: {
    email?: string;
    name?: string;
    avatar?: string;
  };
  capabilities: string[];
}

export type ConnectorCategory = ConnectorInfo["category"];

export const CATEGORY_LABELS: Record<ConnectorCategory, string> = {
  productivity: "Productivity",
  communication: "Communication",
  development: "Development",
  commerce: "Commerce",
};
