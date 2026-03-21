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

export function useAIChat({ conversationId }: UseAIChatOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [steps, setSteps] = useState<StreamingStep[]>([]);
  const [report, setReport] = useState<StreamingReport | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();
  const { provider, model } = useModelSettings();

  const send = useCallback(
    async (message: string) => {
      setIsStreaming(true);
      setStreamingContent("");
      setError(null);
      setFollowUps([]); // Clear previous follow-ups
      setSteps([]);
      setReport(null);

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
              updated[existing] = {
                ...updated[existing],
                ...step,
                logs: [...(updated[existing].logs || []), ...(step.logs || [])],
              };
              return updated;
            }
            return [...prev, step];
          });
        },
        onReport: (reportData) => {
          setReport(reportData);
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
  };
}
