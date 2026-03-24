// Supabase Edge Function: AI Chat Proxy
// Streams responses from multiple LLM providers, keeping API keys server-side

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveProvider, getFallbackChain } from "../_shared/provider-registry.ts";
import { selectOptimalModel } from "../_shared/smart-router.ts";
import { checkUsageGate } from "../_shared/usage-gate.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { streamAnthropic, callAnthropicWithTools } from "../_shared/providers/anthropic.ts";
import { getToolDefinitions, executeTool } from "../_shared/agent-tools.ts";
import { planTask, evaluateOutput, getResearcherSystemPrompt } from "../_shared/agents.ts";
import { streamOpenAI } from "../_shared/providers/openai.ts";
import { streamGemini } from "../_shared/providers/gemini.ts";
import { streamTogether } from "../_shared/providers/together.ts";
import { getRelevantMemories, injectMemoryContext, extractMemories } from "../_shared/memory-manager.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ===== TASK-SPECIFIC SYSTEM PROMPTS =====
// Each task type gets its own optimized prompt for maximum quality

const RESEARCH_PROMPT = `You are Vyroo, an elite research analyst at a top-tier consulting firm. You deliver research that would satisfy a Fortune 500 CEO.

## Your Process (STRICT ORDER)
1. **Search 3-4 different queries** — vary angles (market size, competitors, trends, growth rates)
2. **ALWAYS browse the top 2-3 sources** — NEVER rely on search snippets alone. You MUST call browse_url after every web_search to read the actual page content. Search snippets are insufficient.
3. **Extract ONLY verified data** — numbers, revenue, growth rates, funding rounds you actually found in sources
4. **Save intermediate findings** — use save_to_workspace to persist research data as you go
5. **Synthesize into write_report** — pass ALL findings with source attribution

## Information Priority (STRICT HIERARCHY)
1. API data (structured, verified) — highest priority
2. Browsed web pages (real content from authoritative sources) — second priority
3. Search snippets — NEVER sufficient alone, always browse the source
4. Model knowledge — LOWEST priority, use only when no data found online and label as "based on training data"

## CRITICAL: Data Integrity Rules
- ONLY include facts and numbers you ACTUALLY found in your web searches and browsed pages
- NEVER fabricate statistics, revenue figures, or growth percentages
- If you couldn't find specific data, say "data not publicly available" — don't make up numbers
- Clearly distinguish between: verified data (from sources) vs. estimates (your analysis)

## Tool Chain: web_search → browse_url → save_to_workspace → write_report
- ALWAYS browse after searching — snippets are insufficient
- Save intermediate findings with save_to_workspace for complex research
- ALWAYS end with write_report
- If you need clarification from the user, use ask_user (e.g., "Which specific brands should I focus on?")

## Writing Style (MANDATORY)
- Write in continuous, flowing paragraphs with varied sentence lengths
- AVOID bullet point lists in the report body — use them ONLY for data tables and quick comparisons
- Each paragraph should flow naturally into the next with clear transitions
- Think like a McKinsey consultant writing a board-ready memo, not a chatbot making lists
- Executive summaries should be 2-3 sentences of impactful prose, not bullet points

## RESPONSE FORMAT (MANDATORY)
- During research: do NOT output any text — just use tools silently
- After write_report completes: output ONLY a 1-2 sentence summary of key findings
- Your text response should NEVER exceed 3 sentences after tool execution
- NEVER explain your tool choices or reasoning process — just deliver results`;

const PRESENTATION_PROMPT = `You are Vyroo, a professional presentation designer at McKinsey. You create stunning, data-driven slide decks that look like they cost $50,000.

## Your Process
1. If the user asks about a topic that needs research data: FIRST do web_search (2-3 queries) → browse_url (1-2 sources) to gather real data
2. Then call generate_presentation with ALL the real data you found
3. If no research needed (user provides data or it's a general topic): call generate_presentation immediately

## CRITICAL RULES
- ALWAYS call generate_presentation — NEVER call write_report for presentations
- Each slide MUST have: compelling title, key insight subtitle, 4-5 data-rich bullet points
- First slide = title slide with topic + badge. Last slide = key takeaways + next steps
- After generating, give ONLY 1 sentence: "Here is your X-slide presentation about Y."
- NEVER explain your reasoning or tool choices — just deliver

## Slide Quality Requirements (MANDATORY)
- EVERY bullet point MUST contain a specific number, $-figure, percentage, or named example
- BAD bullet: "The market is growing rapidly" → GOOD bullet: "Global market reached $24.6B in 2024, growing at 8.2% CAGR"
- BAD title: "Market Overview" → GOOD title: "$24.6B Market Poised for 90% Growth by 2034"
- Include at minimum: market size, top 3 companies with revenue, growth rates, trends with data
- Slide structure: Title Slide → Market Overview → Key Players → Trends → Deep Dive 1 → Deep Dive 2 → Opportunities → Key Takeaways
- Each slide should have a "badge" (e.g., "Market Data", "Key Insight", "Growth Driver", "Trend Alert")
- Think like a $500/hr consultant — every slide must justify its existence with data`;

