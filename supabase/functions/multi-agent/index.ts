// Supabase Edge Function: Multi-Agent Delegation
// Runs multiple sub-agents in parallel for complex tasks, then merges results.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveProvider, getFallbackChain } from "../_shared/provider-registry.ts";
import { streamAnthropic } from "../_shared/providers/anthropic.ts";
import { streamOpenAI } from "../_shared/providers/openai.ts";
import { streamGemini } from "../_shared/providers/gemini.ts";
import { streamTogether } from "../_shared/providers/together.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STREAM_FUNCTIONS: Record<
  string,
  (apiKey: string, messages: any[], model: string, systemPrompt?: string) => ReadableStream
> = {
  anthropic: streamAnthropic,
  openai: streamOpenAI,
  gemini: streamGemini,
  together: streamTogether,
};

const DECOMPOSE_PROMPT = `You are a task decomposition expert. Given a complex user goal, break it into 2-4 independent sub-tasks that can be executed IN PARALLEL by separate AI agents.

Each sub-task must be:
- Independent (no dependencies between sub-tasks)
- Self-contained (can be completed without the results of other sub-tasks)
- Focused on a distinct aspect of the goal

Return ONLY a JSON array (no markdown fences). Each element must have:
- "id": a short identifier (e.g., "research_market", "analyze_competitors")
- "label": human-readable label (max 60 chars)
- "prompt": the full prompt for the sub-agent (be specific and detailed)
- "type": one of "research", "analysis", "creative", "code", "data"

Example:
[
  {"id": "research_trends", "label": "Research market trends", "prompt": "Research the latest market trends in...", "type": "research"},
  {"id": "analyze_competitors", "label": "Analyze competitor landscape", "prompt": "Analyze the top competitors in...", "type": "analysis"}
]`;

const MERGE_PROMPT = `You are a synthesis expert. Multiple AI agents have independently worked on sub-tasks of a larger goal. Merge their results into a single, coherent, comprehensive response.

Guidelines:
- Combine findings without redundancy
- Use clear section headings (## Markdown)
- Cross-reference data from different agents when possible
- Highlight key insights that emerge from combining the results
- Include a brief summary at the top
- Use tables for comparisons
- Cite specific data points`;

/** Collect the full text from a provider SSE stream. */
async function collectStreamText(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (line.startsWith("data: ")) {
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.token) full += parsed.token;
        } catch { /* skip */ }
      }
    }
  }
  return full;
}

