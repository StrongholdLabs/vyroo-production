// Supabase Edge Function: AI Chat Proxy
// Streams responses from multiple LLM providers, keeping API keys server-side

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveProvider, getFallbackChain } from "../_shared/provider-registry.ts";
import { selectOptimalModel } from "../_shared/smart-router.ts";
import { checkUsageGate } from "../_shared/usage-gate.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { streamAnthropic, callAnthropicWithTools } from "../_shared/providers/anthropic.ts";
import { getToolDefinitions, executeTool } from "../_shared/agent-tools.ts";
import { streamOpenAI } from "../_shared/providers/openai.ts";
import { streamGemini } from "../_shared/providers/gemini.ts";
import { streamTogether } from "../_shared/providers/together.ts";
import { getRelevantMemories, injectMemoryContext, extractMemories } from "../_shared/memory-manager.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Vyroo, an advanced AI research and analysis agent. You operate like a top-tier research analyst — you gather information from multiple sources, cross-reference findings, and deliver comprehensive, well-structured reports.

## How You Work

You are an AGENT, not a chatbot. When a task requires research:
1. **Search broadly first** — use web_search with multiple queries to cover different angles
2. **Go deep on the best sources** — use browse_url to read full articles, not just snippets
3. **Cross-reference** — verify claims across multiple sources, note disagreements
4. **Synthesize** — combine everything into an original, insightful response

## Tool Usage Strategy

- **web_search**: Use 2-3 different search queries to cover the topic thoroughly. Don't stop after one search.
- **browse_url**: Always browse the top 2-3 most relevant URLs from search results. The snippets alone are never enough.
- **generate_code**: For any coding task, generate complete, runnable code with comments.
- **Chain tools**: Search → Browse → Search again (refined) → Browse more → Synthesize. More iterations = better answers.

## Response Quality Standards

Your final response MUST:
- **Lead with a direct answer** — state the key finding/answer in the first paragraph
- **Provide depth** — include specific data, numbers, dates, names, and facts (not vague generalizations)
- **Use evidence** — every major claim should reference a source with inline links: [Source Name](url)
- **Be structured** — use ## headings, bullet points, and tables where appropriate
- **Include a takeaway** — end with a "Key Takeaways" or "Bottom Line" section
- **Never be shallow** — if you only found surface-level info, search and browse more before responding

## Formatting Rules
- Use **bold** for key terms, metrics, brand names, and important figures
- Use markdown tables for comparisons (always include headers)
- Keep paragraphs to 2-3 sentences max
- Do NOT include URLs or links in your text response — no [text](url) patterns, no raw URLs
- For long responses, use a table of contents with plain text section names
- NEVER use HTML tags (<a>, <div>, <span>, <br>, etc.) — use ONLY pure Markdown syntax

## Tool Efficiency
- Keep searches focused: max 3-4 web_search calls, max 2-3 browse_url calls
- Don't over-research — gather enough data then synthesize immediately
- Tool order: search → browse best results → write_report

## CRITICAL: Always Use write_report
For ANY research, analysis, or complex question: you MUST call write_report as your FINAL tool call before responding. This is mandatory. The write_report tool generates the document that appears in the user's Computer Panel.
- Pass ALL your research findings as the "data" parameter
- The report should contain tables, key findings, and structured analysis
- After write_report completes, give a SHORT 1-2 sentence summary as your text response (do NOT repeat the full report in your response)
- Do NOT write long inline responses — put the detailed content in write_report instead

## What NOT to Do
- Don't give vague, generic answers when specific data is available
- Don't stop researching after a single search — always do at least 2 searches for complex queries
- Don't summarize search snippets — browse the actual pages for real content
- Don't hedge excessively — be confident when the evidence supports a conclusion
- Don't waste tool calls — be efficient, gather what you need and move to synthesis`;

const DIRECT_SYSTEM_PROMPT = `You are Vyroo, a knowledgeable AI assistant. You provide clear, well-structured answers using your training knowledge.

## Response Quality Standards
- **Lead with a direct answer** — don't beat around the bush
- **Be specific** — include data, numbers, names, and facts where possible
- **Structure well** — use ## headings, bullet points, and markdown formatting
- **Use bold** for key terms, metrics, and important figures
- **Keep it concise** — 2-3 sentence paragraphs max

You do NOT have access to tools or web search in this mode. Answer from your knowledge.`;

const FOLLOWUP_PROMPT = `Based on the conversation below, suggest 3-4 short follow-up questions or actions the user might want to take next. Return ONLY a JSON array of strings, no explanation. Each suggestion should be concise (under 60 characters). Example: ["How do I deploy this?","Can you add error handling?","Explain the architecture"]`;