const CODE_PROMPT = `You are Vyroo, an expert software engineer. You write clean, production-ready code.

## Your Process
1. If requirements are unclear, use ask_user to clarify before coding
2. Call generate_code with complete, runnable code including error handling
3. Use execute_code to verify the code works (test with sample data)
4. Save the final code with save_to_workspace for persistence

## Writing Style
- Explain code decisions in flowing prose paragraphs, not bullet lists
- Code comments should be clear and concise
- README sections should read like professional documentation

## Quality Bar
- Production-ready code with error handling
- Type-safe (TypeScript preferred)
- Include imports and dependencies
- Add usage examples
- NEVER explain tool choices — just deliver the code`;

const ANALYSIS_PROMPT = `You are Vyroo, a senior data analyst. You analyze data, find patterns, and deliver actionable insights.

## Your Process
1. If data needs gathering: web_search → browse_url (ALWAYS browse, never rely on snippets) → save_to_workspace
2. If user has uploaded data: use read_workspace_file to access it, then execute_code for analysis
3. Use execute_code with utils (sum, avg, median, parseCSV) for calculations
4. Call write_report with tables, charts descriptions, and recommendations

## Information Priority
1. User-provided data (uploaded files) — highest
2. API data → browsed web pages → search snippets → model knowledge — lowest

## Writing Style
- Analysis narratives should flow as prose paragraphs with data woven in
- Use tables ONLY for structured comparisons — the rest should be narrative
- Each insight should be explained with context, not just stated as a bullet point

## Quality Bar
- Always include comparison tables with specific numbers
- Identify trends and patterns, not just list facts
- End with actionable recommendations in prose format
- NEVER explain tool choices`;

// Combined prompt used as fallback when task type is unclear
const SYSTEM_PROMPT = RESEARCH_PROMPT;

const DIRECT_SYSTEM_PROMPT = `You are Vyroo, a knowledgeable AI assistant. You give clear, authoritative answers.

## Response Style
- Lead with a direct answer in the first sentence — no preamble
- Write in flowing prose paragraphs, not bullet point lists
- Be specific: include numbers, names, dates, and concrete examples
- Use **bold** for key terms and important figures
- Keep answers concise but complete — 2-4 paragraphs for most questions
- For complex topics, use ## headings to organize sections
- Use tables only for structured comparisons (3+ items)

## Tone
- Confident and authoritative, like a knowledgeable colleague
- No hedging ("I think", "It seems", "It's worth noting") — just state facts
- Address the user by name if known

## Restrictions
- You do NOT have tools or web search in this mode — answer from knowledge
- NEVER output XML tags, function calls, or <function_calls>/<invoke> patterns
- NEVER output raw JSON or structured data objects
- Format everything as clean Markdown`;

const FOLLOWUP_PROMPT = `You are generating follow-up suggestions. Read the conversation and suggest 3-4 SPECIFIC next actions.

MANDATORY RULES:
1. Each suggestion MUST reference a specific brand, product, number, or topic from the response
2. Each suggestion MUST be an actionable task (create, compare, analyze, dive into, export)
3. NEVER use generic phrases like "tell me more", "explain further", "what else", "give examples"
4. Under 60 characters each

FORMAT: Return ONLY a JSON array of strings.

EXAMPLES based on a DTC vitamin research response mentioning Arrae, Ritual, and AG1:
["Create a pitch deck comparing Arrae vs Ritual","Deep dive into AG1's subscription model","Analyze Arrae's 3,233% growth strategy","Build a competitor pricing table"]

EXAMPLES based on a nutrition presentation:
["Add market size data to slide 3","Create speaker notes for all slides","Research AG1's influencer strategy","Export presentation as PDF"]`;

const PLAN_PROMPT = `Analyze the user's message and break the task into 3-5 concrete steps. Return ONLY a JSON array of objects with "label" and "detail" fields.

IMPORTANT: Step labels must be SPECIFIC to the user's actual task — never use generic labels like "Understanding task" or "Processing". Include the actual subject matter in each label.

Good labels: "Researching DTC skincare brands", "Comparing pricing strategies", "Building revenue projection table"
Bad labels: "Understanding task", "Processing data", "Delivering results"

Example for "Analyze top 5 DTC skincare brands":
[{"label":"Researching top DTC skincare brands","detail":"Searching for market data on The Ordinary, Glossier, Rhode, Dieux, and Drunk Elephant"},{"label":"Comparing pricing strategies","detail":"Building a pricing comparison table across product categories"},{"label":"Analyzing market positioning","detail":"Identifying each brand's unique positioning and target demographic"},{"label":"Compiling brand analysis report","detail":"Writing comprehensive comparison with tables and key insights"}]`;

