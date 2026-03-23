import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Workflow, WorkflowNode, WorkflowEdge } from "@/types/workflows";

// ─── Types ───

export interface WorkflowPresenceUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  color: string;
  cursor?: { nodeId: string } | null;
  last_seen: string;
}

interface WorkflowBroadcastPayload {
  type: "workflow_update";
  sender_id: string;
  timestamp: string;
  name?: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
}

// Deterministic colors for collaborator indicators
const PRESENCE_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

function pickColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  return PRESENCE_COLORS[Math.abs(hash) % PRESENCE_COLORS.length];
}

// ─── useRealtimeWorkflow ───

export function useRealtimeWorkflow(
  workflowId: string | undefined,
  onRemoteUpdate?: (update: {
    name?: string;
    nodes?: WorkflowNode[];
    edges?: WorkflowEdge[];
  }) => void,
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const userIdRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize channel
  useEffect(() => {
    if (!workflowId) return;

    let cancelled = false;

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      userIdRef.current = user.id;

      const channel = supabase.channel(`workflow:${workflowId}`, {
        config: { broadcast: { self: false } },
      });

      // Listen for remote workflow updates
      channel.on("broadcast", { event: "workflow_change" }, (payload) => {
        const data = payload.payload as WorkflowBroadcastPayload;
        if (data.sender_id === user.id) return;

        onRemoteUpdate?.({
          name: data.name,
          nodes: data.nodes,
          edges: data.edges,
        });
      });

      channel.subscribe();
      channelRef.current = channel;
    };

    setup();

    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [workflowId, onRemoteUpdate]);

  // Broadcast local changes (debounced)
  const broadcastUpdate = useCallback(
    (update: { name?: string; nodes?: WorkflowNode[]; edges?: WorkflowEdge[] }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        if (!channelRef.current || !userIdRef.current) return;

        const payload: WorkflowBroadcastPayload = {
          type: "workflow_update",
          sender_id: userIdRef.current,
          timestamp: new Date().toISOString(),
          ...update,
        };

        channelRef.current.send({
          type: "broadcast",
          event: "workflow_change",
          payload,
        });
      }, 300);
    },
    [],
  );

  return { broadcastUpdate };
}

// ─── useWorkflowPresence ───

export function useWorkflowPresence(workflowId: string | undefined) {
  const [users, setUsers] = useState<WorkflowPresenceUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!workflowId) return;

    let cancelled = false;

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      const channel = supabase.channel(`presence:workflow:${workflowId}`);

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          const presentUsers: WorkflowPresenceUser[] = [];

          for (const key of Object.keys(state)) {
            const presences = state[key] as Array<{
              user_id: string;
              email: string;
              name: string;
              avatar_url?: string;
              cursor?: { nodeId: string } | null;
            }>;
            for (const p of presences) {
              // Don't include self
              if (p.user_id === user.id) continue;
              presentUsers.push({
                id: p.user_id,
                email: p.email,
                name: p.name,
                avatar_url: p.avatar_url,
                color: pickColor(p.user_id),
                cursor: p.cursor,
                last_seen: new Date().toISOString(),
              });
            }
          }

          setUsers(presentUsers);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.track({
              user_id: user.id,
              email: user.email ?? "",
              name: user.user_metadata?.full_name ?? user.email ?? "Anonymous",
              avatar_url: user.user_metadata?.avatar_url,
              cursor: null,
            });
          }
        });

      channelRef.current = channel;
    };

    setup();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [workflowId]);

  return { users };
}
