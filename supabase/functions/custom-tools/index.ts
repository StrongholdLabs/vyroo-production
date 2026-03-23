// Supabase Edge Function: Custom Tools CRUD
// Allows users to create, read, update, and delete their own tools.
// Custom tools are stored in the database and can be enabled per agent run.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CustomToolDefinition {
  id?: string;
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  // How to execute: "http" calls an external API, "prompt" uses LLM with a template
  execution_type: "http" | "prompt";
  // For HTTP tools
  http_config?: {
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    headers?: Record<string, string>;
    body_template?: string; // JSON template with {{param_name}} placeholders
  };
  // For prompt-based tools
  prompt_template?: string; // Prompt template with {{param_name}} placeholders
}

/** Replace {{param_name}} placeholders in a template string. */
function interpolateTemplate(template: string, args: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return String(args[key] ?? "");
  });
}

/** Execute a custom tool by its definition and arguments. */
async function executeCustomTool(
  tool: CustomToolDefinition,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  if (tool.execution_type === "http" && tool.http_config) {
    const config = tool.http_config;
    const url = interpolateTemplate(config.url, args);

    const fetchOptions: RequestInit = {
      method: config.method,
      headers: {
        "Content-Type": "application/json",
        ...(config.headers || {}),
      },
    };

    if (config.body_template && ["POST", "PUT"].includes(config.method)) {
      fetchOptions.body = interpolateTemplate(config.body_template, args);
    }

    try {
      const resp = await fetch(url, fetchOptions);
      if (!resp.ok) {
        return { error: `HTTP ${resp.status}: ${resp.statusText}`, url };
      }
      const contentType = resp.headers.get("content-type") || "";
      if (contentType.includes("json")) {
        return { result: await resp.json(), status: resp.status };
      }
      return { result: await resp.text(), status: resp.status };
    } catch (err) {
      return { error: `Request failed: ${String(err)}` };
    }
  }

  if (tool.execution_type === "prompt" && tool.prompt_template) {
    const prompt = interpolateTemplate(tool.prompt_template, args);
    // Use Anthropic to execute the prompt
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return { error: "No API key available for prompt execution" };

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 2048,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!resp.ok) {
        return { error: `LLM call failed: ${resp.status}` };
      }

      const data = await resp.json();
      const text = data.content?.[0]?.text || "";
      return { result: text };
    } catch (err) {
      return { error: `Prompt execution failed: ${String(err)}` };
    }
  }

  return { error: "Invalid tool configuration" };
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

    const body = await req.json();
    const action = body.action as string;

    // --- LIST ---
    if (action === "list") {
      const { data: tools, error: listErr } = await supabase
        .from("custom_tools")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (listErr) {
        return new Response(JSON.stringify({ error: listErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ tools: tools || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- CREATE ---
    if (action === "create") {
      const tool: CustomToolDefinition = body.tool;
      if (!tool?.name || !tool?.description || !tool?.execution_type) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: name, description, execution_type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate: max 20 custom tools per user
      const { count } = await supabase
        .from("custom_tools")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if ((count ?? 0) >= 20) {
        return new Response(
          JSON.stringify({ error: "Maximum of 20 custom tools per user" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const toolId = `custom_${tool.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

      const { data: created, error: createErr } = await supabase
        .from("custom_tools")
        .insert({
          user_id: user.id,
          tool_id: toolId,
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters || {},
          execution_type: tool.execution_type,
          http_config: tool.http_config || null,
          prompt_template: tool.prompt_template || null,
          enabled: true,
        })
        .select()
        .single();

      if (createErr) {
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ tool: created }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- UPDATE ---
    if (action === "update") {
      const { id, updates } = body;
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing tool id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: updated, error: updateErr } = await supabase
        .from("custom_tools")
        .update({
          ...(updates.name && { name: updates.name }),
          ...(updates.description && { description: updates.description }),
          ...(updates.parameters && { parameters: updates.parameters }),
          ...(updates.execution_type && { execution_type: updates.execution_type }),
          ...(updates.http_config !== undefined && { http_config: updates.http_config }),
          ...(updates.prompt_template !== undefined && { prompt_template: updates.prompt_template }),
          ...(updates.enabled !== undefined && { enabled: updates.enabled }),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ tool: updated }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- DELETE ---
    if (action === "delete") {
      const { id } = body;
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing tool id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: deleteErr } = await supabase
        .from("custom_tools")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (deleteErr) {
        return new Response(JSON.stringify({ error: deleteErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- EXECUTE ---
    if (action === "execute") {
      const { id, args: toolArgs } = body;
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing tool id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: tool, error: fetchErr } = await supabase
        .from("custom_tools")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (fetchErr || !tool) {
        return new Response(JSON.stringify({ error: "Tool not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await executeCustomTool(
        {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
          execution_type: tool.execution_type,
          http_config: tool.http_config,
          prompt_template: tool.prompt_template,
        },
        toolArgs || {}
      );

      return new Response(JSON.stringify({ result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- TEST ---
    if (action === "test") {
      const { tool, args: toolArgs } = body;
      if (!tool) {
        return new Response(JSON.stringify({ error: "Missing tool definition" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await executeCustomTool(tool, toolArgs || {});

      return new Response(JSON.stringify({ result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}. Use: list, create, update, delete, execute, test` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
