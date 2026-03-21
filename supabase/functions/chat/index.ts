// Supabase Edge Function: AI Chat Proxy
// Streams responses from multiple LLM providers, keeping API keys server-side

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveProvider, getFallbackChain } from "../_shared/provider-registry.ts";
import { selectOptimalModel } from "../_shared/smart-router.ts";
import { checkUsageGate } from "../_shared/usage-gate.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { streamAnthropic } from "../_shared/providers/anthropic.ts";
import { streamOpenAI } from "../_shared/providers/openai.ts";
import { streamGemini } from "../_shared/providers/gemini.ts";
import { streamTogether } from "../_shared/providers/together.ts";
import { getRelevantMemories, injectMemoryContext, extractMemories } from "../_shared/memory-manager.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Vyroo, an advanced AI assistant. You help users with research, analysis, coding, design, and any task they need. Be helpful, concise, and thorough. When working on tasks, break them into clear steps and provide actionable results.`;

const FOLLOWUP_PROMPT = `Based on the conversation below, suggest 3-4 short follow-up questions or actions the user might want to take next. Return ONLY a JSON array of strings, no explanation. Each suggestion should be concise (under 60 characters). Example: ["How do I deploy this?","Can you add error handling?","Explain the architecture"]`;

const PLAN_PROMPT = `Analyze the user's message and break the task into 3-5 concrete steps. Return ONLY a JSON array of objects with "label" and "detail" fields. Each label should be 2-4 words. Example: [{"label":"Understanding task","detail":"Parsing requirements and planning approach"},{"label":"Researching topic","detail":"Gathering relevant information"},{"label":"Composing response","detail":"Writing comprehensive answer"}]`;

// Map provider IDs to lightweight/fast models for follow-up generation
const FAST_MODELS: Record<string, string> = {
  anthropic: "claude-3-5-haiku-latest",
  openai: "gpt-4o-mini",
  gemini: "gemini-2.0-flash",
  together: "meta-llama/Llama-3.1-8B-Instruct-Turbo",
};

/**
 * Generate follow-up suggestions using a lightweight LLM call.
 * Uses the same provider/API key as the main response but with a fast model.
 */
async function generateFollowUps(
  providerId: string,
  apiKey: string,
  userMessage: string,
  assistantResponse: string
): Promise<string[]> {
  const fastModel = FAST_MODELS[providerId];
  if (!fastModel) return [];

  const condensedHistory = [
    { role: "user" as const, content: userMessage },
    { role: "assistant" as const, content: assistantResponse.slice(0, 500) },
  ];

  try {
    if (providerId === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: fastModel,
          max_tokens: 256,
          system: FOLLOWUP_PROMPT,
          messages: condensedHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) return [];
      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      return JSON.parse(text);
    } else if (providerId === "openai") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: fastModel,
          max_tokens: 256,
          messages: [
            { role: "system", content: FOLLOWUP_PROMPT },
            ...condensedHistory,
          ],
        }),
      });
      if (!res.ok) return [];
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";
      return JSON.parse(text);
    } else if (providerId === "gemini") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${fastModel}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: `${FOLLOWUP_PROMPT}\n\nUser: ${userMessage}\nAssistant: ${assistantResponse.slice(0, 500)}` }] },
            ],
            generationConfig: { maxOutputTokens: 256 },
          }),
        }
      );
      if (!res.ok) return [];
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      // Extract JSON array from response (Gemini may wrap it in markdown)
      const match = text.match(/\[[\s\S]*\]/);
      return match ? JSON.parse(match[0]) : [];
    } else if (providerId === "together") {
      const res = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: fastModel,
          max_tokens: 256,
          messages: [
            { role: "system", content: FOLLOWUP_PROMPT },
            ...condensedHistory,
          ],
        }),
      });
      if (!res.ok) return [];
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";
      return JSON.parse(text);
    }
  } catch {
    // Follow-up generation is non-critical
  }

  return [];
}

const DEFAULT_PLAN = [
  { label: "Understanding task", detail: "Analyzing the request" },
  { label: "Processing", detail: "Working on the response" },
  { label: "Delivering results", detail: "Finalizing the output" },
];

/**
 * Generate a task plan (3-5 steps) using a lightweight LLM call.
 * Uses the same provider/API key as the main response but with a fast model.
 */