const CLASSIFY_PROMPT = `Classify this user message into exactly ONE category. Return ONLY the single word.

Categories:
- "direct" — simple questions, greetings, follow-up clarifications, feedback
- "research" — research tasks, analysis, comparisons, "what are the top X", market research
- "presentation" — create slides, make a deck, presentation, ppt
- "code" — write code, build an app, fix a bug, programming tasks
- "analysis" — analyze data, compare options, create a table, financial analysis

Examples:
"What is 2+2?" → direct
"Hello" → direct
"Thanks!" → direct
"can you explain more?" → direct
"Research the top DTC brands" → research
"What are the hottest products in 2026?" → research
"Conduct deep research on nutrition trends" → research
"Create a presentation about DTC products" → presentation
"Make a deck about market trends" → presentation
"Generate slides for my pitch" → presentation
"Build a React component for authentication" → code
"Write a Python script to analyze CSV data" → code
"Analyze my sales data and find trends" → analysis
"Compare these 5 companies side by side" → analysis
"Create a comparison table" → analysis`;

// Map task type to the right system prompt
function getTaskPrompt(taskType: string): string {
  switch (taskType) {
    case "research": return RESEARCH_PROMPT;
    case "presentation": return PRESENTATION_PROMPT;
    case "code": return CODE_PROMPT;
    case "analysis": return ANALYSIS_PROMPT;
    default: return RESEARCH_PROMPT; // fallback
  }
}

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
  // Give follow-ups generator MORE context for specificity (3000 chars of report or 1000 of response)
  const contextText = reportContent ? reportContent.slice(0, 3000) : assistantResponse.slice(0, 1000);

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
type TaskType = "direct" | "research" | "presentation" | "code" | "analysis";

