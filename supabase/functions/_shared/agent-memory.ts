// Agent Memory: conversation context for agent awareness
// Fetches recent conversations and extracts topics, preferences, and patterns
// to inject into agent planning prompts.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type SupabaseClient = ReturnType<typeof createClient>;

// ─── Types ───

export interface ConversationContext {
  recentTopics: string[];
  userPreferences: string[];
  relevantHistory: { title: string; preview: string; date: string }[];
}

interface GetContextOptions {
  /** Number of recent conversations to consider. Defaults to 5. */
  limit?: number;
  /** Maximum age of conversations in days. Defaults to 30. */
  maxAgeDays?: number;
}

// ─── Fetch conversation context ───

/**
 * Retrieves the user's recent conversation history and extracts
 * key topics, preferences, and patterns for agent context.
 */
export async function getConversationContext(
  userId: string,
  supabaseClient: SupabaseClient,
  options?: GetContextOptions
): Promise<ConversationContext> {
  const limit = options?.limit ?? 5;
  const maxAgeDays = options?.maxAgeDays ?? 30;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

  // Fetch recent conversations with their titles and previews
  const { data: conversations, error: convError } = await supabaseClient
    .from("conversations")
    .select("id, title, last_message_preview, updated_at")
    .eq("user_id", userId)
    .gte("updated_at", cutoffDate.toISOString())
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (convError || !conversations || conversations.length === 0) {
    return {
      recentTopics: [],
      userPreferences: [],
      relevantHistory: [],
    };
  }

  // Build relevant history from conversations
  const relevantHistory = conversations.map((c) => ({
    title: c.title || "Untitled conversation",
    preview: c.last_message_preview || "",
    date: c.updated_at || "",
  }));

  // Extract topics from conversation titles
  const recentTopics = conversations
    .map((c) => c.title)
    .filter((title): title is string => !!title && title !== "New conversation")
    .slice(0, 8);

  // Fetch the most recent user messages to detect preferences/patterns
  const conversationIds = conversations.map((c) => c.id);
  const { data: messages, error: msgError } = await supabaseClient
    .from("messages")
    .select("content, metadata")
    .in("conversation_id", conversationIds)
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(15);

  const userPreferences = extractPreferences(messages || []);

  return {
    recentTopics,
    userPreferences,
    relevantHistory,
  };
}

// ─── Build memory prompt ───

/**
 * Converts a ConversationContext into a concise system prompt addition.
 * Kept under ~500 tokens to minimize cost.
 */
export function buildMemoryPrompt(context: ConversationContext): string {
  const parts: string[] = [];

  if (context.recentTopics.length > 0) {
    parts.push(
      `The user has recently discussed: ${context.recentTopics.join(", ")}.`
    );
  }

  if (context.userPreferences.length > 0) {
    parts.push(`They prefer: ${context.userPreferences.join("; ")}.`);
  }

  if (context.relevantHistory.length > 0) {
    const historyLines = context.relevantHistory
      .slice(0, 3)
      .map((h) => `- "${h.title}"${h.preview ? ` (${h.preview.slice(0, 60)}...)` : ""}`)
      .join("\n");
    parts.push(`Recent conversation history:\n${historyLines}`);
  }

  if (parts.length === 0) {
    return "";
  }

  return `\nUSER CONTEXT (from conversation history):\n${parts.join("\n")}\n\nUse this context to personalize your responses and maintain continuity with the user's previous interactions. Do not explicitly reference this context unless directly relevant.`;
}

// ─── Helpers ───

/**
 * Analyzes user messages to detect preferences and patterns.
 * Looks for explicit preference signals like "I prefer", "I like", "always", etc.
 */
function extractPreferences(
  messages: { content: string; metadata: unknown }[]
): string[] {
  const preferences: string[] = [];
  const preferencePatterns = [
    /i (?:prefer|like|want|need|always use|usually) (.{5,60})/i,
    /(?:please|always) (?:use|format|write|respond) (.{5,60})/i,
    /(?:don't|do not|never) (.{5,60})/i,
  ];

  for (const msg of messages) {
    if (!msg.content || typeof msg.content !== "string") continue;

    for (const pattern of preferencePatterns) {
      const match = msg.content.match(pattern);
      if (match && match[1]) {
        const pref = match[1].trim().replace(/[.!?]+$/, "");
        if (pref.length > 4 && pref.length < 80 && !preferences.includes(pref)) {
          preferences.push(pref);
        }
      }
      // Limit to 5 preferences to keep prompt short
      if (preferences.length >= 5) break;
    }
    if (preferences.length >= 5) break;
  }

  return preferences;
}
