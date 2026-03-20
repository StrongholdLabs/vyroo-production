import React from "react";
import {
  Search,
  Globe,
  FileText,
  Sparkles,
  Code,
  Palette,
  ShoppingCart,
  TrendingUp,
  Calendar,
  FlaskConical,
  HelpCircle,
} from "lucide-react";
import type { BrowserTab, BrowserPageContent } from "@/components/computer/BrowserView";
import type { SearchResult } from "@/components/computer/SearchView";
import type { ResearchTask } from "@/components/computer/TaskProgressPanel";
import type { TimelineEntry } from "@/components/computer/ResearchTimeline";

export type { ResearchTask } from "@/components/computer/TaskProgressPanel";
export type { TimelineEntry } from "@/components/computer/ResearchTimeline";

// Pure data interfaces (serializable, no React.ReactNode)

export interface LogEntry {
  time: string;
  text: string;
  type: "info" | "action" | "result";
}

export interface SubTask {
  text: string;
  type?: "edit" | "image" | "terminal";
  imageUrl?: string;
}

export interface StepData {
  id: number;
  label: string;
  detail: string;
  status: "complete" | "active" | "pending";
  icon_name: string;
  logs: LogEntry[];
  subTasks?: SubTask[];
}

// Step with React icon for rendering (used in components)
export interface Step {
  id: number;
  label: string;
  detail: string;
  status: "complete" | "active" | "pending";
  icon: React.ReactNode;
  logs: LogEntry[];
  subTasks?: SubTask[];
}

export interface CodeLine {
  num: number;
  content: string;
  color?: string;
}

export interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  expanded?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  hasReport?: boolean;
  reportTitle?: string;
  reportSummary?: string;
  tableData?: { headers: string[]; rows: string[][] };
  created_at?: string;
}

export interface SuggestedFollowUp {
  icon: React.ReactNode;
  text: string;
}

export interface ProjectInfo {
  name: string;
  description: string;
  status: "initialized" | "building" | "complete";
}

export type ComputerViewType = "editor" | "browser" | "search";

export interface ComputerViewState {
  type: ComputerViewType;
  browserTabs?: BrowserTab[];
  browserUrl?: string;
  browserContent?: BrowserPageContent;
  searchQuery?: string;
  searchResults?: SearchResult[];
  timeline?: TimelineEntry[];
}

export interface Conversation {
  id: string;
  title: string;
  icon: string;
  type: "intelligence" | "website" | "research";
  steps: Step[];
  messages: ChatMessage[];
  followUps: SuggestedFollowUp[];
  codeLines: CodeLine[];
  fileName: string;
  editorLabel: string;
  fileTree?: FileNode[];
  isComplete?: boolean;
  project?: ProjectInfo;
  computerView?: ComputerViewState;
  researchTasks?: ResearchTask[];
}

// Icon name to React element mapping
const iconMap: Record<string, (size: number) => React.ReactNode> = {
  sparkles: (size) => React.createElement(Sparkles, { size }),
  search: (size) => React.createElement(Search, { size }),
  globe: (size) => React.createElement(Globe, { size }),
  "file-text": (size) => React.createElement(FileText, { size }),
  code: (size) => React.createElement(Code, { size }),
  palette: (size) => React.createElement(Palette, { size }),
  "shopping-cart": (size) => React.createElement(ShoppingCart, { size }),
  "trending-up": (size) => React.createElement(TrendingUp, { size }),
  calendar: (size) => React.createElement(Calendar, { size }),
  "flask-conical": (size) => React.createElement(FlaskConical, { size }),
  "help-circle": (size) => React.createElement(HelpCircle, { size }),
};

export function getStepIcon(iconName: string, size = 14): React.ReactNode {
  const factory = iconMap[iconName];
  return factory ? factory(size) : React.createElement(Sparkles, { size });
}

// Convert a StepData (from DB) to a Step (for rendering)
export function toStep(data: StepData): Step {
  return {
    id: data.id,
    label: data.label,
    detail: data.detail,
    status: data.status,
    icon: getStepIcon(data.icon_name),
    logs: data.logs,
    subTasks: data.subTasks,
  };
}
