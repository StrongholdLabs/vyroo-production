import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Bot, Play, Star, Download, Zap,
  Search, Code, BarChart2, Globe, PenTool,
  Loader2, BarChart3, Settings2,
} from "lucide-react";
import { AgentConfigPanel } from "@/components/agents/AgentConfigPanel";
import { AgentAnalytics } from "@/components/agents/AgentAnalytics";
import { cn } from "@/lib/utils";
import type { AgentRunConfig, AgentTemplate, AgentCategory } from "@/types/agents";

const categoryIcons: Record<AgentCategory, React.ReactNode> = {
  research: <Search size={20} />,
  coding: <Code size={20} />,
  data: <BarChart2 size={20} />,
  browsing: <Globe size={20} />,
  content: <PenTool size={20} />,
  custom: <Bot size={20} />,
};

const categoryColors: Record<AgentCategory, string> = {
  research: "from-blue-500/20 to-blue-600/5 border-blue-500/20",
  coding: "from-purple-500/20 to-purple-600/5 border-purple-500/20",
  data: "from-green-500/20 to-green-600/5 border-green-500/20",
  browsing: "from-orange-500/20 to-orange-600/5 border-orange-500/20",
  content: "from-pink-500/20 to-pink-600/5 border-pink-500/20",
  custom: "from-gray-500/20 to-gray-600/5 border-gray-500/20",
};

// Mock templates - will be replaced by useAgentTemplate hook
const mockTemplates: Record<string, AgentTemplate> = {
  "research-agent": {
    id: "research-agent", name: "Research Agent",
    description: "Deep web research with source citation. This agent searches the web, extracts content from pages, and synthesizes findings into a comprehensive report with proper citations.",
    icon_name: "search", category: "research", author: "vyroo",
    is_featured: true, is_community: false,
    default_model: "claude-sonnet-4-20250514",
    default_tools: ["web_search", "browse_url", "extract_content", "summarize"],
    system_prompt: "", capabilities: ["web_search", "browse_url", "extract_content", "summarize"],
    config_schema: {}, rating: 4.9, install_count: 8500,
  },
  "coding-agent": {
    id: "coding-agent", name: "Coding Agent",
    description: "Code generation, debugging, and refactoring. Writes clean, tested code in multiple languages with best practices.",
    icon_name: "code", category: "coding", author: "vyroo",
    is_featured: true, is_community: false,
    default_model: "claude-sonnet-4-20250514",
    default_tools: ["generate_code", "review_code", "debug_code", "run_tests"],
    system_prompt: "", capabilities: ["generate_code", "review_code", "debug_code", "run_tests"],
    config_schema: {}, rating: 4.8, install_count: 6200,
  },
  "data-analyst-agent": {
    id: "data-analyst-agent", name: "Data Analysis Agent",
    description: "CSV/data analysis, visualization, and statistical insights. Processes data files and creates charts and reports.",
    icon_name: "bar-chart-2", category: "data", author: "vyroo",
    is_featured: true, is_community: false,
    default_model: "claude-sonnet-4-20250514",
    default_tools: ["analyze_csv", "create_chart", "statistics", "generate_report"],
    system_prompt: "", capabilities: ["analyze_csv", "create_chart", "statistics", "generate_report"],
    config_schema: {}, rating: 4.7, install_count: 4800,
  },
  "web-browser-agent": {
    id: "web-browser-agent", name: "Web Browsing Agent",
    description: "Autonomous web navigation and data extraction. Browses websites, fills forms, and captures screenshots.",
    icon_name: "globe", category: "browsing", author: "vyroo",
    is_featured: true, is_community: false,
    default_model: "claude-sonnet-4-20250514",
    default_tools: ["browse_url", "extract_content", "fill_form", "screenshot"],
    system_prompt: "", capabilities: ["browse_url", "extract_content", "fill_form", "screenshot"],
    config_schema: {}, rating: 4.6, install_count: 3500,
  },
  "content-creator-agent": {
    id: "content-creator-agent", name: "Content Creation Agent",
    description: "Blog posts, social media, marketing copy. Creates compelling content optimized for engagement and SEO.",
    icon_name: "pen-tool", category: "content", author: "vyroo",
    is_featured: true, is_community: false,
    default_model: "claude-sonnet-4-20250514",
    default_tools: ["write_report", "generate_description", "seo_optimize"],
    system_prompt: "", capabilities: ["write_report", "generate_description", "seo_optimize"],
    config_schema: {}, rating: 4.7, install_count: 5100,
  },
};

const AgentConfigPage = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const template = mockTemplates[templateId || ""] || mockTemplates["research-agent"];

  const [config, setConfig] = useState<AgentRunConfig>({
    model: template.default_model,
    enabled_tools: [...template.default_tools],
    max_steps: 20,
    auto_approve_tools: false,
  });
  const [goal, setGoal] = useState("");
  const [isLaunching, setIsLaunching] = useState(false);
  const [activeTab, setActiveTab] = useState<"configure" | "analytics">("configure");

  const handleLaunch = useCallback(() => {
    if (!goal.trim()) return;
    setIsLaunching(true);
    // In production: useCreateAgentRun mutation
    setTimeout(() => {
      navigate(`/agents/run/demo-${Date.now()}`);
    }, 800);
  }, [goal, config, navigate]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
        <button
          onClick={() => navigate("/agents")}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} />
        </button>
        <span className="text-sm font-medium text-foreground">Configure Agent</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
          {/* Agent header card */}
          <div
            className={`rounded-2xl border bg-gradient-to-br p-6 ${categoryColors[template.category]}`}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-background/50 backdrop-blur flex items-center justify-center flex-shrink-0">
                {categoryIcons[template.category]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">{template.name}</h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                    {template.category}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    {template.rating}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Download size={12} />
                    {template.install_count.toLocaleString()} runs
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Zap size={12} />
                    {template.capabilities.length} tools
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("configure")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === "configure"
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent",
              )}
            >
              <span className="flex items-center gap-2">
                <Settings2 size={15} />
                Configure
              </span>
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === "analytics"
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent",
              )}
            >
              <span className="flex items-center gap-2">
                <BarChart3 size={15} />
                Analytics
              </span>
            </button>
          </div>

          {/* Configure tab */}
          {activeTab === "configure" && (
            <>
              {/* Goal input */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  What should this agent do?
                </label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder={
                    template.category === "research"
                      ? "e.g., Research the AI SaaS competitive landscape and create an analysis report..."
                      : template.category === "coding"
                      ? "e.g., Build a REST API for user authentication with JWT tokens..."
                      : template.category === "data"
                      ? "e.g., Analyze this sales CSV and create a dashboard with trends..."
                      : template.category === "browsing"
                      ? "e.g., Navigate to competitor websites and extract their pricing pages..."
                      : "e.g., Write a series of blog posts about AI automation trends..."
                  }
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              {/* Config panel */}
              <div className="rounded-xl border border-border bg-card/50 p-4">
                <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                  <Zap size={14} className="text-primary" />
                  Configuration
                </h2>
                <AgentConfigPanel
                  template={template}
                  config={config}
                  onConfigChange={setConfig}
                />
              </div>

              {/* Launch button */}
              <button
                onClick={handleLaunch}
                disabled={!goal.trim() || isLaunching}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLaunching ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Launching Agent...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Launch Agent
                  </>
                )}
              </button>
            </>
          )}

          {/* Analytics tab */}
          {activeTab === "analytics" && (
            <AgentAnalytics agentId={templateId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentConfigPage;
