import { supabase } from "@/lib/supabase";

export interface ExportOptions {
  content: string;
  title?: string;
  format: "pdf" | "md" | "html";
  conversationId?: string;
}

/**
 * Export content as a downloadable file.
 * - MD: direct download as .md file
 * - HTML/PDF: calls the generate-file edge function, then triggers download
 */
export async function exportFile(options: ExportOptions): Promise<void> {
  const { content, title = "Vyroo Report", format, conversationId } = options;

  if (format === "md") {
    // Direct markdown download — no server needed
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
    const filename = `${safeTitle}_${new Date().toISOString().replace(/[:.]/g, "-")}.md`;
    triggerDownload(blob, filename);
    return;
  }

  // For HTML/PDF, call the edge function
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-file`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
      "apikey": supabaseAnonKey,
    },
    body: JSON.stringify({ content, title, format, conversationId }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Export failed: ${response.status}`);
  }

  const result = await response.json();

  if (format === "pdf") {
    // Open the styled HTML in a new window for printing to PDF
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(result.html);
      printWindow.document.close();
      // Auto-trigger print dialog after a short delay for rendering
      setTimeout(() => printWindow.print(), 500);
    }
    return;
  }

  // HTML download
  const blob = new Blob([result.html], { type: "text/html;charset=utf-8" });
  triggerDownload(blob, result.filename);
}

/** Trigger a file download in the browser. */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
