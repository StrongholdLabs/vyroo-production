import { supabase } from "@/lib/supabase";
import type { AgentStepPlan, AgentRunConfig } from "@/types/agents";

export interface AgentStreamOptions {
  supabaseUrl: string;
  supabaseKey: string;
  accessToken: string;
  agentTemplateId: string;
  goal: string;
  config?: AgentRunConfig;
  conversationId?: string;
  onPlan: (steps: AgentStepPlan[]) => void;
  onStepStart: (step: {
    step_number: number;
    label: string;
    type: string;
  }) => void;
  onStepUpdate: (step: { step_number: number; detail: string }) => void;
  onStepDone: (step: {
    step_number: number;
    output: unknown;
    duration_ms: number;
  }) => void;
  onApproval: (step: {
    step_number: number;
    tool_name: string;
    args: unknown;
  }) => void;
  onDone: (result: { result: unknown; tokens_used: number }) => void;
  onError: (error: { message: string; step_number?: number }) => void;
}

/**
 * Starts an SSE stream for agent execution.
 *
 * SSE event types:
 * - plan: Agent has created its execution plan
 * - step_start: A step is beginning execution
 * - step_update: Progress detail for a running step
 * - step_done: A step has completed with output
 * - approval: Agent is requesting user approval for a tool call
 * - agent_done: The entire agent run has completed
 * - agent_error: An error occurred during execution
 *
 * Returns an object with an `abort` function to cancel the stream.
 */
export function startAgentStream(
  options: AgentStreamOptions
): { abort: () => void } {
  const {
    supabaseUrl,
    accessToken,
    agentTemplateId,
    goal,
    config,
    conversationId,
    onPlan,
    onStepStart,
    onStepUpdate,
    onStepDone,
    onApproval,
    onDone,
    onError,
  } = options;

  const controller = new AbortController();
  const url = `${supabaseUrl}/functions/v1/agent-run`;

  (async () => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          agentTemplateId,
          goal,
          config,
          conversationId,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response
          .json()
          .catch(() => ({ error: "Agent stream request failed" }));
        onError({ message: err.error || `HTTP ${response.status}` });
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7);
          } else if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              switch (eventType) {
                case "plan":
                  onPlan(parsed.steps);
                  break;
                case "step_start":
                  onStepStart({
                    step_number: parsed.step_number,
                    label: parsed.label,
                    type: parsed.type,
                  });
                  break;
                case "step_update":
                  onStepUpdate({
                    step_number: parsed.step_number,
                    detail: parsed.detail,
                  });
                  break;
                case "step_done":
                  onStepDone({
                    step_number: parsed.step_number,
                    output: parsed.output,
                    duration_ms: parsed.duration_ms,
                  });
                  break;
                case "approval":
                  onApproval({
                    step_number: parsed.step_number,
                    tool_name: parsed.tool_name,
                    args: parsed.args,
                  });
                  break;
                case "agent_done":
                  onDone({
                    result: parsed.result,
                    tokens_used: parsed.tokens_used,
                  });
                  return;
                case "agent_error":
                  onError({
                    message: parsed.message || "Unknown agent error",
                    step_number: parsed.step_number,
                  });
                  return;
              }
            } catch {
              // Skip malformed data
            }
          }
        }
      }

      // Stream ended without explicit done event
      onDone({ result: null, tokens_used: 0 });
    } catch (error) {
      if (controller.signal.aborted) return;
      onError({ message: String(error) });
    }
  })();

  return {
    abort: () => controller.abort(),
  };
}

/**
 * Convenience wrapper that automatically retrieves the current session
 * and Supabase URL before starting the agent stream.
 */
export async function startAgentStreamWithAuth(
  options: Omit<AgentStreamOptions, "supabaseUrl" | "supabaseKey" | "accessToken">
): Promise<{ abort: () => void }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    options.onError({ message: "Not authenticated" });
    return { abort: () => {} };
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return startAgentStream({
    ...options,
    supabaseUrl,
    supabaseKey,
    accessToken: session.access_token,
  });
}
