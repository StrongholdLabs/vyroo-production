import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ScheduledAgent } from "@/types/workflows";

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url.length > 0 && url !== "undefined";
};

// ─── Mock data ───

const mockSchedules: ScheduledAgent[] = [
  {
    id: "sched-weekly-research",
    user_id: "demo",
    agent_template_id: "research-agent",
    name: "Weekly Market Research",
    cron_expression: "0 9 * * 1",
    input_config: { topic: "AI industry trends", depth: "comprehensive" },
    is_active: true,
    last_run_at: "2026-03-17T09:00:00Z",
    next_run_at: "2026-03-24T09:00:00Z",
    run_count: 8,
    created_at: "2026-02-01T10:00:00Z",
  },
  {
    id: "sched-daily-report",
    user_id: "demo",
    workflow_id: "wf-research-report",
    name: "Daily Summary Report",
    cron_expression: "0 18 * * 1-5",
    input_config: { format: "executive_summary" },
    is_active: true,
    last_run_at: "2026-03-20T18:00:00Z",
    next_run_at: "2026-03-21T18:00:00Z",
    run_count: 34,
    created_at: "2026-02-10T08:00:00Z",
  },
];

// ─── List all schedules ───

export function useScheduledAgents() {
  return useQuery({
    queryKey: ["scheduled-agents"],
    queryFn: async (): Promise<ScheduledAgent[]> => {
      if (!isSupabaseConfigured()) {
        return mockSchedules;
      }

      const { data, error } = await supabase
        .from("scheduled_agents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        agent_template_id: row.agent_template_id ?? undefined,
        workflow_id: row.workflow_id ?? undefined,
        name: row.name,
        cron_expression: row.cron_expression,
        input_config: (row.input_config as Record<string, unknown>) ?? {},
        is_active: row.is_active,
        last_run_at: row.last_run_at ?? undefined,
        next_run_at: row.next_run_at ?? undefined,
        run_count: row.run_count ?? 0,
        created_at: row.created_at,
      }));
    },
  });
}

// ─── Create a schedule ───

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schedule: {
      name: string;
      agent_template_id?: string;
      workflow_id?: string;
      cron_expression: string;
      input_config?: Record<string, unknown>;
    }) => {
      if (!isSupabaseConfigured()) {
        return { id: `sched-${Date.now()}`, ...schedule };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("scheduled_agents")
        .insert({
          user_id: user.id,
          name: schedule.name,
          agent_template_id: schedule.agent_template_id ?? null,
          workflow_id: schedule.workflow_id ?? null,
          cron_expression: schedule.cron_expression,
          input_config: (schedule.input_config ?? {}) as unknown as Record<string, unknown>,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-agents"] });
    },
  });
}

// ─── Update a schedule ───

export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      is_active?: boolean;
      cron_expression?: string;
      name?: string;
      input_config?: Record<string, unknown>;
    }) => {
      if (!isSupabaseConfigured()) return;

      const { error } = await supabase
        .from("scheduled_agents")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-agents"] });
    },
  });
}

// ─── Delete a schedule ───

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured()) return;

      const { error } = await supabase
        .from("scheduled_agents")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-agents"] });
    },
  });
}

// ─── Cron helpers ───

/** Convert a cron expression to a human-readable description */
export function cronToHuman(cron: string): string {
  const parts = cron.split(" ");
  if (parts.length !== 5) return cron;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Common patterns
  if (dayOfMonth === "*" && month === "*") {
    const timeStr = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;

    if (dayOfWeek === "*") {
      return `Daily at ${timeStr}`;
    }
    if (dayOfWeek === "1-5") {
      return `Weekdays at ${timeStr}`;
    }
    if (dayOfWeek === "0" || dayOfWeek === "7") {
      return `Sundays at ${timeStr}`;
    }

    const dayNames: Record<string, string> = {
      "0": "Sunday", "1": "Monday", "2": "Tuesday", "3": "Wednesday",
      "4": "Thursday", "5": "Friday", "6": "Saturday", "7": "Sunday",
    };

    if (dayNames[dayOfWeek]) {
      return `Every ${dayNames[dayOfWeek]} at ${timeStr}`;
    }
  }

  if (dayOfWeek === "*" && month === "*" && dayOfMonth !== "*") {
    const timeStr = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
    if (dayOfMonth === "1") {
      return `Monthly on the 1st at ${timeStr}`;
    }
    return `Monthly on day ${dayOfMonth} at ${timeStr}`;
  }

  return cron;
}

/** Cron presets for the schedule form */
export const cronPresets = [
  { label: "Every day at 9am", value: "0 9 * * *" },
  { label: "Weekdays at 9am", value: "0 9 * * 1-5" },
  { label: "Every Monday at 9am", value: "0 9 * * 1" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Monthly on the 1st", value: "0 9 1 * *" },
  { label: "Weekdays at 6pm", value: "0 18 * * 1-5" },
] as const;
