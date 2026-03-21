import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string;
  plan: "free" | "pro" | "enterprise";
  credits: number;
}

const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url.length > 0 && url !== "undefined";
};

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile> => {
      if (!isSupabaseConfigured()) {
        // Fallback mock profile
        return {
          id: "mock-user",
          display_name: "Ru",
          avatar_url: null,
          email: "roelmangal84@gmail.com",
          plan: "free",
          credits: 993,
        };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        display_name: data.display_name,
        avatar_url: data.avatar_url,
        email: user.email ?? "",
        plan: data.plan as "free" | "pro" | "enterprise",
        credits: data.credits,
      };
    },
  });
}
