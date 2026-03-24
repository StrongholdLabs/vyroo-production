import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { fileName, fileContent, fileType, conversationId } = body;

    if (!fileName || !fileContent) {
      return new Response(JSON.stringify({ error: "fileName and fileContent are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (fileContent.length > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Determine file type and format
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const typeMap: Record<string, { type: string; format: string }> = {
      csv: { type: "data", format: "csv" },
      tsv: { type: "data", format: "tsv" },
      json: { type: "data", format: "json" },
      txt: { type: "document", format: "text" },
      md: { type: "document", format: "markdown" },
      py: { type: "code", format: "python" },
      js: { type: "code", format: "javascript" },
      ts: { type: "code", format: "typescript" },
      html: { type: "document", format: "html" },
      pdf: { type: "document", format: "pdf" },
    };
    const fileInfo = typeMap[ext] || { type: fileType || "document", format: ext || "text" };

    // Save to workspace_files
    const { data: file, error } = await supabase
      .from("workspace_files")
      .insert({
        user_id: user.id,
        conversation_id: conversationId || null,
        name: fileName,
        type: fileInfo.type,
        format: fileInfo.format,
        content: fileContent,
        size_bytes: fileContent.length,
      })
      .select("id, name, type, format, size_bytes")
      .single();

    if (error) throw error;

    // Generate embedding for RAG search
    try {
      const openaiKey = Deno.env.get("OPENAI_API_KEY");
      if (openaiKey) {
        const textToEmbed = fileContent.substring(0, 8000);
        const embRes = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({ model: "text-embedding-3-small", input: `File: ${fileName}\n${textToEmbed}` }),
        });
        if (embRes.ok) {
          const embData = await embRes.json();
          const embedding = embData.data?.[0]?.embedding;
          if (embedding) {
            // Store embedding in a message-like format for RAG search
            await supabase.from("messages").insert({
              conversation_id: conversationId || null,
              role: "system",
              content: `[Uploaded file: ${fileName}]\n${textToEmbed.substring(0, 2000)}`,
              embedding,
            });
          }
        }
      }
    } catch { /* embedding is non-critical */ }

    return new Response(JSON.stringify({
      success: true,
      file,
      message: `File "${fileName}" uploaded successfully`,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