const PLAN_PROMPT = `Analyze the user's message and break the task into 3-5 concrete steps. Return ONLY a JSON array of objects with "label" and "detail" fields.

IMPORTANT: Step labels must be SPECIFIC to the user's actual task — never use generic labels like "Understanding task" or "Processing". Include the actual subject matter in each label.

Good labels: "Researching DTC skincare brands", "Comparing pricing strategies", "Building revenue projection table"
Bad labels: "Understanding task", "Processing data", "Delivering results"

Example for "Analyze top 5 DTC skincare brands":
[{"label":"Researching top DTC skincare brands","detail":"Searching for market data on The Ordinary, Glossier, Rhode, Dieux, and Drunk Elephant"},{"label":"Comparing pricing strategies","detail":"Building a pricing comparison table across product categories"},{"label":"Analyzing market positioning","detail":"Identifying each brand's unique positioning and target demographic"},{"label":"Compiling brand analysis report","detail":"Writing comprehensive comparison with tables and key insights"}]`;

const CLASSIFY_PROMPT = `Classify this user message into one of two modes. Return ONLY the word "direct" or "agentic".

Use "direct" for:
- Simple questions with short answers (math, facts, greetings, definitions)
- Conversational messages (hello, thanks, follow-ups)
- One-line requests

Use "agentic" for:
- Research tasks requiring multiple steps
- Analysis or comparison requests
- Content creation (reports, articles, presentations)
- Complex multi-part questions
- Tasks that would benefit from planning and structured execution

Examples:
"What is 2+2?" → direct
"Hello" → direct
"What's the capital of France?" → direct
"Analyze the top 5 DTC skincare brands" → agentic
"Create a marketing strategy for my startup" → agentic
"Compare React vs Vue for enterprise apps" → agentic
"Research nutrition trends in 2026" → agentic
"Thanks!" → direct
"no follow up?" → direct
"where are the follow-ups?" → direct
"can you explain more?" → direct
"what about X?" → direct
"tell me more about the first point" → direct
"good job" → direct
"why did you say that?" → direct`;

/** Parse a JSON array from text that might be wrapped in markdown code blocks */
function parseJsonArray(text: string): string[] {
  try {
    // Try direct parse first
    const direct = JSON.parse(text);
    if (Array.isArray(direct)) return direct;
  } catch {}
  // Extract JSON array from markdown wrapping (```json ... ```)
  const match = text.match(/\[[\s\S]*?\]/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return [];
}

// Map provider IDs to lightweight/fast models for follow-up generation
const FAST_MODELS: Record<string, string> = {
  anthropic: "claude-haiku-4-5-20251001",
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
  assistantResponse: string,
  reportContent?: string
): Promise<string[]> {
  const fastModel = FAST_MODELS[providerId];
  if (!fastModel) return [];

  // Use report content for better context (the text response may be just a short summary)
  const contextText = reportContent ? reportContent.slice(0, 1500) : assistantResponse.slice(0, 500);

  const condensedHistory = [
    { role: "user" as const, content: userMessage },
    { role: "assistant" as const, content: contextText },
  ];

  try {
    console.log("[generateFollowUps] provider:", providerId, "model:", fastModel, "contextLength:", contextText.length);
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
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error("[followups] Anthropic API error:", res.status, errText.substring(0, 200));
        return [];
      }
      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      console.log("[followups] Anthropic raw response:", text.substring(0, 200));
      return parseJsonArray(text);
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
      return parseJsonArray(text);
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
      return parseJsonArray(text);
    }
  } catch (e) {
    console.error("[followups] generateFollowUps error:", String(e));
  }

  return [];
}

function getDefaultPlan(userMessage: string) {
  // Extract topic from user message for better fallback labels
  const topic = userMessage.replace(/^(can you |please |help me |I want to |I need to )/i, "").substring(0, 60).trim();
  const shortTopic = topic.split(/[,.!?]/)[0].trim();
  return [
    { label: `Analyzing your request`, detail: `Breaking down the task and identifying key requirements` },
    { label: `Researching ${shortTopic}`, detail: `Searching multiple sources and gathering relevant data` },
    { label: `Compiling final report`, detail: `Synthesizing findings into a structured report with key insights` },
  ];
}

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
  if (!fastModel) return getDefaultPlan(userMessage);

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
      if (!res.ok) return getDefaultPlan(userMessage);
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
      if (!res.ok) return getDefaultPlan(userMessage);
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
      if (!res.ok) return getDefaultPlan(userMessage);
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
      if (!res.ok) return getDefaultPlan(userMessage);
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
    return getDefaultPlan(userMessage);
  } catch {
    // Plan generation is non-critical
    return getDefaultPlan(userMessage);
  }
}

/**
 * Classify whether a message needs the full agentic flow (plan + steps) or a direct answer.
 * Uses a fast model with max_tokens: 10 for near-instant classification.
 */
