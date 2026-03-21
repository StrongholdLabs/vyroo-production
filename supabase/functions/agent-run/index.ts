// Supabase Edge Function: Agent Run Orchestrator
// Executes an agent plan via streaming SSE, following the same patterns as the chat function.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveProvider, getFallbackChain } from "../_shared/provider-registry.ts";
import { streamAnthropic } from "../_shared/providers/anthropic.ts";
import { streamOpenAI } from "../_shared/providers/openai.ts";
import { streamGemini } from "../_shared/providers/gemini.ts";
import { streamTogether } from "../_shared/providers/together.ts";
import { getToolDefinitions, executeTool } from "../_shared/agent-tools.ts";
import {
  getPlanningPrompt,
  getStepExecutionPrompt,
  getSummaryPrompt,
} from "../_shared/agent-prompts.ts";
import {
  getConversationContext,
  buildMemoryPrompt,
} from "../_shared/agent-memory.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Map provider IDs to their stream functions
const STREAM_FUNCTIONS: Record<
  string,
  (
    apiKey: string,
    messages: { role: string; content: string }[],
    model: string,
    systemPrompt?: string
  ) => ReadableStream
> = {
  anthropic: streamAnthropic,
  openai: streamOpenAI,
  gemini: streamGemini,
  together: streamTogether,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect the full text from a provider SSE stream. */
async function collectStreamText(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.token) full += parsed.token;
        } catch {
          // skip
        }
      }
    }
  }
  return full;
}

/** Try to parse a JSON array out of potentially markdown-fenced AI output. */
function parseJsonArray(text: string): unknown[] {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }
  return JSON.parse(cleaned);
}

