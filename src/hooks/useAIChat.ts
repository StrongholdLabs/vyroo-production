import { useState, useCallback, useRef } from "react";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { streamChat, respondToApproval } from "@/lib/ai-stream";
import { useModelSettings } from "@/hooks/useModelSettings";
import { broadcastEvent } from "@/hooks/useBroadcastSync";
import { detectCategory } from "@/lib/follow-up-icons";

interface UseAIChatOptions {
  conversationId: string;
}

export interface FollowUp {
  text: string;
  category: string;
}

export interface StreamingStep {
  id: number;
  label: string;
  detail: string;
  status: "active" | "complete" | "pending";
  icon: React.ReactNode;
  logs: Array<{ time: string; text: string; type: "info" | "action" | "result" }>;
  subTasks?: Array<{ text: string; type?: "edit" | "image" | "terminal" }>;
}

export interface StreamingReport {
  title: string;
  summary: string;
  headers: string[];
  rows: string[][];
  content?: string;
  format?: string;
  word_count?: number;
}

export interface ToolCall {
  name: string;
  args: Record<string, any>;
  result?: any;
  duration?: number;
  status: "executing" | "complete";
}

export interface SlideItem {
  title: string;
  subtitle?: string;
  content?: string[];
  bgColor?: string;
  accentColor?: string;
  badge?: string;
  speakerNotes?: string;
}

export interface SlidesData {
  title: string;
  slides: SlideItem[];
  slideCount: number;
}

export interface SearchData {
  query: string;
  results: Array<{ title: string; url: string; snippet?: string; domain?: string; favicon?: string }>;
  elapsed?: string;
}

export interface BrowseData {
  url: string;
  title: string;
  content: string;
  domain?: string;
  favicon?: string;
  sections?: Array<{ type: string; content: string; items?: string[]; tableHeaders?: string[]; tableRows?: string[][] }>;
  elapsed?: string;
  durationMs?: number;
}

export interface ApprovalRequest {
  step_number: number;
  tool_name: string;
  tool_description?: string;
  args: Record<string, any>;
  approval_id: string;
}

