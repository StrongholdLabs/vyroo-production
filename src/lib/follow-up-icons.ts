import {
  Search,
  FileText,
  Monitor,
  MessageCircle,
  Code,
  TrendingUp,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

/**
 * Maps follow-up categories to lucide-react icons.
 */
const categoryIconMap: Record<string, LucideIcon> = {
  research: Search,
  document: FileText,
  website: Monitor,
  question: MessageCircle,
  code: Code,
  analysis: TrendingUp,
  default: ArrowRight,
};

export function getFollowUpIcon(category: string): LucideIcon {
  return categoryIconMap[category] || categoryIconMap.default;
}

/**
 * Detects the category of a follow-up suggestion based on keywords in the text.
 */
export function detectCategory(text: string): string {
  const lower = text.toLowerCase();

  if (/research|search|find|look up|investigate|explore/.test(lower)) return "research";
  if (/write|draft|report|document|summary|create a doc/.test(lower)) return "document";
  if (/build|website|page|deploy|publish|html/.test(lower)) return "website";
  if (/code|implement|debug|fix|refactor|function|class/.test(lower)) return "code";
  if (/analyze|compare|trend|data|metric|performance/.test(lower)) return "analysis";
  if (/\?$|how|what|why|when|where|who|can you|could you/.test(lower)) return "question";

  return "default";
}