/** Resolve API key for a user and model. */
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

  if (keyData) return { apiKey: keyData.encrypted_key, actualProviderId: providerId };

  const fallbacks = getFallbackChain(providerId);
  for (const fb of fallbacks) {
    const { data: fbKey } = await supabase
      .from("user_api_keys")
      .select("encrypted_key")
      .eq("user_id", userId)
      .eq("provider", fb)
      .single();
    if (fbKey) {
      return { apiKey: fbKey.encrypted_key, actualProviderId: fb === "claude" ? "anthropic" : fb };
    }
  }

  // Try platform keys
  const ENV_KEY_MAP: Record<string, string> = {
    anthropic: "ANTHROPIC_API_KEY",
    openai: "OPENAI_API_KEY",
    gemini: "GOOGLE_API_KEY",
    together: "TOGETHER_API_KEY",
  };
  const envKey = Deno.env.get(ENV_KEY_MAP[providerId] || "");
  if (envKey) return { apiKey: envKey, actualProviderId: providerId };

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { goal, conversationId, model: requestModel } = await req.json();
    if (!goal) {
      return new Response(JSON.stringify({ error: "Missing goal" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const selectedModel = requestModel || "claude-sonnet-4-20250514";
    const keyResult = await resolveApiKey(supabase, user.id, selectedModel);
    if (!keyResult) {
      return new Response(JSON.stringify({ error: "No API key configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { apiKey, actualProviderId } = keyResult;
    const streamFn = STREAM_FUNCTIONS[actualProviderId];
    if (!streamFn) {
      return new Response(JSON.stringify({ error: `Unsupported provider: ${actualProviderId}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();

    const outputStream = new ReadableStream({
      async start(controller) {
        function emit(event: string, data: Record<string, unknown>) {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        }

        try {
          // Phase 1: Decompose the goal into sub-tasks
          emit("phase", { phase: "decomposing", message: "Breaking task into parallel sub-tasks..." });

          const decomposeStream = streamFn(
            apiKey,
            [{ role: "user", content: goal }],
            selectedModel,
            DECOMPOSE_PROMPT
          );
          const decomposeText = await collectStreamText(decomposeStream);

          let subTasks: Array<{ id: string; label: string; prompt: string; type: string }>;
          try {
            let cleaned = decomposeText.trim();
            if (cleaned.startsWith("```")) {
              cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
            }
            subTasks = JSON.parse(cleaned);
          } catch {
            subTasks = [{ id: "main", label: "Execute task", prompt: goal, type: "general" }];
          }

          emit("subtasks", {
            tasks: subTasks.map(t => ({ id: t.id, label: t.label, type: t.type, status: "pending" })),
          });

          // Phase 2: Execute sub-agents in parallel
          emit("phase", { phase: "executing", message: `Running ${subTasks.length} agents in parallel...` });

          const agentPromises = subTasks.map(async (task, idx) => {
            const startTime = Date.now();
            emit("agent_start", { id: task.id, label: task.label, index: idx });

            try {
              const agentStream = streamFn(
                apiKey,
                [{ role: "user", content: task.prompt }],
                selectedModel,
                `You are a specialized AI agent focused on: ${task.type}. Complete the assigned task thoroughly and provide a detailed, structured response. Use markdown formatting.`
              );

              const result = await collectStreamText(agentStream);
              const durationMs = Date.now() - startTime;

              emit("agent_done", {
                id: task.id,
                label: task.label,
                index: idx,
                duration_ms: durationMs,
                result_preview: result.slice(0, 200),
              });

              return { id: task.id, label: task.label, result, duration_ms: durationMs };
            } catch (err) {
              emit("agent_error", { id: task.id, error: String(err) });
              return { id: task.id, label: task.label, result: `Error: ${String(err)}`, duration_ms: 0 };
            }
          });

          const results = await Promise.all(agentPromises);

          // Phase 3: Merge results
          emit("phase", { phase: "merging", message: "Synthesizing results from all agents..." });

          const mergeInput = results
            .map(r => `## Agent: ${r.label}\n\n${r.result}`)
            .join("\n\n---\n\n");

          const mergeStream = streamFn(
            apiKey,
            [{ role: "user", content: `ORIGINAL GOAL: ${goal}\n\nSUB-AGENT RESULTS:\n\n${mergeInput}` }],
            selectedModel,
            MERGE_PROMPT
          );

          // Stream the merged response token by token
          const reader = mergeStream.getReader();
          const decoder = new TextDecoder();
          let fullMerged = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split("\n")) {
              if (line.startsWith("data: ")) {
                try {
                  const parsed = JSON.parse(line.slice(6));
                  if (parsed.token) {
                    fullMerged += parsed.token;
                    controller.enqueue(
                      encoder.encode(`event: token\ndata: ${JSON.stringify({ token: parsed.token })}\n\n`)
                    );
                  }
                } catch { /* skip */ }
              }
            }
          }

          // Save to database
          if (conversationId && fullMerged) {
            await supabase.from("messages").insert({
              conversation_id: conversationId,
              role: "assistant",
              content: fullMerged,
              metadata: { multi_agent: true, sub_tasks: subTasks.length },
            }).catch(() => {});
          }

          emit("done", {
            agents_used: results.length,
            total_duration_ms: results.reduce((sum, r) => sum + r.duration_ms, 0),
          });

          controller.close();
        } catch (error) {
          emit("error", { message: String(error) });
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