async function classifyTask(
  providerId: string,
  apiKey: string,
  userMessage: string
): Promise<"direct" | "agentic"> {
  // Very short messages (greetings, one-word) are direct — skip the LLM call
  if (userMessage.trim().length < 20) return "direct";

  const fastModel = FAST_MODELS[providerId];
  if (!fastModel) return "agentic";

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
          max_tokens: 10,
          system: CLASSIFY_PROMPT,
          messages: [{ role: "user", content: userMessage }],
        }),
      });
      if (!res.ok) return "agentic";
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
          max_tokens: 10,
          messages: [
            { role: "system", content: CLASSIFY_PROMPT },
            { role: "user", content: userMessage },
          ],
        }),
      });
      if (!res.ok) return "agentic";
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
              { role: "user", parts: [{ text: `${CLASSIFY_PROMPT}\n\nUser message: ${userMessage}` }] },
            ],
            generationConfig: { maxOutputTokens: 10 },
          }),
        }
      );
      if (!res.ok) return "agentic";
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
          max_tokens: 10,
          messages: [
            { role: "system", content: CLASSIFY_PROMPT },
            { role: "user", content: userMessage },
          ],
        }),
      });
      if (!res.ok) return "agentic";
      const data = await res.json();
      text = data.choices?.[0]?.message?.content || "";
    }

    const lower = text.toLowerCase().trim();
    if (lower.includes("direct")) return "direct";
    if (lower.includes("agentic")) return "agentic";
    // Default to agentic for safety
    return "agentic";
  } catch {
    // Classification is non-critical — default to agentic for complex task safety
    return "agentic";
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
    // (Use direct prompt for simple questions to prevent raw tool XML in responses)
    let enrichedSystemPrompt = SYSTEM_PROMPT; // Will be replaced for direct mode after classification
    let lastReportContent = ""; // Track report content for follow-up generation
    try {
      const memories = await getRelevantMemories(user.id, message, supabase);
      const memorySection = injectMemoryContext(memories);
      if (memorySection) {
        enrichedSystemPrompt = SYSTEM_PROMPT + memorySection;
      }
    } catch {
      // Memory retrieval is non-critical — proceed without it
    }

    // Create the provider stream for direct mode (each adapter returns SSE-formatted ReadableStream)
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

          // Classify whether this needs the full agentic flow or a direct answer
          const taskMode = await classifyTask(actualProviderId, apiKey!, message);

          // Use the correct system prompt based on mode
          // Direct mode must NOT include tool references or Claude will emit raw XML
          if (taskMode === "direct") {
            enrichedSystemPrompt = DIRECT_SYSTEM_PROMPT;
            // Re-inject memory if we had it
            try {
              const memories = await getRelevantMemories(user.id, message, supabase);
              const memorySection = injectMemoryContext(memories);
              if (memorySection) enrichedSystemPrompt += memorySection;
            } catch {}
          }

          // Emit task mode so frontend knows whether to show steps UI
          controller.enqueue(
            encoder.encode(`event: mode\ndata: ${JSON.stringify({ mode: taskMode })}\n\n`)
          );

          let plan: Array<{label: string; detail: string}> = [];
          let startTime = Date.now();
          const completedSteps = new Set<number>();

          if (taskMode === "direct") {
            // Clear any old steps from previous agentic runs
            try {
              await supabase.from("steps").delete().eq("conversation_id", conversationId);
            } catch {}
          }

          if (taskMode === "agentic") {
            // Generate task plan for agentic step visualization
            plan = await generatePlan(actualProviderId, apiKey!, message);
            startTime = Date.now();

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
          }

          if (taskMode === "agentic" && actualProviderId === "anthropic") {
            // ===== ReAct Tool Loop (Anthropic only) =====
            try {
              // Build Anthropic-format tool definitions from agent-tools registry
              const toolDefs = getToolDefinitions();
              const anthropicTools = toolDefs.map(t => {
                const properties: Record<string, { type: string; description: string }> = {};
                const required: string[] = [];
                for (const [pName, pDef] of Object.entries(t.parameters)) {
                  properties[pName] = { type: pDef.type, description: pDef.description };
                  if (pDef.required) required.push(pName);
                }
                return {
                  name: t.id,
                  description: t.description,
                  input_schema: {
                    type: "object" as const,
                    properties,
                    required,
                  },
                };
              });

              // Build conversation history for the tool loop
              const loopMessages: Array<{ role: string; content: any }> = messages.map(m => ({
                role: m.role,
                content: m.content,
              }));

              let toolIterations = 0;
              const MAX_TOOL_ITERATIONS = 15;
              let finalTextContent = "";
              let hasUsedTools = false;
              let hasWrittenReport = false;
              // Accumulated logs per step for rich step progress
              const stepLogs: Map<number, Array<{time: string; text: string; type: string}>> = new Map();
              const getElapsed = () => {
                const sec = Math.floor((Date.now() - startTime) / 1000);
                return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
              };
              const addStepLog = (stepIdx: number, text: string, type: string) => {
                if (!stepLogs.has(stepIdx)) stepLogs.set(stepIdx, []);
                const logs = stepLogs.get(stepIdx)!;
                logs.push({ time: getElapsed(), text, type });
                if (stepIdx < plan.length) {
                  controller.enqueue(encoder.encode(`event: step\ndata: ${JSON.stringify({
                    id: stepIdx + 1,
                    label: plan[stepIdx].label,
                    detail: plan[stepIdx].detail,
                    status: "active",
                    logs,
                  })}\n\n`));
                }
              };

              while (toolIterations < MAX_TOOL_ITERATIONS) {
                toolIterations++;

                // Safeguard: after 5+ iterations, strongly push write_report
                let extraPrompt = enrichedSystemPrompt;
                if (toolIterations >= 5 && !hasWrittenReport && hasUsedTools) {
                  extraPrompt += "\n\nCRITICAL: You have gathered enough research data. You MUST call write_report NOW as your next tool call. Pass all your gathered data/findings as the 'data' parameter and the topic as 'topic'. Do NOT make any more web_search or browse_url calls. Do NOT respond with text yet — call write_report first.";
                }

                const result = await callAnthropicWithTools(
                  apiKey!, loopMessages, selectedModel, anthropicTools, extraPrompt
                );

                if (result.toolCalls.length === 0) {
                  // If we used tools but never called write_report, force it now
                  if (hasUsedTools && !hasWrittenReport) {
                    loopMessages.push({
                      role: "assistant",
                      content: result.textContent,
                    });
                    loopMessages.push({
                      role: "user",
                      content: "You must call write_report now with all your research findings before responding. Pass the full topic and all data you gathered.",
                    });
                    const reportResult = await callAnthropicWithTools(
                      apiKey!, loopMessages, selectedModel, anthropicTools,
                      enrichedSystemPrompt + "\n\nYou MUST call write_report now. Do not respond with text — call the tool first."
                    );
                    // Process any tool calls from the forced report
                    if (reportResult.toolCalls.length > 0) {
                      for (const tc of reportResult.toolCalls) {
                        const tcStart = Date.now();
                        const tcResult = await executeTool(tc.name, tc.input);
                        const tcDuration = Date.now() - tcStart;
                        if (tc.name === "write_report") {
                          hasWrittenReport = true;
                          // Emit report SSE event
                          const reportContent = (tcResult as any).content || "";
                          lastReportContent = reportContent;
                          const reportFormat = (tcResult as any).format || "markdown";
                          // Extract table from report
                          let tableHeaders: string[] = [];
                          let tableRows: string[][] = [];
                          const reportLines = reportContent.split('\n');
                          for (let li = 0; li < reportLines.length; li++) {
                            const line = reportLines[li].trim();
                            if (line.startsWith('|') && line.endsWith('|')) {
                              const nextLine = (reportLines[li + 1] || "").trim();
                              if (nextLine.match(/^\|[\s\-:|]+\|$/)) {
                                tableHeaders = line.split('|').map((h: string) => h.trim()).filter(Boolean);
                                for (let ri = li + 2; ri < reportLines.length; ri++) {
                                  const rowLine = reportLines[ri].trim();
                                  if (!rowLine.startsWith('|') || !rowLine.endsWith('|')) break;
                                  tableRows.push(rowLine.split('|').map((c: string) => c.trim()).filter(Boolean));
                                }
                                break;
                              }
                            }
                          }
                          let reportSummary = "";
                          for (const rLine of reportLines) {
                            const trimmed = rLine.trim();
                            if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('|') && !trimmed.startsWith('---')) {
                              reportSummary = trimmed.substring(0, 300);
                              break;
                            }
                          }
                          controller.enqueue(encoder.encode(`event: report\ndata: ${JSON.stringify({
                            title: tc.input.topic || "Report",
                            content: reportContent,
                            format: reportFormat,
                            word_count: (tcResult as any).word_count || 0,
                            summary: reportSummary || reportContent.substring(0, 200),
                            headers: tableHeaders,
                            rows: tableRows.slice(0, 10),
                          })}\n\n`));
                        }
                        // Emit tool events
                        controller.enqueue(encoder.encode(`event: tool\ndata: ${JSON.stringify({
                          name: tc.name, args: tc.input, result: tcResult, duration: tcDuration, status: "complete",
                        })}\n\n`));
                        if (plan.length > 0) {
                          const stepIdx = Math.min(plan.length - 1, plan.length - 1);
                          addStepLog(stepIdx, tc.name === "write_report" ? `Report complete (${(tcResult as any).word_count || 0} words)` : "Complete", "result");
                        }
                        loopMessages.push({ role: "assistant", content: [{ type: "tool_use", id: tc.id, name: tc.name, input: tc.input }] });
                        loopMessages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: tc.id, content: JSON.stringify(tcResult) }] });
                      }
                    }
                    // Now get the final short summary
                    const summaryResult = await callAnthropicWithTools(
                      apiKey!, loopMessages, selectedModel, anthropicTools,
                      enrichedSystemPrompt + "\n\nThe report has been generated. Now give a SHORT 1-2 sentence summary of the key findings. Do not repeat the report content."
                    );
                    finalTextContent = summaryResult.textContent || result.textContent;
                  } else {
                    finalTextContent = result.textContent;
                  }
                  break;
                }
                hasUsedTools = true;

                // Execute each tool call
                for (const toolCall of result.toolCalls) {
                  const toolStartMs = Date.now();
                  const currentStepIdx = plan.length > 0 ? Math.min(toolIterations - 1, plan.length - 1) : 0;

                  // Emit tool executing event
                  controller.enqueue(encoder.encode(`event: tool\ndata: ${JSON.stringify({
                    name: toolCall.name,
                    args: toolCall.input,
                    status: "executing",
                  })}\n\n`));

                  // Add step log: tool started
                  if (plan.length > 0) {
                    let domain = "";
                    try { domain = toolCall.input.url ? new URL(toolCall.input.url).hostname.replace("www.", "") : ""; } catch {}
                    const actionLog = toolCall.name === "web_search" ? `Searching for "${toolCall.input.query}"`
                      : toolCall.name === "browse_url" ? `Reading ${domain || toolCall.input.url}`
                      : toolCall.name === "write_report" ? `Generating report: ${toolCall.input.topic || "analysis"}`
                      : toolCall.name === "generate_code" ? `Generating code`
                      : `Running ${toolCall.name}`;
                    addStepLog(currentStepIdx, actionLog, "action");
                  }

                  // Execute the tool
                  const toolResult = await executeTool(toolCall.name, toolCall.input);
                  const durationMs = Date.now() - toolStartMs;
                  if (toolCall.name === "write_report") hasWrittenReport = true;

                  // Add step log: tool completed
                  if (plan.length > 0) {
                    const resultLog = toolCall.name === "web_search"
                      ? `Found ${((toolResult as any).results || []).length} results`
                      : toolCall.name === "browse_url"
                      ? `Extracted content (${((toolResult as any).content || "").length > 1000 ? "detailed" : "brief"})`
                      : toolCall.name === "write_report"
                      ? `Report complete (${(toolResult as any).word_count || 0} words)`
                      : `Complete`;
                    addStepLog(currentStepIdx, resultLog, "result");
                  }

                  // Emit tool result event
                  controller.enqueue(encoder.encode(`event: tool\ndata: ${JSON.stringify({
                    name: toolCall.name,
                    args: toolCall.input,
                    result: toolResult,
                    duration: durationMs,
                    status: "complete",
                  })}\n\n`));

                  // Emit specialized events for Computer Panel
                  const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
                  const elapsedStr = `${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(2, '0')}`;

                  if (toolCall.name === "web_search") {
                    // Enrich search results with favicon URLs and domain
                    const rawResults = (toolResult as any).results || [];
                    const enrichedResults = rawResults.map((r: any) => {
                      let domain = "";
                      try { domain = new URL(r.url).hostname.replace("www.", ""); } catch {}
                      return {
                        title: r.title || "",
                        url: r.url || "",
                        snippet: r.snippet || r.description || "",
                        domain,
                        favicon: domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : "",
                      };
                    });
                    controller.enqueue(encoder.encode(`event: search\ndata: ${JSON.stringify({
                      query: toolCall.input.query,
                      results: enrichedResults,
                      elapsed: elapsedStr,
                    })}\n\n`));
                  } else if (toolCall.name === "browse_url") {
                    // Parse content into structured BrowserSections for BrowserView
                    const rawContent = ((toolResult as any).content || "").substring(0, 10000);
                    const pageTitle = (toolResult as any).title || "";
                    let domain = "";
                    try { domain = new URL(toolCall.input.url).hostname.replace("www.", ""); } catch {}

                    // Split content into sections by headings/paragraphs
                    const sections: Array<{type: string; content: string; items?: string[]; tableHeaders?: string[]; tableRows?: string[][]}> = [];
                    const lines = rawContent.split('\n').filter((l: string) => l.trim());

                    let currentText = "";
                    for (const line of lines) {
                      const trimmed = line.trim();
                      // Detect markdown tables
                      if (trimmed.includes('|') && trimmed.startsWith('|')) {
                        if (currentText) { sections.push({ type: "text", content: currentText.trim() }); currentText = ""; }
                        // Collect table lines
                        const tableLines = [trimmed];
                        const idx = lines.indexOf(line);
                        for (let j = idx + 1; j < lines.length && lines[j].trim().startsWith('|'); j++) {
                          tableLines.push(lines[j].trim());
                        }
                        if (tableLines.length >= 2) {
                          const headers = tableLines[0].split('|').map(h => h.trim()).filter(Boolean);
                          const dataRows = tableLines.slice(2).map(r => r.split('|').map(c => c.trim()).filter(Boolean));
                          if (headers.length > 0) sections.push({ type: "table", content: "", tableHeaders: headers, tableRows: dataRows });
                        }
                      }
                      // Detect lists
                      else if (trimmed.match(/^[-•*]\s/) || trimmed.match(/^\d+\.\s/)) {
                        if (currentText) { sections.push({ type: "text", content: currentText.trim() }); currentText = ""; }
                        const items = [trimmed.replace(/^[-•*\d.]+\s*/, '')];
                        const idx = lines.indexOf(line);
                        for (let j = idx + 1; j < lines.length; j++) {
                          const nextTrimmed = lines[j].trim();
                          if (nextTrimmed.match(/^[-•*]\s/) || nextTrimmed.match(/^\d+\.\s/)) {
                            items.push(nextTrimmed.replace(/^[-•*\d.]+\s*/, ''));
                          } else break;
                        }
                        sections.push({ type: "list", content: "", items });
                      }
                      // Detect headings as nav/hero
                      else if (trimmed.startsWith('#')) {
                        if (currentText) { sections.push({ type: "text", content: currentText.trim() }); currentText = ""; }
                        sections.push({ type: "hero", content: trimmed.replace(/^#+\s*/, '') });
                      }
                      else {
                        currentText += trimmed + "\n\n";
                        // Flush every ~500 chars into a text section
                        if (currentText.length > 500) {
                          sections.push({ type: "text", content: currentText.trim() });
                          currentText = "";
                        }
                      }
                    }
                    if (currentText.trim()) sections.push({ type: "text", content: currentText.trim() });

                    // Ensure at least one section
                    if (sections.length === 0) sections.push({ type: "text", content: rawContent.substring(0, 3000) });

                    controller.enqueue(encoder.encode(`event: browse\ndata: ${JSON.stringify({
                      url: toolCall.input.url,
                      title: pageTitle,
                      domain,
                      favicon: domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : "",
                      content: rawContent.substring(0, 5000),
                      sections,
                      elapsed: elapsedStr,
                      durationMs,
                    })}\n\n`));
                  } else if (toolCall.name === "write_report") {
                    // Emit report event so Computer Panel Document tab renders the content
                    const reportContent = (toolResult as any).content || "";
                    lastReportContent = reportContent;
                    const reportFormat = (toolResult as any).format || "markdown";

                    // Extract first markdown table for the report card in chat
                    let tableHeaders: string[] = [];
                    let tableRows: string[][] = [];
                    const reportLines = reportContent.split('\n');
                    for (let li = 0; li < reportLines.length; li++) {
                      const line = reportLines[li].trim();
                      if (line.startsWith('|') && line.endsWith('|')) {
                        // Found a potential table header
                        const nextLine = (reportLines[li + 1] || "").trim();
                        if (nextLine.match(/^\|[\s\-:|]+\|$/)) {
                          // Confirmed markdown table
                          tableHeaders = line.split('|').map((h: string) => h.trim()).filter(Boolean);
                          // Collect data rows
                          for (let ri = li + 2; ri < reportLines.length; ri++) {
                            const rowLine = reportLines[ri].trim();
                            if (!rowLine.startsWith('|') || !rowLine.endsWith('|')) break;
                            tableRows.push(rowLine.split('|').map((c: string) => c.trim()).filter(Boolean));
                          }
                          break; // Only first table
                        }
                      }
                    }

                    // Generate a summary from first paragraph (skip headings)
                    let reportSummary = "";
                    for (const line of reportLines) {
                      const trimmed = line.trim();
                      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('|') && !trimmed.startsWith('---')) {
                        reportSummary = trimmed.substring(0, 300);
                        break;
                      }
                    }

                    controller.enqueue(encoder.encode(`event: report\ndata: ${JSON.stringify({
                      title: toolCall.input.topic || "Report",
                      content: reportContent,
                      format: reportFormat,
                      word_count: (toolResult as any).word_count || 0,
                      summary: reportSummary || reportContent.substring(0, 200),
                      headers: tableHeaders,
                      rows: tableRows.slice(0, 10), // Max 10 rows in card
                    })}\n\n`));
                  } else if (toolCall.name === "generate_code" || toolCall.name === "review_code") {
                    // Emit code event for Computer Panel Code tab
                    controller.enqueue(encoder.encode(`event: code\ndata: ${JSON.stringify({
                      name: toolCall.name,
                      result: toolResult,
                    })}\n\n`));
                  }

                  // Add assistant response with tool_use to conversation
                  loopMessages.push({
                    role: "assistant",
                    content: [
                      ...(result.textContent ? [{ type: "text", text: result.textContent }] : []),
                      { type: "tool_use", id: toolCall.id, name: toolCall.name, input: toolCall.input },
                    ],
                  });
                  // Add tool result
                  loopMessages.push({
                    role: "user",
                    content: [{ type: "tool_result", tool_use_id: toolCall.id, content: JSON.stringify(toolResult) }],
                  });

                  // Update step progress — use accumulated logs
                  if (plan.length > 0) {
                    const stepIdx = Math.min(toolIterations - 1, plan.length - 1);
                    if (!completedSteps.has(stepIdx)) {
                      completedSteps.add(stepIdx);
                      // Complete step with all accumulated logs
                      const logs = stepLogs.get(stepIdx) || [];
                      logs.push({ time: getElapsed(), text: plan[stepIdx].detail, type: "result" });
                      stepLogs.set(stepIdx, logs);
                      controller.enqueue(encoder.encode(`event: step\ndata: ${JSON.stringify({
                        id: stepIdx + 1,
                        label: plan[stepIdx].label,
                        detail: plan[stepIdx].detail,
                        status: "complete",
                        logs,
                      })}\n\n`));

                      // Activate next step if exists
                      if (stepIdx + 1 < plan.length) {
                        const nextLogs = [{ time: getElapsed(), text: "Starting...", type: "info" }];
                        stepLogs.set(stepIdx + 1, nextLogs);
                        controller.enqueue(encoder.encode(`event: step\ndata: ${JSON.stringify({
                          id: stepIdx + 2,
                          label: plan[stepIdx + 1].label,
                          detail: plan[stepIdx + 1].detail,
                          status: "active",
                          logs: nextLogs,
                        })}\n\n`));
                      }
                    }
                  }
                }
              }

              // Stream the final text response as token events with typewriter pacing
              if (finalTextContent) {
                const chunkSize = 12;
                for (let i = 0; i < finalTextContent.length; i += chunkSize) {
                  const chunk = finalTextContent.substring(i, i + chunkSize);
                  controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ token: chunk })}\n\n`));
                  fullResponse += chunk;
                  // Small delay for typewriter effect (15ms per chunk ≈ natural reading pace)
                  await new Promise(r => setTimeout(r, 15));
                }
              }

              // Emit collected sources with favicons for Perplexity-style display
              const allSources: Array<{title: string; url: string; favicon: string; domain: string}> = [];
              const seenUrls = new Set<string>();

              const addSource = (url: string, title?: string) => {
                try {
                  if (!url || seenUrls.has(url)) return;
                  seenUrls.add(url);
                  const domain = new URL(url).hostname.replace("www.", "");
                  allSources.push({
                    title: title || domain,
                    url,
                    favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
                    domain,
                  });
                } catch {}
              };

              for (const msg of loopMessages) {
                if (Array.isArray(msg.content)) {
                  for (const block of msg.content) {
                    if (block.type === "tool_result") {
                      try {
                        // Handle both string and object content
                        const data = typeof block.content === "string" ? JSON.parse(block.content) : block.content;
                        // Extract sources from web_search results
                        if (data.results && Array.isArray(data.results)) {
                          for (const r of data.results) {
                            addSource(r.url, r.title);
                          }
                        }
                        // Extract sources from browse_url results
                        if (data.url) {
                          addSource(data.url, data.title);
                        }
                      } catch {}
                    }
                  }
                }
              }
              // Mark ALL remaining steps as complete (fixes stuck spinners)
              for (let i = 0; i < plan.length; i++) {
                if (!completedSteps.has(i)) {
                  completedSteps.add(i);
                  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
                  const mins = Math.floor(Number(elapsed) / 60);
                  const secs = Number(elapsed) % 60;
                  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;
                  controller.enqueue(encoder.encode(`event: step\ndata: ${JSON.stringify({
                    id: i + 1,
                    label: plan[i].label,
                    detail: plan[i].detail,
                    status: "complete",
                    logs: [{ time: timeStr, text: plan[i].detail || "Complete", type: "result" }],
                  })}\n\n`));
                }
              }

              if (allSources.length > 0) {
                controller.enqueue(encoder.encode(`event: sources\ndata: ${JSON.stringify({
                  sources: allSources.slice(0, 10),
                })}\n\n`));
              }
            } catch (toolLoopError) {
              // Tool loop failed — fall back to normal streaming
              console.error("ReAct tool loop error, falling back to streaming:", toolLoopError);
              const reader = providerStream.getReader();
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split("\n");
                for (const line of lines) {
                  if (line.startsWith("data: ") && !line.includes('"error"')) {
                    try {
                      const parsed = JSON.parse(line.slice(6));
                      if (parsed.token) fullResponse += parsed.token;
                    } catch { /* skip */ }
                  }
                }
                controller.enqueue(value);
              }
            }
          } else {
            // ===== Direct mode OR non-Anthropic agentic: use standard streaming =====
            const reader = providerStream.getReader();

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split("\n");

              // Filter out XML tool call leaks per-token (don't block entire stream)
              let hasCleanTokens = false;
              for (const line of lines) {
                if (line.startsWith("data: ") && !line.includes('"error"')) {
                  try {
                    const parsed = JSON.parse(line.slice(6));
                    if (parsed.token) {
                      // Skip individual tokens that contain XML tool call patterns
                      const isXml = parsed.token.includes("<function_calls>") || parsed.token.includes("<invoke") ||
                        parsed.token.includes("</function_calls>") || parsed.token.includes("</invoke>") ||
                        parsed.token.includes('<parameter name=');
                      if (!isXml) {
                        fullResponse += parsed.token;
                        hasCleanTokens = true;
                      }
                    }
                  } catch { /* skip */ }
                }
              }

              // Forward clean chunks, rebuild SSE for filtered ones
              if (hasCleanTokens) {
                // Rebuild the SSE data without XML tokens
                const cleanLines = lines.filter(line => {
                  if (!line.startsWith("data: ")) return true;
                  try {
                    const parsed = JSON.parse(line.slice(6));
                    if (parsed.token) {
                      return !(parsed.token.includes("<function_calls>") || parsed.token.includes("<invoke") ||
                        parsed.token.includes("</function_calls>") || parsed.token.includes("</invoke>") ||
                        parsed.token.includes('<parameter name='));
                    }
                  } catch {}
                  return true;
                });
                const cleanChunk = cleanLines.join("\n");
                if (cleanChunk.trim()) {
                  controller.enqueue(new TextEncoder().encode(cleanChunk + "\n"));
                }
              }

              // Update step progress based on response length (only in agentic mode)
              if (taskMode === "agentic" && plan.length > 0) {
                const progress = fullResponse.length;
                const thresholds = plan.map((_, i) => Math.floor((i + 1) * (1500 / plan.length)));
                for (let i = 0; i < plan.length; i++) {
                  if (progress > thresholds[i] && !completedSteps.has(i)) {
                    completedSteps.add(i);
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
                        logs: [{ time: timeStr, text: plan[i].detail, type: "result" }],
                      })}\n\n`)
                    );
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
            }
          }

          // Complete all remaining steps (only in agentic mode)
          if (taskMode === "agentic" && plan.length > 0) {
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

            // Check if response has table-like data (markdown tables) — only for agentic
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
          }

          // Save the complete assistant message (with report metadata if available)
          if (fullResponse) {
            const messageData: any = {
              conversation_id: conversationId,
              role: "assistant",
              content: fullResponse,
            };
            // Persist report card data so it survives page reload
            if (lastReportContent) {
              // Extract table from report for the card
              let rptHeaders: string[] = [];
              let rptRows: string[][] = [];
              const rptLines = lastReportContent.split('\n');
              for (let li = 0; li < rptLines.length; li++) {
                const line = rptLines[li].trim();
                if (line.startsWith('|') && line.endsWith('|')) {
                  const nextLine = (rptLines[li + 1] || "").trim();
                  if (nextLine.match(/^\|[\s\-:|]+\|$/)) {
                    rptHeaders = line.split('|').map((h: string) => h.trim()).filter(Boolean);
                    for (let ri = li + 2; ri < rptLines.length; ri++) {
                      const rowLine = rptLines[ri].trim();
                      if (!rowLine.startsWith('|') || !rowLine.endsWith('|')) break;
                      rptRows.push(rowLine.split('|').map((c: string) => c.trim()).filter(Boolean));
                    }
                    break;
                  }
                }
              }
              messageData.metadata = {
                hasReport: true,
                reportTitle: plan[plan.length - 1]?.label || "Report",
                reportSummary: lastReportContent.split('\n').find((l: string) => l.trim() && !l.startsWith('#') && !l.startsWith('|'))?.substring(0, 300) || "",
                tableData: rptHeaders.length > 0 ? { headers: rptHeaders, rows: rptRows.slice(0, 10) } : undefined,
              };
            }
            await supabase.from("messages").insert(messageData);

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

            // Save steps to database — only for agentic mode
            if (taskMode === "agentic" && plan.length > 0) {
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
            }

            // Run title + follow-ups IN PARALLEL with a 8s timeout
            // (agentic flow already uses 30-40s of the 60s edge function limit)
            const postTasks: Promise<void>[] = [];

            // Auto-title task
            const { data: conv } = await supabase
              .from("conversations")
              .select("auto_titled")
              .eq("id", conversationId)
              .single();

            if (conv && !conv.auto_titled) {
              postTasks.push(
                fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/auto-title`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: authHeader! },
                  body: JSON.stringify({ conversationId, userMessage: message, assistantMessage: fullResponse.slice(0, 300) }),
                }).then(async (r) => {
                  if (r.ok) {
                    const { title } = await r.json();
                    if (title) controller.enqueue(encoder.encode(`event: title\ndata: ${JSON.stringify({ title })}\n\n`));
                  }
                }).catch(() => {})
              );
            }

            // Wait for title with 5s timeout
            if (postTasks.length > 0) {
              await Promise.race([
                Promise.allSettled(postTasks),
                new Promise(resolve => setTimeout(resolve, 5000)),
              ]);
            }
          }

          // Extract memories in the background (fire-and-forget)
          if (fullResponse) {
            extractMemories(actualProviderId, apiKey!, message, fullResponse, user.id, supabase).catch(() => {});
          }

          // Follow-ups MUST come before done (frontend exits stream loop on done)
          {
            let followUpItems: Array<{text: string; category: string}> = [];

            if (fullResponse || lastReportContent) {
              try {
                console.log("[followups] Starting generation, fullResponse length:", fullResponse.length, "reportContent length:", (lastReportContent || "").length);
                const followUps = await Promise.race([
                  generateFollowUps(actualProviderId, apiKey!, message, fullResponse || "No response yet", lastReportContent || undefined),
                  new Promise<string[]>(resolve => setTimeout(() => { console.log("[followups] Timed out after 8s"); resolve([]); }, 8000)),
                ]) as string[];
                console.log("[followups] Got results:", JSON.stringify(followUps));
                if (followUps.length > 0) {
                  followUpItems = followUps.map(f => typeof f === 'string' ? { text: f, category: "default" } : f);
                }
              } catch (followUpErr) {
                console.error("[followups] Error:", followUpErr);
              }
            }

            // Fallback: generate context-aware follow-ups from the user's message
            if (followUpItems.length === 0) {
              console.log("[followups] Using fallback follow-ups");
              const topic = message.length > 80 ? message.substring(0, 80) : message;
              followUpItems = [
                { text: `Go deeper on the top trends mentioned`, category: "research" },
                { text: `Create a comparison table of the key findings`, category: "analysis" },
                { text: `What are the investment opportunities here?`, category: "research" },
                { text: `Summarize this into a presentation outline`, category: "create" },
              ];
            }

            if (followUpItems.length > 0) {
              controller.enqueue(encoder.encode(`event: followups\ndata: ${JSON.stringify({ followUps: followUpItems })}\n\n`));
              console.log("[followups] Emitted", followUpItems.length, "follow-ups");
            }
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