async function generatePlan(
  providerId: string,
  apiKey: string,
  userMessage: string
): Promise<Array<{ label: string; detail: string }>> {
  const fastModel = FAST_MODELS[providerId];
  if (!fastModel) return DEFAULT_PLAN;

  const condensedMessages = [
    { role: "user" as const, content: userMessage },
  ];

  try {
    let text = "";

    if (providerId === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: fastModel,
          max_tokens: 256,
          system: PLAN_PROMPT,
          messages: condensedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) return DEFAULT_PLAN;
      const data = await res.json();
      text = data.content?.[0]?.text || "";
    } else if (providerId === "openai") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: fastModel,
          max_tokens: 256,
          messages: [
            { role: "system", content: PLAN_PROMPT },
            ...condensedMessages,
          ],
        }),
      });
      if (!res.ok) return DEFAULT_PLAN;
      const data = await res.json();
      text = data.choices?.[0]?.message?.content || "";
    } else if (providerId === "gemini") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${fastModel}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: `${PLAN_PROMPT}\n\nUser: ${userMessage}` }] },
            ],
            generationConfig: { maxOutputTokens: 256 },
          }),
        }
      );
      if (!res.ok) return DEFAULT_PLAN;
      const data = await res.json();
      text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else if (providerId === "together") {
      const res = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: fastModel,
          max_tokens: 256,
          messages: [
            { role: "system", content: PLAN_PROMPT },
            ...condensedMessages,
          ],
        }),
      });
      if (!res.ok) return DEFAULT_PLAN;
      const data = await res.json();
      text = data.choices?.[0]?.message?.content || "";
    }

    // Extract JSON array from response (some models wrap in markdown)
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length >= 2 && parsed.every((s: any) => s.label && s.detail)) {
        return parsed.slice(0, 5);
      }
    }
    return DEFAULT_PLAN;
  } catch {
    // Plan generation is non-critical
    return DEFAULT_PLAN;
  }
}

// Map provider IDs to their stream functions
const STREAM_FUNCTIONS: Record<
  string,
  (apiKey: string, messages: any[], model: string, systemPrompt?: string) => ReadableStream
> = {
  anthropic: streamAnthropic,
  openai: streamOpenAI,
  gemini: streamGemini,
  together: streamTogether,
};

