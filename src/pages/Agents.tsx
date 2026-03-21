import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Bot,
  Loader2,
  Sparkles,
  ChevronRight,
  GitBranch,
  Plus,
  Play,
  Clock,
  Layers,
} from "lucide-react";
import type { AgentCategory } from "@/types/agents";
import type { Workflow } from "@/types/workflows";
import { useAgentTemplates, useFeaturedAgents } from "@/hooks/useAgentTemplates";
import { AgentCard } from "@/components/agents/AgentCard";
import { cn } from "@/lib/utils";

// ─── Mock workflows ───

const mockWorkflows: Workflow[] = [
  {
    id: "wf-research-report",
    user_id: "demo",
    name: "Research & Report Pipeline",
    description: "Research a topic, analyze findings, and produce a polished report.",
    nodes: [
      { id: "n1", agent_template_id: "research-agent", position: { x: 100, y: 200 }, config: {}, status: "idle" },
      { id: "n2", agent_template_id: "data-analyst-agent", position: { x: 420, y: 200 }, config: {}, status: "idle" },
      { id: "n3", agent_template_id: "content-creator-agent", position: { x: 740, y: 200 }, config: {}, status: "idle" },
    ],
    edges: [
      { id: "e1", source_node_id: "n1", target_node_id: "n2", condition: "on_success" },
      { id: "e2", source_node_id: "n2", target_node_id: "n3", condition: "on_success" },
    ],
    status: "completed",
    created_at: "2026-03-18T10:00:00Z",
    updated_at: "2026-03-20T14:30:00Z",
  },
  {
    id: "wf-code-review",
    user_id: "demo",
    name: "Code Review Automation",
    description: "Analyze code changes, run quality checks, and generate a review summary.",
    nodes: [
      { id: "n1", agent_template_id: "coding-agent", position: { x: 100, y: 200 }, config: {}, status: "idle" },
      { id: "n2", agent_template_id: "research-agent", position: { x: 420, y: 200 }, config: {}, status: "idle" },
    ],
    edges: [
      { id: "e1", source_node_id: "n1", target_node_id: "n2", condition: "on_success" },
    ],
    status: "draft",
    created_at: "2026-03-19T08:00:00Z",
    updated_at: "2026-03-21T09:00:00Z",
  },
];

// ─── Workflow card ───

function WorkflowCard({ workflow, onClick }: { workflow: Workflow; onClick: () => void }) {
  const statusColors: Record<Workflow["status"], string> = {
    draft: "bg-muted text-muted-foreground",
    running: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
    completed: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
    failed: "bg-destructive/10 text-destructive",
  };

  return (
    <button
      onClick={onClick}
      className="group relative rounded-xl border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 bg-card/50 backdrop-blur text-left w-full"
    >
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 border border-primary/20">
            <GitBranch size={20} className="text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground truncate">{workflow.name}</h3>
            <span className="text-[11px] text-muted-foreground">
              {workflow.nodes.length} agents
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider", statusColors[workflow.status])}>
            {workflow.status}
          </span>
        </div>

        {workflow.description && (
          <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
            {workflow.description}
          </p>
        )}

        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Layers size={11} />
            <span className="tabular-nums">{workflow.nodes.length} nodes</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock size={11} />
            <span>{new Date(workflow.updated_at).toLocaleDateString()}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all">
            <Play size={13} />
            Open Editor
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Page-level tab type ───

type PageTab = "agents" | "workflows";

// ─── Filter tab definitions ───

type FilterTab = "all" | AgentCategory | "community";

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "research", label: "Research" },
  { key: "coding", label: "Coding" },
  { key: "data", label: "Data Analysis" },
  { key: "browsing", label: "Web Browsing" },
  { key: "content", label: "Content Creation" },
  { key: "community", label: "Community" },
];

// ─── Skeleton card ───

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card animate-pulse">
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-accent" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 bg-accent rounded w-3/4" />
            <div className="h-3 bg-accent rounded w-1/2" />
          </div>
        </div>
        <div className="h-3 bg-accent rounded w-1/3 mb-3" />
        <div className="space-y-1.5 mb-3">
          <div className="h-3 bg-accent rounded w-full" />
          <div className="h-3 bg-accent rounded w-4/5" />
        </div>
        <div className="flex gap-1.5 mb-4">
          <div className="h-5 bg-accent rounded w-16" />
          <div className="h-5 bg-accent rounded w-20" />
          <div className="h-5 bg-accent rounded w-14" />
        </div>
        <div className="flex gap-3 mb-4">
          <div className="h-3 bg-accent rounded w-10" />
          <div className="h-3 bg-accent rounded w-10" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 bg-accent rounded-lg flex-1" />
          <div className="h-9 bg-accent rounded-lg w-24" />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ───

