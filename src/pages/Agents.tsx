import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Bot,
  Loader2,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import type { AgentCategory } from "@/types/agents";
import { useAgentTemplates, useFeaturedAgents } from "@/hooks/useAgentTemplates";
import { AgentCard } from "@/components/agents/AgentCard";

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

          {/* Search bar */}
          <div className="relative mt-6 max-w-lg">
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
    </div>
  );
}
