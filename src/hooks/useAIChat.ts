import { useState, useCallback, useRef } from "react";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { streamChat } from "@/lib/ai-stream";
import { useModelSettings } from "@/hooks/useModelSettings";
import { broadcastEvent } from "@/hooks/useBroadcastSync";

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
}

export interface ToolCall {
  name: string;
  args: Record<string, any>;
  result?: any;
  duration?: number;
  status: "executing" | "complete";
}

export interface SearchData {
  query: string;
  results: Array<{ title: string; url: string; snippet?: string }>;
}

export interface BrowseData {
  url: string;
  title: string;
  content: string;
}

export function useAIChat({ conversationId }: UseAIChatOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [steps, setSteps] = useState<StreamingStep[]>([]);
  const [report, setReport] = useState<StreamingReport | null>(null);
  const [taskMode, setTaskMode] = useState<"direct" | "agentic" | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [searchResults, setSearchResults] = useState<SearchData[]>([]);
  const [browseData, setBrowseData] = useState<BrowseData[]>([]);
  const [isUsingTools, setIsUsingTools] = useState(false);
  const [sources, setSources] = useState<Array<{ title: string; url: string; favicon: string; domain: string }>>([]);
  const abortRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();
  const { provider, model } = useModelSettings();

  const send = useCallback(
    async (message: string) => {
      console.log("[useAIChat] send called:", message, "convId:", conversationId);
      try {
      setIsStreaming(true);
      setStreamingContent("");
      setError(null);
      setFollowUps([]);
      setSteps([]);
      setReport(null);
      setTaskMode(null);
      setToolCalls([]);
      setSearchResults([]);
      setBrowseData([]);
      setIsUsingTools(false);
      setSources([]);

      const controller = new AbortController();
      abortRef.current = controller;

      console.log("[useAIChat] calling streamChat...");
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
          setFollowUps(newFollowUps);
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
        },
        onMode: (mode) => {
          setTaskMode(mode);
        },
        onTool: (tool) => {
          setIsUsingTools(true);
          setToolCalls(prev => {
            const existing = prev.findIndex(t => t.name === tool.name && t.status === "executing");
            if (existing >= 0 && tool.status === "complete") {
              const updated = [...prev];
              updated[existing] = tool;
              return updated;
            }
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
        onError: (err) => {
          setError(err);
          setIsStreaming(false);
        },
        onDone: () => {
          setIsStreaming(false);
          setStreamingContent("");
          // Invalidate to refetch conversation with the new messages
          queryClient.invalidateQueries({
            queryKey: ["conversation", conversationId],
          });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          // Broadcast to other tabs
          broadcastEvent("message-created", conversationId);
        },
      });
      console.log("[useAIChat] streamChat finished");
      } catch (err) {
        console.error("[useAIChat] CAUGHT ERROR:", err);
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

  return {
    send,
    abort,
    isStreaming,
    streamingContent,
    error,
    followUps,
    steps,
    report,
    taskMode,
    toolCalls,
    searchResults,
    browseData,
    isUsingTools,
    sources,
  };
}
