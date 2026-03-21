import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url.length > 0 && url !== "undefined";
};

export type WebhookSource = "github" | "shopify" | "slack" | "stripe" | "custom";

export interface WebhookTrigger {
  id: string;
  user_id: string;
  name: string;
  source: WebhookSource;
  event_type: string;
  agent_template_id?: string;
  workflow_id?: string;
  webhook_url: string;
  webhook_secret: string;
  input_mapping: Record<string, string>;
  is_active: boolean;
  last_triggered_at?: string;
  trigger_count: number;
  created_at: string;
}

export interface CreateWebhookInput {
  name: string;
  source: WebhookSource;
  event_type: string;
  agent_template_id?: string;
  workflow_id?: string;
  input_mapping?: Record<string, string>;
}

export interface UpdateWebhookInput {
  id: string;
  name?: string;
  event_type?: string;
  agent_template_id?: string;
  workflow_id?: string;
  input_mapping?: Record<string, string>;
  is_active?: boolean;
}

// ─── Event type suggestions per source ───

export const webhookEventTypes: Record<WebhookSource, string[]> = {
  github: [
    "push",
    "pull_request.opened",
    "pull_request.closed",
    "pull_request.merged",
    "issues.opened",
    "issues.closed",
    "release.published",
    "workflow_run.completed",
  ],
  shopify: [
    "orders/create",
    "orders/updated",
    "orders/fulfilled",
    "products/create",
    "products/update",
    "customers/create",
    "inventory_levels/update",
    "refunds/create",
  ],
  slack: [
    "message",
    "app_mention",
    "reaction_added",
    "channel_created",
    "file_shared",
    "member_joined_channel",
  ],
  stripe: [
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "invoice.paid",
    "invoice.payment_failed",
    "customer.subscription.created",
    "customer.subscription.deleted",
    "checkout.session.completed",
  ],
  custom: ["*"],
};

// ─── Mock data ───

const mockWebhookTriggers: WebhookTrigger[] = [
  {
    id: "wh-github-pr-review",
    user_id: "demo",
    name: "PR Code Review",
    source: "github",
    event_type: "pull_request.opened",
    agent_template_id: "code-review-agent",
    webhook_url: "https://vyroo.ai/api/webhooks/wh-github-pr-review",
    webhook_secret: "whsec_github_abc123",
    input_mapping: {
      "pull_request.title": "title",
      "pull_request.body": "description",
      "pull_request.diff_url": "diff_url",
    },
    is_active: true,
    last_triggered_at: "2026-03-20T14:32:00Z",
    trigger_count: 47,
    created_at: "2026-02-15T10:00:00Z",
  },
  {
    id: "wh-shopify-order-notify",
    user_id: "demo",
    name: "New Order Notification",
    source: "shopify",
    event_type: "orders/create",
    workflow_id: "wf-order-notify",
    webhook_url: "https://vyroo.ai/api/webhooks/wh-shopify-order-notify",
    webhook_secret: "whsec_shopify_xyz789",
    input_mapping: {
      "order.name": "order_number",
      "order.total_price": "amount",
      "order.customer.email": "customer_email",
    },
    is_active: true,
    last_triggered_at: "2026-03-21T08:15:00Z",
    trigger_count: 124,
    created_at: "2026-01-20T09:00:00Z",
  },
];

// Helper to generate a fake webhook URL
function generateWebhookUrl(id: string): string {
  return `https://vyroo.ai/api/webhooks/${id}`;
}

function generateWebhookSecret(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "whsec_";
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ─── List webhook triggers ───

export function useWebhookTriggers() {
  return useQuery({
    queryKey: ["webhook-triggers"],
    queryFn: async (): Promise<WebhookTrigger[]> => {
      if (!isSupabaseConfigured()) {
        return mockWebhookTriggers;
      }

      const { data, error } = await supabase
        .from("webhook_triggers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as WebhookTrigger[]) ?? [];
    },
  });
}

// ─── Create webhook ───

export function useCreateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateWebhookInput): Promise<WebhookTrigger> => {
      if (!isSupabaseConfigured()) {
        const newId = `wh-${Date.now()}`;
        const newTrigger: WebhookTrigger = {
          id: newId,
          user_id: "demo",
          name: input.name,
          source: input.source,
          event_type: input.event_type,
          agent_template_id: input.agent_template_id,
          workflow_id: input.workflow_id,
          webhook_url: generateWebhookUrl(newId),
          webhook_secret: generateWebhookSecret(),
          input_mapping: input.input_mapping ?? {},
          is_active: true,
          trigger_count: 0,
          created_at: new Date().toISOString(),
        };
        return newTrigger;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const id = crypto.randomUUID();

      const { data, error } = await supabase
        .from("webhook_triggers")
        .insert({
          id,
          user_id: user.id,
          name: input.name,
          source: input.source,
          event_type: input.event_type,
          agent_template_id: input.agent_template_id || null,
          workflow_id: input.workflow_id || null,
          webhook_url: generateWebhookUrl(id),
          webhook_secret: generateWebhookSecret(),
          input_mapping: input.input_mapping ?? {},
        })
        .select()
        .single();

      if (error) throw error;
      return data as WebhookTrigger;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhook-triggers"] });
    },
  });
}

// ─── Update webhook ───

export function useUpdateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateWebhookInput): Promise<void> => {
      if (!isSupabaseConfigured()) {
        return;
      }

      const { id, ...updates } = input;
      const { error } = await supabase
        .from("webhook_triggers")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["webhook-triggers"] });
      const previous = queryClient.getQueryData<WebhookTrigger[]>(["webhook-triggers"]);

      queryClient.setQueryData<WebhookTrigger[]>(["webhook-triggers"], (old) =>
        (old ?? []).map((w) =>
          w.id === input.id ? { ...w, ...input } : w,
        ),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["webhook-triggers"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["webhook-triggers"] });
    },
  });
}

// ─── Delete webhook ───

export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!isSupabaseConfigured()) {
        return;
      }

      const { error } = await supabase
        .from("webhook_triggers")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["webhook-triggers"] });
      const previous = queryClient.getQueryData<WebhookTrigger[]>(["webhook-triggers"]);

      queryClient.setQueryData<WebhookTrigger[]>(["webhook-triggers"], (old) =>
        (old ?? []).filter((w) => w.id !== id),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["webhook-triggers"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["webhook-triggers"] });
    },
  });
}
