import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toStep } from "@/types/domain";
import type { Conversation, ChatMessage, Step } from "@/types/domain";
import { conversations as mockConversations, getConversation as getMockConversation } from "@/data/conversations";

// Check if Supabase is configured — evaluate once at module load
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const IS_SUPABASE_CONFIGURED = !!(SUPABASE_URL && SUPABASE_URL.length > 0 && SUPABASE_URL !== "undefined");
const isSupabaseConfigured = () => IS_SUPABASE_CONFIGURED;

// ─── List all conversations for sidebar ───

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        // Fallback to mock data
        return mockConversations.map((c) => ({
          id: c.id,
          title: c.title,
          icon: c.icon,
          type: c.type,
          is_complete: c.isComplete ?? false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
      }

      const { data, error } = await supabase
        .from("conversations")
        .select("id, title, icon, type, is_complete, created_at, updated_at")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

// ─── Get a single conversation with messages and steps ───

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: ["conversation", id],
    enabled: !!id,
    queryFn: async (): Promise<Conversation> => {
      if (!isSupabaseConfigured()) {
        return getMockConversation(id!);
      }

      // Fetch conversation, messages, and steps in parallel
      const [convResult, msgsResult, stepsResult] = await Promise.all([
        supabase
          .from("conversations")
          .select("*")
          .eq("id", id!)
          .single(),
        supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", id!)
          .order("created_at", { ascending: true }),
        supabase
          .from("steps")
          .select("*")
          .eq("conversation_id", id!)
          .order("step_number", { ascending: true }),
      ]);

      if (convResult.error) throw convResult.error;

      const conv = convResult.data;
      const messages: ChatMessage[] = (msgsResult.data ?? []).map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        hasReport: m.has_report,
        reportTitle: m.report_title ?? undefined,
        reportSummary: m.report_summary ?? undefined,
        tableData: m.table_data ?? undefined,
        created_at: m.created_at,
      }));

      const steps: Step[] = (stepsResult.data ?? []).map((s) =>
        toStep({
          id: s.step_number,
          label: s.label,
          detail: s.detail ?? "",
          status: s.status as "complete" | "active" | "pending",
          icon_name: s.icon_name,
          logs: (s.logs as any[]) ?? [],
          subTasks: (s.sub_tasks as any[]) ?? [],
        })
      );

      return {
        id: conv.id,
        title: conv.title,
        icon: conv.icon,
        type: conv.type as "intelligence" | "website" | "research",
        steps,
        messages,
        followUps: [], // Generated client-side based on AI response
        codeLines: [], // Derived from AI response metadata
        fileName: "",
        editorLabel: "Editor",
        fileTree: undefined,
        isComplete: conv.is_complete,
        project: undefined,
        computerView: undefined,
        researchTasks: undefined,
      };
    },
  });
}

// ─── Create a new conversation ───

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      type = "intelligence",
      icon = "💬",
    }: {
      title: string;
      type?: "intelligence" | "website" | "research";
      icon?: string;
    }) => {
      if (!isSupabaseConfigured()) {
        // Return a mock new conversation
        const newId = String(Date.now());
        return { id: newId, title, icon, type };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title, type, icon })
        .select("id, title, icon, type")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// ─── Send a message ───

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      role = "user",
    }: {
      conversationId: string;
      content: string;
      role?: "user" | "assistant";
    }) => {
      if (!isSupabaseConfigured()) {
        return {
          id: String(Date.now()),
          conversation_id: conversationId,
          role,
          content,
          created_at: new Date().toISOString(),
        };
      }

      const { data, error } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, role, content })
        .select()
        .single();

      if (error) throw error;

      // Update conversation's updated_at
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversation", variables.conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// ─── Delete a conversation ───

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!isSupabaseConfigured()) return;

      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
