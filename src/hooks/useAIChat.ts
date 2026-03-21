import { useState, useCallback, useRef } from "react";
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

export function useAIChat({ conversationId }: UseAIChatOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();
  const { provider, model } = useModelSettings();

  const send = useCallback(
    async (message: string) => {
      setIsStreaming(true);
      setStreamingContent("");
      setError(null);
      setFollowUps([]); // Clear previous follow-ups

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
  };
}
