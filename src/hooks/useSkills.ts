import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  category: "core" | "analysis" | "integration";
  is_premium: boolean;
  required_plan: string;
  tools: string[];
  sort_order: number;
}

/** Fetch all available skills from the skills table */
export function useAvailableSkills() {
  return useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Skill[];
    },
  });
}

/** Fetch user's enabled skills from their profile */
export function useUserSkills() {
  return useQuery({
    queryKey: ["user-skills"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("enabled_skills")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return (data?.enabled_skills ?? []) as string[];
    },
  });
}

/** Toggle a skill on/off */
export function useToggleSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      skillId,
      enabled,
    }: {
      skillId: string;
      enabled: boolean;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("enabled_skills")
        .eq("id", user.id)
        .single();

      const current = (profile?.enabled_skills ?? []) as string[];
      const updated = enabled
        ? [...new Set([...current, skillId])]
        : current.filter((s: string) => s !== skillId);

      const { error } = await supabase
        .from("profiles")
        .update({ enabled_skills: updated })
        .eq("id", user.id);

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-skills"] });
    },
  });
}