export default function Agents() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [pageTab, setPageTab] = useState<PageTab>("agents");

  // Data fetching
  const { data: allTemplates, isLoading } = useAgentTemplates();
  const { data: featuredTemplates } = useFeaturedAgents();

  // Filter and search
  const filteredTemplates = useMemo(() => {
    let result = allTemplates ?? [];

    // Tab filter
    if (activeTab === "community") {
      result = result.filter((t) => t.is_community);
    } else if (activeTab !== "all") {
      result = result.filter((t) => t.category === activeTab);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.author.toLowerCase().includes(q) ||
          t.capabilities.some((c) => c.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [allTemplates, activeTab, search]);

  const totalCount = allTemplates?.length ?? 0;
  const showFeatured = activeTab === "all" && !search.trim() && (featuredTemplates?.length ?? 0) > 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Hero header */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 pt-6 pb-8">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mb-4"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.6) 100%)",
                  }}
                >
                  <Bot size={20} className="text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground font-body tracking-tight">
                  AI Agents
                </h1>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                Autonomous agents that execute multi-step tasks
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3">
              <div className="text-xs font-medium text-muted-foreground px-3 py-1.5 rounded-lg border border-border bg-card">
                <span className="text-foreground tabular-nums">{totalCount}</span>
                {" agents available"}
              </div>
            </div>
          </div>

          {/* Page-level tabs: Agents | Workflows */}
          <div className="flex items-center gap-1 mt-5">
            <button
              onClick={() => setPageTab("agents")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                pageTab === "agents"
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent",
              )}
            >
              <span className="flex items-center gap-2">
                <Bot size={15} />
                Agents
              </span>
            </button>
            <button
              onClick={() => setPageTab("workflows")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                pageTab === "workflows"
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent",
              )}
            >
              <span className="flex items-center gap-2">
                <GitBranch size={15} />
                Workflows
              </span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mt-4 max-w-lg">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Agents tab content */}
      {pageTab === "agents" && (
        <>
          {/* Filter tabs */}
          <div
            className="border-b border-border sticky top-0 z-10"
            style={{ backgroundColor: "hsl(var(--background))" }}
          >
            <div className="max-w-6xl mx-auto px-6">
              <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                        isActive
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-6xl mx-auto px-6 py-6">
            {/* Loading state */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* Featured section */}
            {!isLoading && showFeatured && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={14} className="text-amber-400" />
                  <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Featured Agents
                  </h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {featuredTemplates!.map((template) => (
                    <div key={template.id} className="w-[340px] flex-shrink-0">
                      <AgentCard
                        template={template}
                        onRun={() => navigate(`/agents/run/${template.id}`)}
                        onConfigure={() => navigate(`/agents/configure/${template.id}`)}
                      />
                    </div>
                  ))}
                  {/* See all nudge */}
                  <div className="w-[120px] flex-shrink-0 flex items-center justify-center">
                    <button
                      onClick={() => {}}
                      className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronRight size={18} />
                      <span className="text-[11px]">See all</span>
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Main grid */}
            {!isLoading && filteredTemplates.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Bot size={40} className="text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {search.trim()
                    ? "No agents match your search"
                    : "No agents available in this category"}
                </p>
              </div>
            )}

            {!isLoading && filteredTemplates.length > 0 && (
              <>
                {showFeatured && (
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      All Agents
                    </h2>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <AgentCard
                      key={template.id}
                      template={template}
                      onRun={() => navigate(`/agents/run/${template.id}`)}
                      onConfigure={() => navigate(`/agents/configure/${template.id}`)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Stats bar */}
          {!isLoading && (
            <div className="border-t border-border">
              <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  <span className="tabular-nums text-foreground">{filteredTemplates.length}</span>
                  {filteredTemplates.length !== totalCount
                    ? ` of ${totalCount} agents shown`
                    : " agents available"}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Workflows tab content */}
      {pageTab === "workflows" && (
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* New Workflow button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Your Workflows
            </h2>
            <button
              onClick={() => navigate("/agents/workflow/new")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all"
            >
              <Plus size={13} />
              New Workflow
            </button>
          </div>

          {/* Workflow cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockWorkflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onClick={() => navigate(`/agents/workflow/${workflow.id}`)}
              />
            ))}
          </div>

          {/* Stats bar */}
          <div className="border-t border-border mt-8">
            <div className="max-w-6xl mx-auto py-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                <span className="tabular-nums text-foreground">{mockWorkflows.length}</span>
                {" workflows"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
