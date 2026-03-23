import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Bot, ArrowLeft, Pause, Play, X, Send,
  Loader2, Settings, ChevronDown,
} from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ComputerPanel } from "@/components/ComputerPanel";
import { AgentPlanView } from "@/components/agents/AgentPlanView";
import { AgentStatusBar } from "@/components/agents/AgentStatusBar";
import { AgentApprovalCard } from "@/components/agents/AgentApprovalCard";
import { AgentResultCard } from "@/components/agents/AgentResultCard";
import { useIsMobile } from "@/hooks/use-mobile";
import type {
  AgentRun as AgentRunType,
  AgentStep,
  AgentRunStatus,
  AgentTemplate,
} from "@/types/agents";
import type { CodeLine, Step, FileNode, ComputerViewState } from "@/data/conversations";

// Mock data for demo - will be replaced by useAgentRun hook
const mockTemplate: AgentTemplate = {
  id: "research-agent",
  name: "Research Agent",
  description: "Deep web research with source citation",
  icon_name: "search",
  category: "research",
  author: "vyroo",
  is_featured: true,
  is_community: false,
  default_model: "claude-sonnet-4-20250514",
  default_tools: ["web_search", "browse_url", "extract_content", "summarize"],
  system_prompt: "",
  capabilities: ["web_search", "browse_url", "extract_content", "summarize"],
  config_schema: {},
  rating: 4.9,
  install_count: 8500,
};

const mockSteps: AgentStep[] = [
  {
    id: "s1", run_id: "r1", step_number: 1, type: "plan", label: "Analyzing request and creating plan",
    status: "complete", icon_name: "brain", input: {}, output: { plan: "5 step research plan" },
    duration_ms: 2100, started_at: "2026-03-21T10:00:00Z", completed_at: "2026-03-21T10:00:02Z",
  },
  {
    id: "s2", run_id: "r1", step_number: 2, type: "search", label: "Searching for competitor analysis data",
    status: "complete", icon_name: "search", input: { query: "AI SaaS competitor analysis 2026" },
    output: { results: 12 }, tool_name: "web_search",
    duration_ms: 3400, started_at: "2026-03-21T10:00:02Z", completed_at: "2026-03-21T10:00:06Z",
  },
  {
    id: "s3", run_id: "r1", step_number: 3, type: "browse", label: "Extracting data from top sources",
    detail: "Reading techcrunch.com/ai-saas-landscape-2026...",
    status: "active", icon_name: "globe", input: { url: "https://techcrunch.com" },
    output: {}, tool_name: "browse_url",
  },
  {
    id: "s4", run_id: "r1", step_number: 4, type: "llm_call", label: "Synthesizing findings",
    status: "pending", icon_name: "sparkles", input: {}, output: {},
  },
  {
    id: "s5", run_id: "r1", step_number: 5, type: "write", label: "Generating comprehensive report",
    status: "pending", icon_name: "pen-tool", input: {}, output: {},
  },
];

const mockCodeLines: CodeLine[] = [
  { num: 1, content: "# AI SaaS Competitor Analysis Report", color: "text-blue-400" },
  { num: 2, content: "", color: "text-gray-500" },
  { num: 3, content: "## Executive Summary", color: "text-blue-400" },
  { num: 4, content: "", color: "text-gray-500" },
  { num: 5, content: "The AI SaaS landscape in 2026 has seen significant", color: "text-gray-300" },
  { num: 6, content: "consolidation with key players emerging across", color: "text-gray-300" },
  { num: 7, content: "multiple verticals...", color: "text-gray-300" },
  { num: 8, content: "", color: "text-gray-500" },
  { num: 9, content: "## Key Findings", color: "text-blue-400" },
  { num: 10, content: "", color: "text-gray-500" },
  { num: 11, content: "1. Market size projected at $180B by 2027", color: "text-gray-300" },
  { num: 12, content: "2. Agent-based platforms gaining 40% market share", color: "text-gray-300" },
  { num: 13, content: "3. Plugin ecosystems becoming key differentiator", color: "text-gray-300" },
];