Deno.serve(async (req) => {
  // Handle CORS preflight
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

    // Extract JWT token
    const token = authHeader.replace("Bearer ", "");

    // Create Supabase client with user's JWT
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user with explicit token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized", detail: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Rate limiting: check per-minute message rate before processing ---
    const rateLimit = await checkRateLimit(supabase, "chat");
    if (!rateLimit.allowed) {
      const rlResponse = rateLimitResponse(rateLimit);
      // Add CORS headers to the 429 response
      const headers = new Headers(rlResponse.headers);
      for (const [k, v] of Object.entries(corsHeaders)) {
        headers.set(k, v);
      }
      return new Response(rlResponse.body, {
        status: 429,
        headers,
      });
    }

    const { conversationId, message, provider, model } = await req.json();

    if (!conversationId || !message) {
      return new Response(JSON.stringify({ error: "Missing conversationId or message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Usage gate: check message limits before processing ---
    const usageGate = await checkUsageGate(user.id, supabase);
    if (!usageGate.allowed) {
      // Return an SSE stream with a single error event so the frontend handles it uniformly
      const encoder = new TextEncoder();
      const errorStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({
                error: "You've reached your message limit. Upgrade at vyroo.ai/pricing",
                remaining: 0,
                limit: usageGate.limit,
                plan: usageGate.plan,
              })}\n\n`
            )
          );
          controller.close();
        },
      });
      return new Response(errorStream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // --- Smart model routing ---
    // Detect which provider API keys are available via env vars
    const availableKeys = {
      anthropic: !!Deno.env.get("ANTHROPIC_API_KEY"),
      openai: !!Deno.env.get("OPENAI_API_KEY"),
      google: !!Deno.env.get("GOOGLE_API_KEY"),
    };

    // Let the smart router pick the optimal model
    const selectedModel = selectOptimalModel({
      userSelectedModel: model || null,
      messageContent: message,
      conversationLength: 0, // Will be populated after history load, but routing doesn't heavily depend on it
      userPlan: usageGate.plan as "free" | "pro" | "team" | "enterprise",
      availableKeys,
    });

    // Resolve the provider from the (potentially re-routed) model
    const { providerId, dbProvider } = resolveProvider(selectedModel);

    // Try to get user's API key for the resolved provider
    let apiKey: string | null = null;
    let actualProviderId = providerId;

    const { data: keyData } = await supabase
      .from("user_api_keys")
      .select("encrypted_key")
      .eq("user_id", user.id)
      .eq("provider", dbProvider)
      .single();

    if (keyData) {
      apiKey = keyData.encrypted_key;
    } else {
      // Try fallback chain
      const fallbacks = getFallbackChain(providerId);
      for (const fallbackDbProvider of fallbacks) {
        const { data: fallbackKey } = await supabase
          .from("user_api_keys")
          .select("encrypted_key")
          .eq("user_id", user.id)
          .eq("provider", fallbackDbProvider)
          .single();

        if (fallbackKey) {
          apiKey = fallbackKey.encrypted_key;
          // Map DB provider back to registry provider ID
          if (fallbackDbProvider === "claude") actualProviderId = "anthropic";
          else actualProviderId = fallbackDbProvider;
          break;
        }
      }
    }

    // Fallback to platform API keys from environment
    if (!apiKey) {
      const ENV_KEY_MAP: Record<string, string> = {
        anthropic: "ANTHROPIC_API_KEY",
        openai: "OPENAI_API_KEY",
        gemini: "GOOGLE_API_KEY",
        together: "TOGETHER_API_KEY",
      };

      // Try the resolved provider first
      apiKey = Deno.env.get(ENV_KEY_MAP[actualProviderId] || "") || null;

      // Try fallback providers
      if (!apiKey) {
        for (const fallbackProvider of ["anthropic", "openai", "gemini", "together"]) {
          const envKey = Deno.env.get(ENV_KEY_MAP[fallbackProvider] || "");
          if (envKey) {
            apiKey = envKey;
            actualProviderId = fallbackProvider;
            break;
          }
        }
      }
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: `No API key configured. Contact support.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert user message
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: message,
    });

    // Load conversation history (last 50 messages)
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(50);

    const messages = (history || []).map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    // Get the stream function for the resolved provider
    const streamFn = STREAM_FUNCTIONS[actualProviderId];
    if (!streamFn) {
      return new Response(
        JSON.stringify({ error: `Unsupported provider: ${actualProviderId}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Inject cross-conversation memory into the system prompt
    let enrichedSystemPrompt = SYSTEM_PROMPT;
    try {
      const memories = await getRelevantMemories(user.id, message, supabase);
      const memorySection = injectMemoryContext(memories);
      if (memorySection) {
        enrichedSystemPrompt = SYSTEM_PROMPT + memorySection;
      }
    } catch {
      // Memory retrieval is non-critical — proceed without it
    }

    // Create the provider stream (each adapter returns SSE-formatted ReadableStream)
    const providerStream = streamFn(apiKey, messages, selectedModel, enrichedSystemPrompt);

    // Wrap the provider stream to capture the full response and save it
    const encoder = new TextEncoder();
    let fullResponse = "";

    const outputStream = new ReadableStream({
      async start(controller) {
        try {
          // Emit which model was selected (useful when smart router auto-routes)
          controller.enqueue(
            encoder.encode(`event: model\ndata: ${JSON.stringify({ model: selectedModel })}\n\n`)
          );

          // Generate task plan for agentic step visualization
          const plan = await generatePlan(actualProviderId, apiKey!, message);
          const startTime = Date.now();
          const completedSteps = new Set<number>();

          // Emit initial step events (first step active, rest pending)
          for (let i = 0; i < plan.length; i++) {
            controller.enqueue(
              encoder.encode(`event: step\ndata: ${JSON.stringify({
                id: i + 1,
                label: plan[i].label,
                detail: plan[i].detail,
                status: i === 0 ? "active" : "pending",
                logs: i === 0 ? [{ time: "0:00", text: "Starting...", type: "info" }] : [],
              })}\n\n`)
            );
          }

          const reader = providerStream.getReader();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Decode the chunk to capture tokens for DB storage
            const chunk = new TextDecoder().decode(value);

            // Extract token text from SSE format for accumulation
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ") && !line.includes('"error"')) {
                try {
                  const parsed = JSON.parse(line.slice(6));
                  if (parsed.token) {
                    fullResponse += parsed.token;
                  }
                } catch {
                  // Skip
                }
              }
            }

            // Forward the chunk as-is to the client
            controller.enqueue(value);

            // Update step progress based on response length
            const progress = fullResponse.length;
            const thresholds = plan.map((_, i) => Math.floor((i + 1) * (1500 / plan.length)));
            for (let i = 0; i < plan.length; i++) {
              if (progress > thresholds[i] && !completedSteps.has(i)) {
                completedSteps.add(i);
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
                const mins = Math.floor(Number(elapsed) / 60);
                const secs = Number(elapsed) % 60;
                const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;

                // Complete this step
                controller.enqueue(
                  encoder.encode(`event: step\ndata: ${JSON.stringify({
                    id: i + 1,
                    label: plan[i].label,
                    detail: plan[i].detail,
                    status: "complete",
                    logs: [
                      { time: timeStr, text: plan[i].detail, type: "result" },
                    ],
                  })}\n\n`)
                );

                // Activate next step if exists
                if (i + 1 < plan.length) {
                  controller.enqueue(
                    encoder.encode(`event: step\ndata: ${JSON.stringify({
                      id: i + 2,
                      label: plan[i + 1].label,
                      detail: plan[i + 1].detail,
                      status: "active",
                      logs: [{ time: timeStr, text: "Starting...", type: "info" }],
                    })}\n\n`)
                  );
                }
              }
            }
          }

          // Complete all remaining steps
          for (let i = 0; i < plan.length; i++) {
            if (!completedSteps.has(i)) {
              const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
              const mins = Math.floor(Number(elapsed) / 60);
              const secs = Number(elapsed) % 60;
              const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;
              controller.enqueue(
                encoder.encode(`event: step\ndata: ${JSON.stringify({
                  id: i + 1,
                  label: plan[i].label,
                  detail: plan[i].detail,
                  status: "complete",
                  logs: [{ time: timeStr, text: "Complete", type: "result" }],
                })}\n\n`)
              );
            }
          }

          // Check if response has table-like data (markdown tables)
          if (fullResponse.includes('|') && fullResponse.includes('---')) {
            try {
              const tableLines = fullResponse.split('\n').filter(l => l.includes('|'));
              if (tableLines.length >= 3) {
                const headers = tableLines[0].split('|').map(h => h.trim()).filter(Boolean);
                const rows = tableLines.slice(2).map(r => r.split('|').map(c => c.trim()).filter(Boolean));
                if (headers.length > 0 && rows.length > 0) {
                  controller.enqueue(
                    encoder.encode(`event: report\ndata: ${JSON.stringify({
                      title: plan[plan.length - 1]?.label || "Report",
                      summary: fullResponse.slice(0, 150),
                      headers,
                      rows: rows.slice(0, 20),
                    })}\n\n`)
                  );
                }
              }
            } catch {
              // Report generation is non-critical
            }
          }

          // Save the complete assistant message
          if (fullResponse) {
            await supabase.from("messages").insert({
              conversation_id: conversationId,
              role: "assistant",
              content: fullResponse,
            });

            // Update conversation timestamp and message count
            await supabase
              .from("conversations")
              .update({
                updated_at: new Date().toISOString(),
                last_message_preview: message.slice(0, 100),
              })
              .eq("id", conversationId);

            // Increment message count
            try {
              await supabase.rpc("increment_message_count", { conv_id: conversationId });
            } catch {
              // Fallback if RPC doesn't exist yet
            }

            // Save steps to database — delete old ones first to avoid accumulation
            try {
              await supabase.from("steps").delete().eq("conversation_id", conversationId);
              for (let i = 0; i < plan.length; i++) {
                await supabase.from("steps").insert({
                  conversation_id: conversationId,
                  step_number: i + 1,
                  label: plan[i].label,
                  detail: plan[i].detail,
                  status: "complete",
                });
              }
            } catch {
              // Step persistence is non-critical
            }

            // Auto-title: check if this conversation needs a title
            try {
              const { data: conv } = await supabase
                .from("conversations")
                .select("auto_titled")
                .eq("id", conversationId)
                .single();

              if (conv && !conv.auto_titled) {
                // Call auto-title edge function inline
                const titleResponse = await fetch(
                  `${Deno.env.get("SUPABASE_URL")}/functions/v1/auto-title`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: authHeader!,
                    },
                    body: JSON.stringify({
                      conversationId,
                      userMessage: message,
                      assistantMessage: fullResponse.slice(0, 300),
                    }),
                  }
                );

                if (titleResponse.ok) {
                  const { title } = await titleResponse.json();
                  if (title) {
                    controller.enqueue(
                      encoder.encode(`event: title\ndata: ${JSON.stringify({ title })}\n\n`)
                    );
                  }
                }
              }
            } catch {
              // Title generation is non-critical, don't fail the stream
            }
          }

          // Generate follow-up suggestions using a lightweight model
          if (fullResponse) {
            try {
              const followUps = await generateFollowUps(
                actualProviderId,
                apiKey!,
                message,
                fullResponse
              );
              if (followUps.length > 0) {
                controller.enqueue(
                  encoder.encode(
                    `event: followups\ndata: ${JSON.stringify({ followUps })}\n\n`
                  )
                );
              }
            } catch {
              // Follow-up generation is non-critical, don't fail the stream
            }
          }

          // Extract memories in the background (non-blocking)
          if (fullResponse) {
            extractMemories(
              actualProviderId,
              apiKey!,
              message,
              fullResponse,
              user.id,
              supabase
            ).catch(() => {
              // Memory extraction is non-critical
            });
          }

          controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
          controller.close();
        } catch (error) {
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ error: String(error) })}\n\n`)
          );
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
