// Memory Manager: cross-conversation memory extraction and retrieval
// Persists user facts, preferences, and context across conversations
// so the AI can recall them in future chats.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type SupabaseClient = ReturnType<typeof createClient>;

// ─── Types ───

export interface UserMemory {
  id: string;
  key: string;
  value: string;
  category: "preference" | "fact" | "context" | "instruction";
  created_at: string;
  updated_at: string;
}

// ─── Memory Extraction Prompt ───

const MEMORY_EXTRACTION_PROMPT = `Analyze the following conversation and extract key facts, preferences, or instructions the user has shared about themselves. Only extract information that would be useful to remember across future conversations.

Look for:
- User's name, role, company, or team
- Technical preferences (programming language, framework, tools, editor)
- Communication style preferences (brief vs detailed, formal vs casual)
- Recurring topics, projects, or domains they work in
- Explicit instructions ("always do X", "I prefer Y", "never do Z")
- Personal context (timezone, location, industry)

Return ONLY a JSON array of objects, each with:
- "key": a short unique identifier (snake_case, e.g. "preferred_language", "user_name")
- "value": the extracted information
- "category": one of "preference", "fact", "context", "instruction"

If there is nothing meaningful to extract, return an empty array [].
Keep each value concise (under 100 chars). Extract at most 5 items per conversation.

Example output:
[{"key":"user_name","value":"Alex","category":"fact"},{"key":"preferred_language","value":"TypeScript","category":"preference"}]`;

// ─── Fast model map (shared with chat function pattern) ───

const FAST_MODELS: Record<string, string> = {
  anthropic: "claude-3-5-haiku-latest",
  openai: "gpt-4o-mini",
  gemini: "gemini-2.0-flash",
  together: "meta-llama/Llama-3.1-8B-Instruct-Turbo",
};

// ─── Extract memories from a conversation ───

/**
 * Analyzes messages from a conversation and extracts memorable facts/preferences.
 * Uses a lightweight LLM call. Non-blocking — errors are silently ignored.
 */
export async function extractMemories(
  providerId: string,
  apiKey: string,
  userMessage: string,
  assistantResponse: string,
  userId: string,
  supabaseClient: SupabaseClient
): Promise<void> {
  const fastModel = FAST_MODELS[providerId];
  if (!fastModel) return;

  const conversationSnippet = `User: ${userMessage}\n\nAssistant: ${assistantResponse.slice(0, 500)}`;

  try {
    let extractedText = "";

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
          max_tokens: 512,
          system: MEMORY_EXTRACTION_PROMPT,
          messages: [{ role: "user", content: conversationSnippet }],
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      extractedText = data.content?.[0]?.text || "";
    } else if (providerId === "openai") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: fastModel,
          max_tokens: 512,
          messages: [
            { role: "system", content: MEMORY_EXTRACTION_PROMPT },
            { role: "user", content: conversationSnippet },
          ],
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      extractedText = data.choices?.[0]?.message?.content || "";
    } else if (providerId === "gemini") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${fastModel}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${MEMORY_EXTRACTION_PROMPT}\n\n${conversationSnippet}` }],
              },
            ],
            generationConfig: { maxOutputTokens: 512 },
          }),
        }
      );
      if (!res.ok) return;
      const data = await res.json();
      extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else if (providerId === "together") {
      const res = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: fastModel,
          max_tokens: 512,
          messages: [
            { role: "system", content: MEMORY_EXTRACTION_PROMPT },
            { role: "user", content: conversationSnippet },
          ],
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      extractedText = data.choices?.[0]?.message?.content || "";
    }

    if (!extractedText) return;

    // Parse the JSON array from the LLM response
    const jsonMatch = extractedText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return;

    const memories: { key: string; value: string; category: string }[] = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(memories) || memories.length === 0) return;

    // Validate and upsert each memory
    const validCategories = new Set(["preference", "fact", "context", "instruction"]);

    for (const mem of memories.slice(0, 5)) {
      if (
        !mem.key ||
        !mem.value ||
        !mem.category ||
        typeof mem.key !== "string" ||
        typeof mem.value !== "string" ||
        !validCategories.has(mem.category)
      ) {
        continue;
      }

      // Sanitize key to snake_case
      const sanitizedKey = mem.key
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .replace(/_+/g, "_")
        .slice(0, 100);

      await supabaseClient
        .from("user_memories")
        .upsert(
          {
            user_id: userId,
            key: sanitizedKey,
            value: mem.value.slice(0, 500),
            category: mem.category,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,key" }
        )
        .then(() => {
          // Upsert succeeded, nothing to do
        })
        .catch(() => {
          // Non-critical — ignore individual failures
        });
    }
  } catch {
    // Memory extraction is non-critical, never fail the main flow
  }
}

// ─── Retrieve relevant memories ───

/**
 * Fetches all user memories. In the future this could do semantic search
 * to find memories relevant to the current message, but for now we return
 * all memories (typically < 50 per user) and let the LLM decide relevance.
 */
export async function getRelevantMemories(
  userId: string,
  _message: string,
  supabaseClient: SupabaseClient
): Promise<UserMemory[]> {
  const { data, error } = await supabaseClient
    .from("user_memories")
    .select("id, key, value, category, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(30);

  if (error || !data) return [];
  return data as UserMemory[];
}

// ─── Format memories as system prompt section ───

/**
 * Converts a list of UserMemory records into a system prompt section.
 * Groups by category for clarity. Kept concise to minimize token usage.
 */
export function injectMemoryContext(memories: UserMemory[]): string {
  if (!memories || memories.length === 0) return "";

  const grouped: Record<string, string[]> = {
    fact: [],
    preference: [],
    instruction: [],
    context: [],
  };

  for (const mem of memories) {
    const label = `${mem.key.replace(/_/g, " ")}: ${mem.value}`;
    if (grouped[mem.category]) {
      grouped[mem.category].push(label);
    }
  }

  const sections: string[] = [];

  if (grouped.fact.length > 0) {
    sections.push(`Facts about the user:\n${grouped.fact.map((f) => `- ${f}`).join("\n")}`);
  }
  if (grouped.preference.length > 0) {
    sections.push(`User preferences:\n${grouped.preference.map((p) => `- ${p}`).join("\n")}`);
  }
  if (grouped.instruction.length > 0) {
    sections.push(`Standing instructions:\n${grouped.instruction.map((i) => `- ${i}`).join("\n")}`);
  }
  if (grouped.context.length > 0) {
    sections.push(`Context:\n${grouped.context.map((c) => `- ${c}`).join("\n")}`);
  }

  if (sections.length === 0) return "";

  return `\n\nUSER MEMORY (remembered from past conversations):\n${sections.join("\n\n")}\n\nUse these memories to personalize your responses. Do not mention that you have a memory system unless the user asks.`;
}
