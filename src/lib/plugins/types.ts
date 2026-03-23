import type { LucideIcon } from "lucide-react";

/** A vertical plugin that extends Vyroo with domain-specific capabilities */
export interface VyrooPlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  icon: string; // lucide icon name
  vertical: VerticalType;

  // What the plugin provides
  skills?: PluginSkill[];
  connectors?: PluginConnector[];
  tools?: PluginTool[];
  dashboardWidgets?: PluginWidget[];

  // Lifecycle hooks
  onActivate?: () => Promise<void>;
  onDeactivate?: () => Promise<void>;
}

export type VerticalType =
  | "general"
  | "ecommerce"
  | "healthcare"
  | "education"
  | "finance"
  | "marketing"
  | "devtools"
  | "custom";

export interface PluginSkill {
  id: string;
  name: string;
  description: string;
  iconName: string;
  category: "core" | "analysis" | "integration" | "vertical";
  tools: string[];
}

export interface PluginConnector {
  id: string;
  name: string;
  description: string;
  iconName: string;
  authType: "oauth" | "api_key" | "webhook";
  category: string;
}

export interface PluginTool {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  handler: string; // edge function path
}

export interface ToolParameter {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required?: boolean;
  enum?: string[];
}

export interface PluginWidget {
  id: string;
  name: string;
  position: "sidebar" | "main" | "header";
  component: string; // lazy-loaded component path
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  vertical: VerticalType;
  description: string;
  author: string;
  homepage?: string;
  icon: string;
  skills: string[];
  connectors: string[];
  tools: string[];
  widgets: string[];
  permissions: string[];
}

export interface InstalledPlugin {
  pluginId: string;
  isActive: boolean;
  installedAt: Date;
  config: Record<string, unknown>;
}
