// Supabase Edge Function: Auto-title conversations
// Called after first AI response to generate a concise title

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { conversationId, userMessage, assistantMessage } = await req.json();

    if (!conversationId || !userMessage) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already titled
    const { data: conv } = await supabase
      .from("conversations")
      .select("auto_titled")
      .eq("id", conversationId)
      .single();

    if (conv?.auto_titled) {
      return new Response(JSON.stringify({ title: null, already_titled: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to get user's OpenAI key first (cheapest for titling), then Claude
    let apiKey: string | null = null;
    let useProvider: "openai" | "anthropic" = "openai";

    const { data: openaiKey } = await supabase
      .from("user_api_keys")
      .select("encrypted_key")
      .eq("user_id", user.id)
      .eq("provider", "openai")
      .single();

    if (openaiKey) {
      apiKey = openaiKey.encrypted_key;
      useProvider = "openai";
    } else {
      const { data: claudeKey } = await supabase
        .from("user_api_keys")
        .select("encrypted_key")
        .eq("user_id", user.id)
        .eq("provider", "claude")
        .single();

      if (claudeKey) {
        apiKey = claudeKey.encrypted_key;
        useProvider = "anthropic";
      }
    }

    if (!apiKey) {
      // No key available — use a simple heuristic title
      const words = userMessage.split(" ").slice(0, 6).join(" ");
      const title = words.length > 40 ? words.slice(0, 40) + "..." : words;

      await supabase
        .from("conversations")
        .update({ title, auto_titled: true })
        .eq("id", conversationId);

      return new Response(JSON.stringify({ title }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate title via LLM
    const titlePrompt = `Generate a concise 4-6 word title for this conversation. Return ONLY the title, no quotes, no punctuation at the end.

User: ${userMessage.slice(0, 200)}
${assistantMessage ? `Assistant: ${assistantMessage.slice(0, 200)}` : ""}`;

    let title: string;

    if (useProvider === "openai") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 20,
          temperature: 0.7,
          messages: [{ role: "user", content: titlePrompt }],
        }),
      });

      if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
      const data = await response.json();
      title = data.choices[0].message.content.trim();
    } else {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 20,
          messages: [{ role: "user", content: titlePrompt }],
        }),
      });

      if (!response.ok) throw new Error(`Claude error: ${response.status}`);
      const data = await response.json();
      title = data.content[0].text.trim();
    }

    // Clean up the title
    title = title.replace(/^["']|["']$/g, "").replace(/\.+$/, "");
    if (title.length > 60) title = title.slice(0, 57) + "...";

    // Update the conversation
    await supabase
      .from("conversations")
      .update({
        title,
        auto_titled: true,
        last_message_preview: userMessage.slice(0, 100),
      })
      .eq("id", conversationId);

    return new Response(JSON.stringify({ title }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