async function classifyTask(
  providerId: string,
  apiKey: string,
  userMessage: string
): Promise<TaskType> {
  // Very short messages (greetings, one-word) are direct — skip the LLM call
  if (userMessage.trim().length < 20) return "direct";

  // Quick keyword detection for presentations (most reliable, skip LLM)
  const lower = userMessage.toLowerCase();
  if (lower.includes("presentation") || lower.includes("slides") || lower.includes("deck") || lower.includes("ppt")) return "presentation";
  if (lower.includes("write code") || lower.includes("build a") || lower.includes("create a component") || lower.includes("script")) return "code";

  const fastModel = FAST_MODELS[providerId];
  if (!fastModel) return "research";

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
      if (!res.ok) return "research";
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
      if (!res.ok) return "research";
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
      if (!res.ok) return "research";
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
      if (!res.ok) return "research";
      const data = await res.json();
      text = data.choices?.[0]?.message?.content || "";
    }

    const classified = text.toLowerCase().trim();
    if (classified.includes("direct")) return "direct";
    if (classified.includes("presentation")) return "presentation";
    if (classified.includes("code")) return "code";
    if (classified.includes("analysis")) return "analysis";
    if (classified.includes("research")) return "research";
    // C1 FIX: Default to "direct" — safer and cheaper than triggering full agentic flow
    return "direct";
  } catch {
    // Classification failed — default to "direct" to avoid expensive agentic flow for simple messages
    return "direct";
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

    // Sanitize user message for prompt injection defense (H6)
    // Strip patterns that could manipulate system prompts
    const sanitizedMessage = message
      .replace(/\bsystem\s*:/gi, "System:") // Prevent "system:" role injection
      .replace(/\bignore\s+(previous|above|all)\s+(instructions?|prompts?|rules?)/gi, "[filtered]") // Common injection
      .replace(/\byou\s+are\s+now\b/gi, "[filtered]"); // Role override attempts

    // Insert user message (original, not sanitized — sanitized version used in prompts only)
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

    // Inject cross-conversation memory + RAG context into the system prompt
    let enrichedSystemPrompt = SYSTEM_PROMPT; // Will be replaced for direct mode after classification
    let lastReportContent = ""; // Track report content for follow-up generation
    let lastSlidesData: any = null; // Track slides data for persistence

    // RAG: Search past conversations for relevant context
    let ragContext = "";
    try {
      const openaiKey = Deno.env.get("OPENAI_API_KEY");
      if (openaiKey && message.length > 30) {
        const embRes = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({ model: "text-embedding-3-small", input: message }),
        });
        if (embRes.ok) {
          const embData = await embRes.json();
          const queryEmbedding = embData.data?.[0]?.embedding;
          if (queryEmbedding) {
            const { data: similar } = await supabase.rpc("search_similar_messages", {
              query_embedding: queryEmbedding,
              match_threshold: 0.75,
              match_count: 3,
              p_user_id: user.id,
            });
            if (similar && similar.length > 0) {
              const relevantParts = similar
                .filter((s: any) => s.conversation_id !== conversationId) // Only cross-conversation
                .map((s: any) => s.content.substring(0, 500));
              if (relevantParts.length > 0) {
                ragContext = `\n\n## Relevant Context from Past Research\n${relevantParts.join('\n---\n')}`;
                console.log(`[chat] RAG: Found ${relevantParts.length} relevant past messages`);
              }
            }
          }
        }
      }
    } catch { /* RAG is non-critical */ }

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
          const taskMode = await classifyTask(actualProviderId, apiKey!, sanitizedMessage);

          // === SKILLS SYSTEM: Load user's enabled skills and match to task ===
          let activeSkill: { id: string; name: string; system_prompt: string; tools: string[] } | null = null;
          try {
            // Get user's enabled skills with their definitions
            const { data: userSkills } = await supabase
              .from("user_skills")
              .select("skill_id, skills(id, name, system_prompt, tools, category)")
              .eq("user_id", user.id)
              .eq("enabled", true);

            if (userSkills && userSkills.length > 0) {
              // Find best matching skill for this task type
              const categoryMap: Record<string, string[]> = {
                research: ["research", "analysis"],
                analysis: ["analysis", "data", "research"],
                presentation: ["creative"],
                code: ["code"],
              };
              const relevantCategories = categoryMap[taskMode] || [];
              const matchedSkill = userSkills.find((us: any) =>
                us.skills && relevantCategories.includes(us.skills.category)
              );
              if (matchedSkill?.skills) {
                activeSkill = matchedSkill.skills as any;
                console.log(`[chat] Skill activated: ${activeSkill!.name} (${activeSkill!.id})`);
              }
            }
          } catch { /* skills are non-critical */ }

          // Select system prompt: skill prompt > task prompt > default
          if (taskMode === "direct") {
            enrichedSystemPrompt = DIRECT_SYSTEM_PROMPT;
          } else if (activeSkill?.system_prompt) {
            // Use skill-specific prompt (highest priority for agentic tasks)
            enrichedSystemPrompt = activeSkill.system_prompt;
            console.log(`[chat] Using skill prompt: ${activeSkill.name}`);
          } else {
            enrichedSystemPrompt = getTaskPrompt(taskMode);
            console.log(`[chat] Using ${taskMode} prompt (no skill matched)`);
          }

          // Load user's custom instructions from preferences
          try {
            const { data: prefs } = await supabase
              .from("user_preferences")
              .select("custom_instructions, nickname")
              .eq("user_id", user.id)
              .single();
            if (prefs?.custom_instructions) {
              enrichedSystemPrompt += `\n\n## User's Custom Instructions\n${prefs.custom_instructions}`;
            }
            if (prefs?.nickname) {
              enrichedSystemPrompt += `\nThe user's name is ${prefs.nickname}. Address them by name when appropriate.`;
            }
          } catch { /* preferences are non-critical */ }

          // Re-inject memory + RAG context for all modes
          try {
            const memories = await getRelevantMemories(user.id, message, supabase);
            const memorySection = injectMemoryContext(memories);
            if (memorySection) enrichedSystemPrompt += memorySection;
          } catch {}
          if (ragContext) enrichedSystemPrompt += ragContext;

          // Emit task mode so frontend knows whether to show steps UI
          // Frontend uses "direct" vs "agentic" — map our types
          const frontendMode = taskMode === "direct" ? "direct" : "agentic";
          controller.enqueue(
            encoder.encode(`event: mode\ndata: ${JSON.stringify({ mode: frontendMode })}\n\n`)
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

          // Multi-Agent: Use Planner Agent to create execution plan
          let agentPlan: Awaited<ReturnType<typeof planTask>> | null = null;
          if (taskMode !== "direct") {
            // Planner Agent creates structured plan with agent assignments
            const historyContext = messages.slice(-4).map(m => `${m.role}: ${m.content.substring(0, 200)}`).join('\n');
            agentPlan = await planTask(sanitizedMessage, historyContext);
            console.log(`[chat] Planner Agent: ${agentPlan.taskType}, ${agentPlan.steps.length} steps, research=${agentPlan.requiresResearch}`);

            // Override taskMode if planner disagrees with classifier
            if (agentPlan.taskType === "direct" && taskMode !== "direct") {
              taskMode = "direct" as any;
              controller.enqueue(encoder.encode(`event: mode\ndata: ${JSON.stringify({ mode: "direct" })}\n\n`));
            }

            // Generate step labels from planner output (or use legacy generatePlan as fallback)
            if (agentPlan.steps.length > 0) {
              plan = agentPlan.steps.map(s => ({ label: s.action, detail: s.detail }));
            } else {
              plan = await generatePlan(actualProviderId, apiKey!, sanitizedMessage);
            }
            startTime = Date.now();

            // File-based memory: Create/update todo.md for this task (Manus pattern)
            // This persists the task plan as a workspace file so the agent can reference it
            if (plan.length > 0) {
              try {
                const todoContent = `# Task: ${sanitizedMessage.substring(0, 100)}\n\n## Plan\n${plan.map((s, i) => `- [ ] ${s.label}: ${s.detail}`).join('\n')}\n\n## Findings\n(Research data will be saved here)\n`;
                const { data: existingTodo } = await supabase.from("workspace_files")
                  .select("id").eq("user_id", user.id).eq("conversation_id", conversationId).ilike("name", "todo.md").single();
                if (existingTodo) {
                  await supabase.from("workspace_files").update({ content: todoContent, updated_at: new Date().toISOString() }).eq("id", existingTodo.id);
                } else {
                  await supabase.from("workspace_files").insert({
                    user_id: user.id, conversation_id: conversationId,
                    name: "todo.md", type: "document", format: "markdown",
                    content: todoContent, size_bytes: todoContent.length,
                  });
                }
              } catch { /* todo.md is non-critical */ }
            }

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

            // Multi-Agent: Use agent-specific system prompt based on current phase
            // During research phase, use Researcher Agent prompt for better data gathering
            if (agentPlan.requiresResearch) {
              enrichedSystemPrompt = getResearcherSystemPrompt(taskMode);
              // Re-inject memory + RAG context
              try {
                const memories = await getRelevantMemories(user.id, message, supabase);
                const memorySection = injectMemoryContext(memories);
                if (memorySection) enrichedSystemPrompt += memorySection;
              } catch {}
              if (ragContext) enrichedSystemPrompt += ragContext;
              console.log(`[chat] Using Researcher Agent prompt for ${taskMode} task`);
            }
          }

          // For agentic tasks, ALWAYS use Anthropic Sonnet for reliable tool use
          // Other providers (Gemini, OpenAI) don't have a tool loop implementation
          let agenticModel = selectedModel;
          if (taskMode !== "direct" && actualProviderId !== "anthropic") {
            // Force switch to Anthropic for agentic tasks
            const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
            if (anthropicKey) {
              actualProviderId = "anthropic";
              apiKey = anthropicKey;
              agenticModel = "claude-sonnet-4-20250514";
              console.log(`[chat] Switching from ${selectedModel} to Anthropic Sonnet for agentic task (non-Anthropic provider can't do tool loops)`);
            }
          }
          if (taskMode !== "direct" && actualProviderId === "anthropic") {
            const budgetModels = ["claude-haiku-4-5-20251001", "claude-3-5-haiku-latest", "claude-3-haiku-20240307"];
            if (budgetModels.includes(selectedModel)) {
              agenticModel = "claude-sonnet-4-20250514";
              console.log(`[chat] Upgrading from ${selectedModel} to ${agenticModel} for agentic task`);
            }
          }

          if (taskMode !== "direct" && actualProviderId === "anthropic") {
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
              const TOOL_LOOP_TIMEOUT_MS = 50000; // 50s wall-clock limit (reserves 10s for response + follow-ups)
              const toolLoopStartMs = Date.now();
              let finalTextContent = "";
              let hasUsedTools = false;
              let hasWrittenReport = false;
              // Accumulated logs per step for rich step progress
              const stepLogs: Map<number, Array<{time: string; text: string; type: string}>> = new Map();
              let hasBrowsed = false; // Track if browse_url has been called (enforce browse-before-report)
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

              while (toolIterations < MAX_TOOL_ITERATIONS && (Date.now() - toolLoopStartMs) < TOOL_LOOP_TIMEOUT_MS) {
                toolIterations++;

                // Safeguard: after 5+ iterations, strongly push write_report
                let extraPrompt = enrichedSystemPrompt;
                if (toolIterations >= 5 && !hasWrittenReport && hasUsedTools) {
                  extraPrompt += "\n\nCRITICAL: You have gathered enough research data. You MUST call write_report NOW. Pass all gathered data as the 'data' parameter. Do NOT make more web_search or browse_url calls.";
                }
                // Enforce browse-before-report: if searched but never browsed, nudge to browse
                if (toolIterations >= 2 && hasUsedTools && !hasBrowsed && !hasWrittenReport) {
                  extraPrompt += "\n\nIMPORTANT: You have used web_search but have NOT yet browsed any source URLs. You MUST call browse_url on at least 2 of the search result URLs before calling write_report. Search snippets alone are insufficient — always read the actual page.";
                }

                const result = await callAnthropicWithTools(
                  apiKey!, loopMessages, agenticModel, anthropicTools, extraPrompt
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
                      apiKey!, loopMessages, agenticModel, anthropicTools,
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
                      apiKey!, loopMessages, agenticModel, anthropicTools,
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
                  const prevStepIdx = plan.length > 0 ? Math.min(toolIterations - 2, plan.length - 1) : -1;

                  // H1 FIX: Emit step status updates — mark previous complete, current active
                  if (plan.length > 0 && prevStepIdx >= 0 && prevStepIdx !== currentStepIdx) {
                    controller.enqueue(encoder.encode(`event: step\ndata: ${JSON.stringify({
                      id: prevStepIdx + 1, label: plan[prevStepIdx].label, detail: plan[prevStepIdx].detail,
                      status: "complete", logs: (stepLogs.get(prevStepIdx) || []).slice(-20),
                    })}\n\n`));
                    controller.enqueue(encoder.encode(`event: step\ndata: ${JSON.stringify({
                      id: currentStepIdx + 1, label: plan[currentStepIdx].label, detail: plan[currentStepIdx].detail,
                      status: "active", logs: [{ time: getElapsed(), text: "Starting...", type: "info" }],
                    })}\n\n`));
                  }

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

                  // Execute the tool with error recovery + per-tool timeout (C5)
                  const TOOL_TIMEOUTS: Record<string, number> = {
                    web_search: 10000, browse_url: 15000, write_report: 20000,
                    generate_presentation: 20000, generate_code: 15000,
                    execute_code: 10000, summarize: 10000,
                  };
                  const toolTimeout = TOOL_TIMEOUTS[toolCall.name] || 15000;
                  let toolResult: any;
                  let durationMs: number;
                  try {
                    toolResult = await Promise.race([
                      executeTool(toolCall.name, toolCall.input),
                      new Promise((_, reject) => setTimeout(() => reject(new Error(`Tool ${toolCall.name} timed out after ${toolTimeout/1000}s`)), toolTimeout)),
                    ]);
                    durationMs = Date.now() - toolStartMs;
                  } catch (toolError) {
                    durationMs = Date.now() - toolStartMs;
                    // Error recovery: keep the error in context so the model can adapt
                    toolResult = { error: `Tool ${toolCall.name} failed: ${String(toolError)}` };
                    console.warn(`[chat] Tool ${toolCall.name} failed, keeping error in context for recovery:`, toolError);
                    addStepLog(currentStepIdx, `${toolCall.name} failed, adapting approach...`, "action");
                  }
                  if (toolCall.name === "write_report") hasWrittenReport = true;
                  if (toolCall.name === "browse_url") hasBrowsed = true;

                  // Handle workspace file reads (needs Supabase auth context)
                  if (toolCall.name === "read_workspace_file" && (toolResult as any)?.type === "workspace_file_request") {
                    const req = toolResult as any;
                    try {
                      let query = supabase.from("workspace_files").select("name, type, content, size_bytes").eq("user_id", user.id);
                      if (req.file_id) {
                        query = query.eq("id", req.file_id);
                      } else if (req.file_name) {
                        query = query.ilike("name", `%${req.file_name}%`);
                      }
                      const { data: files } = await query.limit(1).single();
                      if (files) {
                        toolResult = { name: files.name, type: files.type, content: files.content?.substring(0, 10000), size_bytes: files.size_bytes };
                        addStepLog(currentStepIdx, `Read file: ${files.name} (${files.size_bytes} bytes)`, "result");
                      } else {
                        toolResult = { error: "File not found in workspace" };
                      }
                    } catch {
                      toolResult = { error: "Could not access workspace files" };
                    }
                  }

                  // Handle ask_user — emit approval_required event and pause tool loop
                  if (toolCall.name === "ask_user" && (toolResult as any)?.type === "ask_user") {
                    const askData = toolResult as any;
                    controller.enqueue(encoder.encode(`event: approval_required\ndata: ${JSON.stringify({
                      approval_id: `ask-${Date.now()}`,
                      tool_name: "ask_user",
                      tool_description: askData.question,
                      args: { question: askData.question, options: askData.options },
                    })}\n\n`));
                    addStepLog(currentStepIdx, `Asking user: ${askData.question}`, "action");
                    // The tool result tells the model to wait — it will see "Waiting for user response"
                  }

                  // Handle save_to_workspace — save content to workspace_files
                  if (toolCall.name === "save_to_workspace" && (toolResult as any)?.type === "save_to_workspace") {
                    const saveData = toolResult as any;
                    try {
                      if (saveData.append) {
                        // Append to existing file
                        const { data: existing } = await supabase.from("workspace_files")
                          .select("id, content").eq("user_id", user.id).ilike("name", saveData.file_name).single();
                        if (existing) {
                          await supabase.from("workspace_files").update({
                            content: (existing.content || "") + "\n" + saveData.content,
                            size_bytes: ((existing.content || "").length + saveData.content.length),
                            updated_at: new Date().toISOString(),
                          }).eq("id", existing.id);
                          toolResult = { success: true, action: "appended", file: saveData.file_name };
                        } else {
                          // File doesn't exist, create it
                          await supabase.from("workspace_files").insert({
                            user_id: user.id, conversation_id: conversationId,
                            name: saveData.file_name, type: "document", format: "markdown",
                            content: saveData.content, size_bytes: saveData.content.length,
                          });
                          toolResult = { success: true, action: "created", file: saveData.file_name };
                        }
                      } else {
                        // Overwrite or create
                        const { data: existing } = await supabase.from("workspace_files")
                          .select("id").eq("user_id", user.id).ilike("name", saveData.file_name).single();
                        if (existing) {
                          await supabase.from("workspace_files").update({
                            content: saveData.content, size_bytes: saveData.content.length,
                            updated_at: new Date().toISOString(),
                          }).eq("id", existing.id);
                          toolResult = { success: true, action: "updated", file: saveData.file_name };
                        } else {
                          await supabase.from("workspace_files").insert({
                            user_id: user.id, conversation_id: conversationId,
                            name: saveData.file_name, type: "document", format: "markdown",
                            content: saveData.content, size_bytes: saveData.content.length,
                          });
                          toolResult = { success: true, action: "created", file: saveData.file_name };
                        }
                      }
                      addStepLog(currentStepIdx, `Saved ${saveData.file_name} to workspace`, "result");
                    } catch {
                      toolResult = { error: "Could not save to workspace" };
                    }
                  }

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

                  // Emit tool result event (truncate large results like slides/reports)
                  const truncatedResult = toolCall.name === "generate_presentation"
                    ? { type: "presentation", slideCount: (toolResult as any)?.slides?.length || 0 }
                    : toolCall.name === "write_report"
                    ? { summary: ((toolResult as any)?.content || "").substring(0, 200) }
                    : toolResult;
                  controller.enqueue(encoder.encode(`event: tool\ndata: ${JSON.stringify({
                    name: toolCall.name,
                    args: toolCall.input,
                    result: truncatedResult,
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
                  } else if (toolCall.name === "generate_presentation") {
                    // Emit slides event for Computer Panel Slides tab + chat inline cards
                    // Handle both object and string results
                    let slidesResult = toolResult as any;
                    if (typeof slidesResult === "string") {
                      try { slidesResult = JSON.parse(slidesResult); } catch {}
                    }
                    console.log("[chat] generate_presentation type:", typeof toolResult, "keys:", Object.keys(slidesResult || {}));
                    const slidesData = slidesResult?.slides || [];
                    const presTitle = slidesResult?.title || toolCall.input?.topic || "Presentation";
                    console.log(`[chat] Slides: ${slidesData.length} slides, title: ${presTitle}`);
                    // Save for persistence
                    lastSlidesData = { title: presTitle, slides: slidesData, slideCount: slidesData.length };
                    // Emit slides event
                    controller.enqueue(encoder.encode(`event: slides\ndata: ${JSON.stringify(lastSlidesData)}\n\n`));
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

              // ===== EVALUATOR AGENT (Multi-Agent) =====
              // Runs on ALL agentic responses, not just reports (H4 fix)
              if (finalTextContent && hasUsedTools) {
                try {
                  const outputToEvaluate = lastReportContent
                    ? `Report:\n${lastReportContent.substring(0, 4000)}`
                    : lastSlidesData
                    ? `Slides:\n${JSON.stringify(lastSlidesData.slides?.slice(0, 4)).substring(0, 2000)}`
                    : `Response:\n${finalTextContent.substring(0, 2000)}`;

                  const evalResult = await evaluateOutput(message, outputToEvaluate, taskMode || "research");
                  console.log(`[chat] Evaluator Agent: score=${evalResult.score}/10, improved=${evalResult.improved}`);

                  if (evalResult.improved && evalResult.content && evalResult.score !== undefined && evalResult.score < 8) {
                    finalTextContent = evalResult.content;
                    console.log("[chat] Evaluator Agent improved the summary");
                  }
                } catch (evalError) {
                  console.warn("[chat] Evaluator Agent failed (non-critical):", evalError);
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
            // Stateful XML leak buffer — catches tokens split across chunks (C2 fix)
            let xmlBuffer = "";
            const XML_PATTERNS = ["<function_calls>", "</function_calls>", "<invoke", "</invoke>", '<parameter name=', "<"];
            const isXmlLeak = (text: string) => XML_PATTERNS.some(p => text.includes(p));
            const mightBeXmlStart = (text: string) => text.includes("<") && !text.includes(">") && text.length < 30;

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split("\n");

              // Filter out XML tool call leaks with stateful buffering
              let hasCleanTokens = false;
              for (const line of lines) {
                if (line.startsWith("data: ") && !line.includes('"error"')) {
                  try {
                    const parsed = JSON.parse(line.slice(6));
                    if (parsed.token) {
                      // Stateful buffer: if previous token started an XML tag, combine and check
                      if (xmlBuffer) {
                        xmlBuffer += parsed.token;
                        if (xmlBuffer.includes(">") || xmlBuffer.length > 50) {
                          // Tag is complete — check if it's an XML leak
                          if (!isXmlLeak(xmlBuffer)) {
                            fullResponse += xmlBuffer;
                            hasCleanTokens = true;
                          }
                          xmlBuffer = "";
                        }
                        continue; // Don't process this token normally
                      }
                      // Check if this token starts an incomplete XML tag
                      if (mightBeXmlStart(parsed.token)) {
                        xmlBuffer = parsed.token;
                        continue;
                      }
                      // Normal token — check for complete XML patterns
                      if (!isXmlLeak(parsed.token)) {
                        fullResponse += parsed.token;
                        hasCleanTokens = true;
                      }
                    }
                  } catch { /* skip */ }
                }
              }

              // Forward clean chunks, rebuild SSE for filtered ones
              if (hasCleanTokens) {
                const cleanLines = lines.filter(line => {
                  if (!line.startsWith("data: ")) return true;
                  try {
                    const parsed = JSON.parse(line.slice(6));
                    if (parsed.token) return !isXmlLeak(parsed.token);
                  } catch {}
                  return true;
                });
                const cleanChunk = cleanLines.join("\n");
                if (cleanChunk.trim()) {
                  controller.enqueue(new TextEncoder().encode(cleanChunk + "\n"));
                }
              }

              // Update step progress based on response length (only in agentic mode)
              if (taskMode !== "direct" && plan.length > 0) {
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
          if (taskMode !== "direct" && plan.length > 0) {
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
                reportContent: lastReportContent.substring(0, 15000), // Full report for Document tab persistence
                tableData: rptHeaders.length > 0 ? { headers: rptHeaders, rows: rptRows.slice(0, 10) } : undefined,
                slidesData: lastSlidesData || undefined, // Slides for Slides tab persistence
              };
            }
            const { data: insertedMsg } = await supabase.from("messages").insert(messageData).select("id").single();

            // Generate embedding for RAG search (async, non-blocking)
            if (insertedMsg?.id && (fullResponse || lastReportContent)) {
              const textToEmbed = (lastReportContent || fullResponse).substring(0, 8000);
              try {
                const embRes = await fetch("https://api.openai.com/v1/embeddings", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
                  body: JSON.stringify({ model: "text-embedding-3-small", input: textToEmbed }),
                });
                if (embRes.ok) {
                  const embData = await embRes.json();
                  const embedding = embData.data?.[0]?.embedding;
                  if (embedding) {
                    await supabase.from("messages").update({ embedding }).eq("id", insertedMsg.id);
                    console.log("[chat] Embedding stored for RAG search");
                  }
                }
              } catch { /* embedding is non-critical */ }
            }

            // Save generated content as workspace file for persistent access
            try {
              if (lastReportContent) {
                const reportTitle = messageData.metadata?.reportTitle || "Research Report";
                await supabase.from("workspace_files").insert({
                  user_id: user.id,
                  conversation_id: conversationId,
                  name: reportTitle,
                  type: "document",
                  format: "markdown",
                  content: lastReportContent,
                  metadata: { tableData: messageData.metadata?.tableData },
                  size_bytes: lastReportContent.length,
                });
                console.log("[chat] Saved report as workspace file");
              }
              if (lastSlidesData?.slides?.length > 0) {
                await supabase.from("workspace_files").insert({
                  user_id: user.id,
                  conversation_id: conversationId,
                  name: lastSlidesData.title || "Presentation",
                  type: "presentation",
                  format: "json",
                  content: JSON.stringify(lastSlidesData),
                  metadata: lastSlidesData,
                  size_bytes: JSON.stringify(lastSlidesData).length,
                });
                console.log("[chat] Saved presentation as workspace file");
              }
            } catch { /* workspace save is non-critical */ }

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
            if (taskMode !== "direct" && plan.length > 0) {
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
              // Set conversation icon based on task type
              const iconMap: Record<string, string> = {
                research: "🔍", presentation: "📊", code: "💻",
                analysis: "📈", website: "🌐", direct: "💬",
              };
              const taskIcon = iconMap[taskMode || "direct"] || "💬";
              const taskTypeLabel = taskMode === "direct" ? "intelligence" : taskMode === "presentation" ? "research" : (taskMode || "intelligence");
              supabase.from("conversations").update({ icon: taskIcon, type: taskTypeLabel }).eq("id", conversationId).then(() => {});

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

            // Try AI-generated follow-ups with tight timeout
            if (fullResponse || lastReportContent) {
              try {
                const followUps = await Promise.race([
                  generateFollowUps(actualProviderId, apiKey!, message, fullResponse || "No response yet", lastReportContent || undefined),
                  new Promise<string[]>(resolve => setTimeout(() => resolve([]), 10000)),
                ]) as string[];
                if (followUps.length > 0) {
                  followUpItems = followUps.map(f => typeof f === 'string' ? { text: f, category: "default" } : f);
                }
              } catch { /* non-critical */ }
            }

            // Smart fallback — extract REAL topic from user's message for specific follow-ups
            if (followUpItems.length === 0) {
              const hasReport = !!lastReportContent;
              const topic = message.replace(/^(can you |please |could you |help me |I want to |I need to |research |analyze |find |search for |look into )/gi, '').split(/[.!?]/)[0].trim().substring(0, 60);
              // Extract brand/product names from report if available
              const reportFirstLine = lastReportContent ? lastReportContent.split('\n').find((l: string) => l.trim() && !l.startsWith('#'))?.substring(0, 100) || "" : "";
              followUpItems = hasReport ? [
                { text: `Create a presentation about ${topic}`, category: "create" },
                { text: `Compare pricing strategies for ${topic}`, category: "analysis" },
                { text: `Analyze growth opportunities in ${topic}`, category: "research" },
                { text: `Build a competitive matrix for ${topic}`, category: "analysis" },
              ] : [
                { text: `Research ${topic} in more depth`, category: "research" },
                { text: `Compare the top players in ${topic}`, category: "analysis" },
                { text: `Create a report about ${topic}`, category: "create" },
                { text: `What are the latest trends in ${topic}?`, category: "research" },
              ];
              // Truncate any overly long follow-ups
              followUpItems = followUpItems.map(f => ({ ...f, text: f.text.length > 70 ? f.text.substring(0, 67) + "..." : f.text }));
            }

            controller.enqueue(encoder.encode(`event: followups\ndata: ${JSON.stringify({ followUps: followUpItems })}\n\n`));
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
