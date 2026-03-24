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
  const generationRef = useRef(0); // Track which "generation" of send() is active
  const queryClient = useQueryClient();
  const { provider, model } = useModelSettings();

  // Reset all streaming state when conversation changes
  // CRITICAL: Abort FIRST to prevent stale callbacks from firing into new conversation state
  React.useEffect(() => {
    // 1. Abort any in-flight request FIRST
    abortRef.current?.abort();
    abortRef.current = null;
    // 2. Increment generation so any stale callbacks are discarded
    generationRef.current += 1;
    // 3. THEN reset all state
    setIsStreaming(false);
    setStreamingContent("");
    setError(null);
    setFollowUps([]);
    setSteps([]);
    setReport(null);
    setLastReport(null);
    setTaskMode(null);
    setToolCalls([]);
    setSlidesData(null);
    setLastSlidesData(null);
    setSearchResults([]);
    setBrowseData([]);
    setIsUsingTools(false);
    setSources([]);
    setPendingApproval(null);
  }, [conversationId]);

  const send = useCallback(
    async (message: string) => {
      // Capture current generation — if it changes mid-stream, discard callbacks
      const currentGen = ++generationRef.current;
      const isStale = () => generationRef.current !== currentGen;

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
      const optimisticId = `optimistic-${Date.now()}`;
      queryClient.setQueryData(["conversation", conversationId], (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), {
            id: optimisticId,
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
          if (isStale()) return;
          setStreamingContent((prev) => prev + token);
        },
        onTitle: (title) => {
          if (isStale()) return;
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          broadcastEvent("title-updated", conversationId);
        },
        onFollowUps: (newFollowUps) => {
          if (isStale()) return;
          try {
            const typed = (newFollowUps || []).map((f: any) =>
              typeof f === 'string' ? { text: f, category: detectCategory(f) } : f
            );
            setFollowUps(typed);
          } catch { /* detectCategory failure is non-critical */ }
        },
        onStep: (stepData) => {
          if (isStale()) return;
          setSteps(prev => {
            const existing = prev.findIndex(s => s.id === stepData.id);
            const step: StreamingStep = {
              ...stepData,
              icon: null,
              logs: (stepData.logs || []).slice(-20), // Cap logs at 20 per step (H3)
            };
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = step;
              return updated;
            }
            return [...prev, step];
          });
        },
        onReport: (reportData) => {
          if (isStale()) return;
          setReport(reportData);
          setLastReport(reportData);
        },
        onMode: (mode) => {
          if (isStale()) return;
          setTaskMode(mode);
        },
        onTool: (tool) => {
          if (isStale()) return;
          setIsUsingTools(true);
          setToolCalls(prev => {
            if (tool.status === "complete") {
              const lastExecutingIdx = prev.reduce((lastIdx, t, i) =>
                t.name === tool.name && t.status === "executing" ? i : lastIdx, -1);
              if (lastExecutingIdx >= 0) {
                const updated = [...prev];
                updated[lastExecutingIdx] = tool;
                return updated;
              }
            }
            return [...prev, tool];
          });
        },
        onSearch: (data) => {
          if (isStale()) return;
          setSearchResults(prev => prev.length >= 50 ? prev : [...prev, data]); // Cap at 50 (FA6)
        },
        onBrowse: (data) => {
          if (isStale()) return;
          setBrowseData(prev => prev.length >= 50 ? prev : [...prev, data]); // Cap at 50 (FA6)
        },
        onSources: (data) => {
          if (isStale()) return;
          setSources(data.sources || []);
        },
        onSlides: (data) => {
          if (isStale()) return;
          setSlidesData(data);
          setLastSlidesData(data);
        },
        onApprovalRequired: (data) => {
          if (isStale()) return;
          setPendingApproval(data);
        },
        onError: (err) => {
          if (isStale()) return;
          setError(err);
          setIsStreaming(false);
          // FA2: Rollback optimistic message on error
          queryClient.setQueryData(["conversation", conversationId], (prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: (prev.messages || []).filter((m: any) => m.id !== optimisticId),
            };
          });
        },
        onDone: async () => {
          if (isStale()) return;
          // Mark all steps as complete (fixes stuck spinners)
          setSteps(prev => prev.map(s => ({ ...s, status: "complete" as const })));
          setIsStreaming(false);
          // Remove optimistic message before refetch to prevent brief duplicate (#5)
          queryClient.setQueryData(["conversation", conversationId], (prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: (prev.messages || []).filter((m: any) => !String(m.id).startsWith("optimistic-")),
            };
          });
          // Refetch conversation so DB messages replace optimistic ones
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
