import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

type BroadcastEventType =
  | "conversation-created"
  | "conversation-updated"
  | "conversation-deleted"
  | "message-created"
  | "title-updated";

interface BroadcastPayload {
  type: BroadcastEventType;
  conversationId?: string;
  data?: unknown;
}

const CHANNEL_NAME = "vyroo-sync";

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

/**
 * Hook for cross-tab synchronization via BroadcastChannel API.
 * Listens for events from other tabs and invalidates relevant queries.
 * Falls back gracefully if BroadcastChannel is unsupported (some Electron builds).
 */
export function useBroadcastSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const ch = getChannel();
    if (!ch) return;

    const handler = (event: MessageEvent<BroadcastPayload>) => {
      const { type, conversationId } = event.data;

      switch (type) {
        case "conversation-created":
        case "conversation-deleted":
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          break;

        case "conversation-updated":
        case "title-updated":
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          if (conversationId) {
            queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
          }
          break;

        case "message-created":
          if (conversationId) {
            queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
          }
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          break;
      }
    };

    ch.addEventListener("message", handler);
    return () => ch.removeEventListener("message", handler);
  }, [queryClient]);
}

/**
 * Broadcast an event to all other tabs.
 * Safe to call even if BroadcastChannel is unsupported.
 */
export function broadcastEvent(type: BroadcastEventType, conversationId?: string, data?: unknown) {
  const ch = getChannel();
  if (!ch) return;

  try {
    ch.postMessage({ type, conversationId, data } satisfies BroadcastPayload);
  } catch {
    // Silently fail — channel may be closed
  }
}