export function useAIChat({ conversationId }: UseAIChatOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [steps, setSteps] = useState<StreamingStep[]>([]);
  const [report, setReport] = useState<StreamingReport | null>(null);
  const [lastReport, setLastReport] = useState<StreamingReport | null>(null);
  const [taskMode, setTaskMode] = useState<"direct" | "agentic" | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [slidesData, setSlidesData] = useState<SlidesData | null>(null);
  const [lastSlidesData, setLastSlidesData] = useState<SlidesData | null>(null);
  const [searchResults, setSearchResults] = useState<SearchData[]>([]);
  const [browseData, setBrowseData] = useState<BrowseData[]>([]);
  const [isUsingTools, setIsUsingTools] = useState(false);
  const [sources, setSources] = useState<Array<{ title: string; url: string; favicon: string; domain: string }>>([]);
  const [pendingApproval, setPendingApproval] = useState<ApprovalRequest | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();
  const { provider, model } = useModelSettings();

  // Reset all streaming state when conversation changes
  // This prevents stale UI from showing when switching conversations
  React.useEffect(() => {
    // Abort any in-flight request
    abortRef.current?.abort();
    // Reset all state
    setIsStreaming(false);
    setStreamingContent("");
    setError(null);
    setFollowUps([]);
    setSteps([]);
    setReport(null);
    setTaskMode(null);
    setToolCalls([]);
    setSlidesData(null);
    setSearchResults([]);
    setBrowseData([]);
    setIsUsingTools(false);
    setSources([]);
    setPendingApproval(null);
    // Don't reset lastReport/lastSlidesData — they persist across follow-ups
  }, [conversationId]);

  const send = useCallback(
    async (message: string) => {
      try {
      setIsStreaming(true);
      setStreamingContent("");
      setError(null);
      setFollowUps([]);
      setSteps([]);
      setReport(null);
      setSlidesData(null);
      setTaskMode(null);
      setToolCalls([]);
      setSearchResults([]);
      setBrowseData([]);
      setIsUsingTools(false);
      setSources([]);
      setPendingApproval(null);

      // Optimistically add user message to the conversation cache
      // so it appears immediately (before the edge function response)
      queryClient.setQueryData(["conversation", conversationId], (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), {
            id: `optimistic-${Date.now()}`,
            role: "user",
            content: message,
            created_at: new Date().toISOString(),
          }],
        };
      });

      const controller = new AbortController();
      abortRef.current = controller;

      await streamChat({
        conversationId,
        message,
        provider,
        model,
        signal: controller.signal,
        onToken: (token) => {
          setStreamingContent((prev) => prev + token);
        },
        onTitle: (title) => {
          // Auto-title received — invalidate conversations list
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          broadcastEvent("title-updated", conversationId);
        },
        onFollowUps: (newFollowUps) => {
          // Convert string[] from backend to {text, category}[] for FollowUpPanel
          const typed = (newFollowUps || []).map((f: any) =>
            typeof f === 'string' ? { text: f, category: detectCategory(f) } : f
          );
          setFollowUps(typed);
        },
        onStep: (stepData) => {
          setSteps(prev => {
            const existing = prev.findIndex(s => s.id === stepData.id);
            const step: StreamingStep = {
              ...stepData,
              icon: null,
              logs: stepData.logs || [],
            };
            if (existing >= 0) {
              const updated = [...prev];
              // Replace step entirely — don't merge logs (causes duplication)
              updated[existing] = step;
              return updated;
            }
            return [...prev, step];
          });
        },
        onReport: (reportData) => {
          setReport(reportData);
          setLastReport(reportData); // Persist across follow-ups
        },
        onMode: (mode) => {
          setTaskMode(mode);
        },
        onTool: (tool) => {
          setIsUsingTools(true);
          setToolCalls(prev => {
            if (tool.status === "complete") {
              // Find the LAST executing tool with the same name (handles multiple calls)
              const lastExecutingIdx = prev.reduce((lastIdx, t, i) =>
                t.name === tool.name && t.status === "executing" ? i : lastIdx, -1);
              if (lastExecutingIdx >= 0) {
                const updated = [...prev];
                updated[lastExecutingIdx] = tool;
                return updated;
              }
            }
            // New tool or no match — add it
            return [...prev, tool];
          });
        },
        onSearch: (data) => {
          setSearchResults(prev => [...prev, data]);
        },
        onBrowse: (data) => {
          setBrowseData(prev => [...prev, data]);
        },
        onSources: (data) => {
          setSources(data.sources || []);
        },
        onSlides: (data) => {
          // slides received
          setSlidesData(data);
          setLastSlidesData(data); // Persist across follow-ups
        },
        onApprovalRequired: (data) => {
          setPendingApproval(data);
        },
        onError: (err) => {
          setError(err);
          setIsStreaming(false);
        },
        onDone: async () => {
          // Mark all steps as complete (fixes stuck spinners)
          setSteps(prev => prev.map(s => ({ ...s, status: "complete" as const })));
          setIsStreaming(false);
          // Refetch conversation BEFORE clearing streaming content
          // so the DB messages are loaded and visible before we remove the stream
          await queryClient.invalidateQueries({
            queryKey: ["conversation", conversationId],
          });
          await queryClient.invalidateQueries({ queryKey: ["conversations"] });
          // Delay clearing streaming content so follow-ups panel has time to render
          setTimeout(() => setStreamingContent(""), 150);
          // Broadcast to other tabs
          broadcastEvent("message-created", conversationId);
        },
      });
      } catch (err) {
        setError(String(err));
        setIsStreaming(false);
      }
    },
    [conversationId, provider, model, queryClient]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setStreamingContent("");
  }, []);

  const handleApproval = useCallback(
    async (approved: boolean, alwaysApprove = false) => {
      if (!pendingApproval) return;
      setPendingApproval(null);
      await respondToApproval({
        conversationId,
        approvalId: pendingApproval.approval_id,
        approved,
        alwaysApprove,
      });
    },
    [conversationId, pendingApproval]
  );

  return {
    send,
    abort,
    handleApproval,
    isStreaming,
    streamingContent,
    error,
    followUps,
    steps,
    report,
    lastReport,
    slidesData,
    lastSlidesData,
    taskMode,
    toolCalls,
    searchResults,
    browseData,
    isUsingTools,
    sources,
    pendingApproval,
  };
}