/** Resolve an API key for the given model, falling back through the chain. */
async function resolveApiKey(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  model: string
): Promise<{ apiKey: string; actualProviderId: string } | null> {
  const { providerId, dbProvider } = resolveProvider(model);

  const { data: keyData } = await supabase
    .from("user_api_keys")
    .select("encrypted_key")
    .eq("user_id", userId)
    .eq("provider", dbProvider)
    .single();

  if (keyData) {
    return { apiKey: keyData.encrypted_key, actualProviderId: providerId };
  }

  const fallbacks = getFallbackChain(providerId);
  for (const fallbackDbProvider of fallbacks) {
    const { data: fallbackKey } = await supabase
      .from("user_api_keys")
      .select("encrypted_key")
      .eq("user_id", userId)
      .eq("provider", fallbackDbProvider)
      .single();

    if (fallbackKey) {
      const actualId =
        fallbackDbProvider === "claude" ? "anthropic" : fallbackDbProvider;
      return { apiKey: fallbackKey.encrypted_key, actualProviderId: actualId };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Parse request body ---
    const {
      agentTemplateId,
      goal,
      config,
      conversationId,
    }: {
      agentTemplateId: string;
      goal: string;
      config?: {
        model?: string;
        custom_instructions?: string;
        enabled_tools?: string[];
        max_steps?: number;
        auto_approve_tools?: boolean;
      };
      conversationId?: string;
    } = await req.json();

    if (!agentTemplateId || !goal) {
      return new Response(
        JSON.stringify({ error: "Missing agentTemplateId or goal" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // --- Fetch template ---
    const { data: template, error: templateError } = await supabase
      .from("agent_templates")
      .select("*")
      .eq("id", agentTemplateId)
      .single();

    if (templateError || !template) {
      return new Response(
        JSON.stringify({
          error: `Agent template not found: ${agentTemplateId}`,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // --- Resolve model & API key ---
    const selectedModel =
      config?.model || template.default_model || "claude-sonnet-4-20250514";
    const keyResult = await resolveApiKey(supabase, user.id, selectedModel);
    if (!keyResult) {
      return new Response(
        JSON.stringify({
          error:
            "No API key configured. Add one in Settings > API Keys.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    const { apiKey, actualProviderId } = keyResult;

    const streamFn = STREAM_FUNCTIONS[actualProviderId];
    if (!streamFn) {
      return new Response(
        JSON.stringify({ error: `Unsupported provider: ${actualProviderId}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // --- Available tools ---
    const enabledTools = config?.enabled_tools ?? template.default_tools ?? [];
    const tools = getToolDefinitions(
      enabledTools.length > 0 ? enabledTools : undefined
    );
    const maxSteps = config?.max_steps ?? 10;

    // --- Create agent_runs row ---
    const { data: run, error: runError } = await supabase
      .from("agent_runs")
      .insert({
        user_id: user.id,
        agent_template_id: agentTemplateId,
        conversation_id: conversationId || null,
        title: goal.slice(0, 120),
        status: "planning",
        goal,
        plan: [],
        result: {},
        config: config || {},
        model: selectedModel,
        tokens_used: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (runError || !run) {
      return new Response(
        JSON.stringify({ error: `Failed to create agent run: ${runError?.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const runId: string = run.id;

    // --- SSE output stream ---
    const encoder = new TextEncoder();
    let totalTokensEstimate = 0;

    const outputStream = new ReadableStream({
      async start(controller) {
        /** Helper to send an SSE event */
        function emit(event: string, data: Record<string, unknown>) {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        }

        try {
          // =================================================================
          // Phase 0: Fetch conversation memory for context
          // =================================================================
          let memoryPromptAddition = "";
          try {
            const conversationContext = await getConversationContext(
              user.id,
              supabase,
              { limit: 5, maxAgeDays: 30 }
            );
            memoryPromptAddition = buildMemoryPrompt(conversationContext);
          } catch {
            // Memory is non-critical — continue without it
          }

          // =================================================================
          // Phase 1: Planning
          // =================================================================
          const basePlanningPrompt = getPlanningPrompt(
            {
              name: template.name,
              description: template.description,
              system_prompt: template.system_prompt || "",
              capabilities: template.capabilities || [],
            },
            goal,
            tools
          );

          // Inject memory context into the planning prompt
          const planningPrompt = memoryPromptAddition
            ? basePlanningPrompt + memoryPromptAddition
            : basePlanningPrompt;

          const planStream = streamFn(
            apiKey,
            [{ role: "user", content: goal }],
            selectedModel,
            planningPrompt
          );

          const planText = await collectStreamText(planStream);
          totalTokensEstimate += planText.length; // rough token estimate

          let steps: {
            label: string;
            type: string;
            description: string;
            tool?: string;
            tool_args?: Record<string, unknown>;
          }[];

          try {
            steps = parseJsonArray(planText) as typeof steps;
          } catch {
            // If AI didn't produce valid JSON, create a single generic step
            steps = [
              {
                label: "Execute goal",
                type: "llm_call",
                description: goal,
              },
            ];
          }

          // Enforce max_steps
          if (steps.length > maxSteps) {
            steps = steps.slice(0, maxSteps);
          }

          // Update run with the plan
          const planForDb = steps.map((s) => ({
            label: s.label,
            type: s.type,
            description: s.description,
          }));
          await supabase
            .from("agent_runs")
            .update({ plan: planForDb, status: "running" })
            .eq("id", runId);

          emit("plan", {
            steps: planForDb,
          });

          // =================================================================
          // Phase 2: Execution
          // =================================================================
          const stepResults: {
            step_number: number;
            label: string;
            output: Record<string, unknown>;
          }[] = [];

          for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const stepNumber = i + 1;
            const stepStartTime = Date.now();

            // Insert agent_steps row
            await supabase.from("agent_steps").insert({
              run_id: runId,
              step_number: stepNumber,
              type: step.type,
              label: step.label,
              detail: step.description,
              status: "active",
              icon_name: stepTypeToIcon(step.type),
              input: step.tool_args || {},
              output: {},
              tool_name: step.tool || null,
              started_at: new Date().toISOString(),
            });

            emit("step_start", {
              step_number: stepNumber,
              label: step.label,
              type: step.type,
            });

            let stepOutput: Record<string, unknown> = {};

            try {
              // If the step references a tool, execute it
              if (step.tool) {
                emit("step_update", {
                  step_number: stepNumber,
                  detail: `Executing tool: ${step.tool}`,
                });

                stepOutput = await executeTool(
                  step.tool,
                  step.tool_args || {}
                );
              }

              // Run LLM for reasoning / synthesis on every step
              const stepPrompt = getStepExecutionPrompt(
                {
                  name: template.name,
                  description: template.description,
                  system_prompt: template.system_prompt || "",
                  capabilities: template.capabilities || [],
                },
                {
                  step_number: stepNumber,
                  label: step.label,
                  type: step.type,
                  description: step.description,
                },
                {
                  goal,
                  previousResults: stepResults,
                  customInstructions: config?.custom_instructions,
                }
              );

              const contextMessage = step.tool
                ? `Tool "${step.tool}" returned:\n${JSON.stringify(stepOutput, null, 2)}\n\nNow analyze and use this data for this step.`
                : step.description;

              emit("step_update", {
                step_number: stepNumber,
                detail: "Analyzing and synthesizing results...",
              });

              const stepStream = streamFn(
                apiKey,
                [{ role: "user", content: contextMessage }],
                selectedModel,
                stepPrompt
              );

              const stepText = await collectStreamText(stepStream);
              totalTokensEstimate += stepText.length;

              // Merge LLM reasoning into the output
              stepOutput = {
                ...stepOutput,
                reasoning: stepText.slice(0, 2000),
              };

              const durationMs = Date.now() - stepStartTime;

              // Update the step row
              await supabase
                .from("agent_steps")
                .update({
                  status: "complete",
                  output: stepOutput,
                  duration_ms: durationMs,
                  completed_at: new Date().toISOString(),
                })
                .eq("run_id", runId)
                .eq("step_number", stepNumber);

              stepResults.push({
                step_number: stepNumber,
                label: step.label,
                output: stepOutput,
              });

              emit("step_done", {
                step_number: stepNumber,
                output: stepOutput,
                duration_ms: durationMs,
              });
            } catch (stepError) {
              const durationMs = Date.now() - stepStartTime;

              await supabase
                .from("agent_steps")
                .update({
                  status: "failed",
                  output: { error: String(stepError) },
                  duration_ms: durationMs,
                  completed_at: new Date().toISOString(),
                })
                .eq("run_id", runId)
                .eq("step_number", stepNumber);

              emit("agent_error", {
                message: `Step ${stepNumber} failed: ${String(stepError)}`,
                step_number: stepNumber,
              });

              // Update run as failed
              await supabase
                .from("agent_runs")
                .update({
                  status: "failed",
                  error: String(stepError),
                  completed_at: new Date().toISOString(),
                  tokens_used: totalTokensEstimate,
                })
                .eq("id", runId);

              controller.close();
              return;
            }
          }

          // =================================================================
          // Phase 3: Summary & Completion
          // =================================================================
          const summaryPrompt = getSummaryPrompt(goal, stepResults);
          const summaryStream = streamFn(
            apiKey,
            [{ role: "user", content: "Please provide the final summary." }],
            selectedModel,
            summaryPrompt
          );

          const summaryText = await collectStreamText(summaryStream);
          totalTokensEstimate += summaryText.length;

          const finalResult = {
            summary: summaryText,
            steps_completed: stepResults.length,
            steps_total: steps.length,
          };

          await supabase
            .from("agent_runs")
            .update({
              status: "completed",
              result: finalResult,
              tokens_used: totalTokensEstimate,
              completed_at: new Date().toISOString(),
            })
            .eq("id", runId);

          emit("agent_done", {
            result: finalResult,
            tokens_used: totalTokensEstimate,
          });

          controller.close();
        } catch (error) {
          // Catch-all: mark run as failed and send error event
          await supabase
            .from("agent_runs")
            .update({
              status: "failed",
              error: String(error),
              completed_at: new Date().toISOString(),
              tokens_used: totalTokensEstimate,
            })
            .eq("id", runId)
            .catch(() => {});

          emit("agent_error", {
            message: String(error),
          });

          controller.close();
        }
      },
    });

    return new Response(outputStream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Map step type strings to lucide icon names for the UI. */
function stepTypeToIcon(type: string): string {
  const icons: Record<string, string> = {
    search: "search",
    browse: "globe",
    code: "code",
    write: "file-text",
    think: "brain",
    tool_call: "wrench",
    llm_call: "message-square",
    delegate: "users",
    plan: "list-checks",
  };
  return icons[type] || "circle";
}