const mockComputerSteps: Step[] = [
  { id: 1, label: "Planning research approach", detail: "Analyzed user query", status: "complete", icon: null, logs: [] },
  { id: 2, label: "Searching web sources", detail: "Found 12 relevant sources", status: "complete", icon: null, logs: [] },
  { id: 3, label: "Extracting data", detail: "Processing techcrunch.com", status: "active", icon: null, logs: [] },
];

function formatElapsed(startedAt: string): string {
  const elapsed = Date.now() - new Date(startedAt).getTime();
  const seconds = Math.floor(elapsed / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

const AgentRunPage = () => {
  const { runId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const inputRef = useRef<HTMLInputElement>(null);

  // State — will be connected to useAgentRun hook
  const [status, setStatus] = useState<AgentRunStatus>("running");
  const [steps, setSteps] = useState<AgentStep[]>(mockSteps);
  const [elapsed, setElapsed] = useState("0s");
  const [goal] = useState("Research the AI SaaS competitive landscape and create a comprehensive analysis report");
  const [inputValue, setInputValue] = useState("");
  const [approvalNeeded, setApprovalNeeded] = useState<AgentStep | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Update elapsed timer
  useEffect(() => {
    if (status !== "running" && status !== "planning") return;
    const interval = setInterval(() => {
      setElapsed(formatElapsed("2026-03-21T10:00:00Z"));
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Simulate step progression for demo
  useEffect(() => {
    if (status !== "running") return;

    const timer = setTimeout(() => {
      setSteps((prev) => {
        const activeIdx = prev.findIndex((s) => s.status === "active");
        if (activeIdx === -1) return prev;

        const updated = [...prev];
        // Complete current step
        updated[activeIdx] = {
          ...updated[activeIdx],
          status: "complete",
          duration_ms: Math.floor(Math.random() * 5000) + 1000,
          completed_at: new Date().toISOString(),
          output: { result: "Step completed successfully" },
        };

        // Activate next step
        if (activeIdx + 1 < updated.length) {
          updated[activeIdx + 1] = {
            ...updated[activeIdx + 1],
            status: "active",
            started_at: new Date().toISOString(),
            detail: "Processing...",
          };
        } else {
          // All done
          setStatus("completed");
          setShowResult(true);
        }
        return updated;
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, [status, steps]);

  const activeStep = steps.find((s) => s.status === "active");
  const completedSteps = steps.filter((s) => s.status === "complete").length;

  const handlePause = useCallback(() => setStatus("paused"), []);
  const handleResume = useCallback(() => setStatus("running"), []);
  const handleCancel = useCallback(() => {
    setStatus("cancelled");
    setTimeout(() => navigate("/agents"), 1500);
  }, [navigate]);

  const handleSendInstruction = useCallback(() => {
    if (!inputValue.trim()) return;
    // In production: send to the running agent stream
    setInputValue("");
  }, [inputValue]);

  const handleApprove = useCallback((alwaysApprove: boolean) => {
    setApprovalNeeded(null);
    // In production: send approval via agent stream
  }, []);

  const handleDeny = useCallback(() => {
    setApprovalNeeded(null);
    // In production: send denial
  }, []);

  // ComputerPanel view state derived from current step
  const computerView: ComputerViewState | undefined =
    activeStep?.type === "browse"
      ? {
          type: "browser" as const,
          browserUrl: "https://techcrunch.com/ai-saas-landscape-2026",
          browserTabs: [
            { id: "1", title: "TechCrunch - AI SaaS", url: "https://techcrunch.com/ai-saas-landscape-2026", active: true },
          ],
          browserContent: {
            title: "AI SaaS Landscape 2026",
            sections: [
              { heading: "Market Overview", content: "The AI SaaS market continues rapid growth..." },
              { heading: "Key Players", content: "Leading platforms include..." },
            ],
          },
        }
      : activeStep?.type === "search"
      ? {
          type: "search" as const,
          searchQuery: "AI SaaS competitor analysis 2026",
          searchResults: [
            { title: "AI SaaS Market Report 2026", url: "https://example.com/report", snippet: "Comprehensive analysis of the AI SaaS landscape..." },
            { title: "Top AI Platforms Compared", url: "https://example.com/comparison", snippet: "Side-by-side comparison of leading AI platforms..." },
          ],
        }
      : undefined;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
        <button
          onClick={() => navigate("/agents")}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} />
        </button>

        <AgentStatusBar
          agentName={mockTemplate.name}
          status={status}
          currentStep={activeStep?.label}
          stepProgress={`${completedSteps}/${steps.length}`}
          elapsedTime={elapsed}
        />

        {/* Control buttons */}
        <div className="flex items-center gap-1 ml-auto">
          {(status === "running" || status === "planning") && (
            <button
              onClick={handlePause}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400/10 text-yellow-400 text-xs font-medium hover:bg-yellow-400/20 transition-colors"
            >
              <Pause size={12} />
              Pause
            </button>
          )}
          {status === "paused" && (
            <button
              onClick={handleResume}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] text-xs font-medium hover:bg-[hsl(var(--success))]/20 transition-colors"
            >
              <Play size={12} />
              Resume
            </button>
          )}
          {status !== "completed" && status !== "cancelled" && status !== "failed" && (
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
            >
              <X size={12} />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {!isMobile ? (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Left: Plan + Chat */}
            <ResizablePanel defaultSize={45} minSize={30}>
              <div className="h-full flex flex-col">
                {/* Goal */}
                <div className="px-4 py-3 border-b border-border/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Goal</p>
                  <p className="text-sm text-foreground">{goal}</p>
                </div>

                {/* Steps / Plan */}
                <div className="flex-1 overflow-y-auto">
                  <AgentPlanView
                    steps={steps}
                    onRetryStep={(stepNum) => {
                      // In production: retry from step
                      console.log("Retry step", stepNum);
                    }}
                  />

                  {/* Approval card */}
                  {approvalNeeded && (
                    <AgentApprovalCard
                      stepNumber={approvalNeeded.step_number}
                      toolName={approvalNeeded.tool_name || "unknown_tool"}
                      args={approvalNeeded.input}
                      onApprove={handleApprove}
                      onDeny={handleDeny}
                    />
                  )}

                  {/* Result card */}
                  {showResult && status === "completed" && (
                    <AgentResultCard
                      summary="Successfully completed the AI SaaS competitive landscape analysis. Generated a comprehensive report with market sizing, competitor profiles, and strategic recommendations."
                      artifacts={[
                        { name: "AI SaaS Analysis Report.md", type: "report", size: "12.4 KB" },
                        { name: "competitor_data.json", type: "data", size: "8.2 KB" },
                        { name: "market_chart.png", type: "file", size: "145 KB" },
                      ]}
                      tokensUsed={24560}
                      duration={elapsed}
                      stepsCompleted={completedSteps}
                      totalSteps={steps.length}
                      onRunAgain={() => {
                        setStatus("planning");
                        setShowResult(false);
                        // Reset steps
                        setSteps(mockSteps);
                      }}
                    />
                  )}
                </div>

                {/* Input bar for mid-run instructions */}
                <div className="px-3 py-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendInstruction()}
                      placeholder={
                        status === "running"
                          ? "Add instructions for the agent..."
                          : "Agent is not running"
                      }
                      disabled={status !== "running" && status !== "paused"}
                      className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                    />
                    <button
                      onClick={handleSendInstruction}
                      disabled={!inputValue.trim() || (status !== "running" && status !== "paused")}
                      className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Right: Computer Panel */}
            <ResizablePanel defaultSize={55} minSize={30}>
              <ComputerPanel
                visible={true}
                onClose={() => {}}
                codeLines={mockCodeLines}
                steps={mockComputerSteps}
                fileName="analysis-report.md"
                editorLabel="Research Agent"
                computerView={computerView}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          /* Mobile: stacked layout */
          <div className="h-full flex flex-col overflow-y-auto">
            <div className="px-4 py-3 border-b border-border/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Goal</p>
              <p className="text-sm text-foreground">{goal}</p>
            </div>
            <AgentPlanView steps={steps} />
            {showResult && status === "completed" && (
              <AgentResultCard
                summary="Analysis complete. Report generated with market data and competitor profiles."
                tokensUsed={24560}
                duration={elapsed}
                stepsCompleted={completedSteps}
                totalSteps={steps.length}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentRunPage;
