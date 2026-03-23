// Supabase Edge Function: Generate Downloadable Files
// Converts markdown content to downloadable PDF or MD files.
// For PDF: generates an HTML document styled with print CSS, returned as HTML
// that the frontend renders to PDF via window.print() or html2pdf.js.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Convert markdown to styled HTML for PDF rendering. */
function markdownToHtml(markdown: string, title: string): string {
  let html = markdown
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Horizontal rule
    .replace(/^---+$/gm, '<hr/>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    // Paragraphs (blank lines)
    .replace(/\n\n/g, '</p><p>')
    // Line breaks
    .replace(/\n/g, '<br/>');

  // Wrap list items
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
  // Collapse consecutive <ul> tags
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  // Handle tables
  html = html.replace(
    /\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g,
    (_match, headerRow, bodyRows) => {
      const headers = headerRow.split('|').map((h: string) => h.trim()).filter(Boolean);
      const rows = bodyRows.trim().split('\n').map((row: string) =>
        row.split('|').map((c: string) => c.trim()).filter(Boolean)
      );
      return `<table>
        <thead><tr>${headers.map((h: string) => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((r: string[]) => `<tr>${r.map((c: string) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>`;
    }
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, system-ui, sans-serif;
      color: #1a1a2e;
      line-height: 1.7;
      max-width: 800px;
      margin: 0 auto;
      padding: 48px 40px;
      font-size: 14px;
    }

    h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 8px;
      color: #0a0f1e;
      border-bottom: 2px solid #6C5CE7;
      padding-bottom: 12px;
    }

    h2 {
      font-size: 20px;
      font-weight: 600;
      margin: 32px 0 12px;
      color: #1a1a2e;
    }

    h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 24px 0 8px;
      color: #333;
    }

    p { margin: 12px 0; }

    strong { font-weight: 600; }

    code {
      background: #f0f0f5;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 13px;
    }

    pre {
      background: #1a1a2e;
      color: #e0e0e0;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 16px 0;
    }

    pre code {
      background: none;
      padding: 0;
      color: inherit;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 13px;
    }

    th {
      background: #f5f5fa;
      font-weight: 600;
      text-align: left;
      padding: 10px 12px;
      border-bottom: 2px solid #ddd;
    }

    td {
      padding: 8px 12px;
      border-bottom: 1px solid #eee;
    }

    tr:hover td { background: #fafafa; }

    a {
      color: #6C5CE7;
      text-decoration: none;
    }

    a:hover { text-decoration: underline; }

    ul, ol {
      margin: 12px 0;
      padding-left: 24px;
    }

    li { margin: 4px 0; }

    hr {
      border: none;
      border-top: 1px solid #eee;
      margin: 24px 0;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #eee;
    }

    .header-logo {
      font-weight: 700;
      font-size: 16px;
      color: #6C5CE7;
    }

    .header-date {
      font-size: 12px;
      color: #999;
    }

    .footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid #eee;
      font-size: 11px;
      color: #999;
      text-align: center;
    }

    @media print {
      body { padding: 20px; }
      a { color: #333; }
      pre { background: #f5f5f5; color: #333; }
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="header-logo">Vyroo Report</span>
    <span class="header-date">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
  </div>
  <p>${html}</p>
  <div class="footer">
    Generated by Vyroo AI &middot; ${new Date().toISOString().split('T')[0]}
  </div>
</body>
</html>`;
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

    const {
      content,
      title,
      format,
      conversationId,
    }: {
      content: string;
      title?: string;
      format: "pdf" | "md" | "html";
      conversationId?: string;
    } = await req.json();

    if (!content) {
      return new Response(JSON.stringify({ error: "Missing content" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reportTitle = title || "Vyroo Report";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safeTitle = reportTitle.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);

    if (format === "md") {
      // Return raw markdown as downloadable file
      const filename = `${safeTitle}_${timestamp}.md`;
      return new Response(content, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (format === "html" || format === "pdf") {
      // Convert markdown to styled HTML
      // For PDF: frontend uses html2pdf.js or window.print()
      const html = markdownToHtml(content, reportTitle);
      const filename = `${safeTitle}_${timestamp}.${format === "pdf" ? "html" : "html"}`;

      // Optionally store in Supabase storage for sharing
      if (conversationId) {
        try {
          const storagePath = `reports/${user.id}/${conversationId}/${filename}`;
          await supabase.storage
            .from("user-files")
            .upload(storagePath, new Blob([html], { type: "text/html" }), {
              contentType: "text/html",
              upsert: true,
            });
        } catch {
          // Storage is non-critical
        }
      }

      return new Response(
        JSON.stringify({
          html,
          filename,
          format,
          title: reportTitle,
          generated_at: new Date().toISOString(),
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unsupported format: ${format}. Use 'pdf', 'md', or 'html'.` }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
