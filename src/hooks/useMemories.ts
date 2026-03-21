import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ─── Types ───

export interface UserMemory {
  id: string;
  key: string;
  value: string;
  category: "preference" | "fact" | "context" | "instruction";
  created_at: string;
  updated_at: string;
}

const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url.length > 0 && url !== "undefined";
};

// ─── List all memories ───

export function useMemories() {
  return useQuery({
    queryKey: ["user-memories"],
    queryFn: async (): Promise<UserMemory[]> => {
      if (!isSupabaseConfigured()) return [];

      const { data, error } = await supabase
        .from("user_memories")
        .select("id, key, value, category, created_at, updated_at")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data || []) as UserMemory[];
    },
  });
}

// ─── Update a memory ───

export function useUpdateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      value,
      category,
    }: {
      id: string;
      value: string;
      category?: string;
    }) => {
      if (!isSupabaseConfigured()) return { success: true };

      const updateData: Record<string, string> = { value };
      if (category) updateData.category = category;

      const { error } = await supabase
        .from("user_memories")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-memories"] });
    },
  });
}

// ─── Delete a memory ───

export function useDeleteMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured()) return { success: true };

      const { error } = await supabase
        .from("user_memories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-memories"] });
    },
  });
}

// ─── Delete all memories ───

export function useClearMemories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!isSupabaseConfigured()) return { success: true };

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_memories")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-memories"] });
    },
  });
}
