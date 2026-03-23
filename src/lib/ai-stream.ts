import { supabase } from "@/lib/supabase";

export interface StreamOptions {
  conversationId: string;
  message: string;
  provider: string;
  model: string;
  onToken: (token: string) => void;
  onError: (error: string) => void;
  onDone: () => void;
  onTitle?: (title: string) => void;
  onFollowUps?: (followUps: { text: string; category: string }[]) => void;
  onStep?: (step: { id: number; label: string; detail: string; status: "active" | "complete" | "pending"; logs: Array<{ time: string; text: string; type: "info" | "action" | "result" }> }) => void;
  onReport?: (report: { title: string; summary: string; headers: string[]; rows: string[][] }) => void;
  onMode?: (mode: "direct" | "agentic") => void;
  onTool?: (tool: { name: string; args: Record<string, any>; result?: any; duration?: number; status: "executing" | "complete" }) => void;
  onSearch?: (data: { query: string; results: Array<{ title: string; url: string; snippet?: string; domain?: string; favicon?: string }>; elapsed?: string }) => void;
  onBrowse?: (data: { url: string; title: string; content: string; domain?: string; favicon?: string; sections?: any[]; elapsed?: string; durationMs?: number }) => void;
  onSources?: (data: { sources: Array<{ title: string; url: string; favicon: string; domain: string }> }) => void;
  onSlides?: (data: { title: string; slides: Array<{ title: string; subtitle?: string; content?: string[]; bgColor?: string; accentColor?: string; badge?: string; speakerNotes?: string }>; slideCount: number }) => void;
  onApprovalRequired?: (data: { step_number: number; tool_name: string; tool_description?: string; args: Record<string, any>; approval_id: string }) => void;
  signal?: AbortSignal;
}

export async function streamChat(options: StreamOptions) {
  const { conversationId, message, provider, model, onToken, onError, onDone, onTitle, onFollowUps, onStep, onReport, onMode, onTool, onSearch, onBrowse, onSources, onSlides, onApprovalRequired, signal } = options;

  // Get a valid session — try cached first (faster), refresh only if needed
  let accessToken: string | undefined;
  try {
    const { data: { session: cachedSession } } = await supabase.auth.getSession();
    accessToken = cachedSession?.access_token;
  } catch {
    // fallthrough
  }

  if (!accessToken) {
    try {
      const { data: { session: freshSession } } = await supabase.auth.refreshSession();
      accessToken = freshSession?.access_token;
    } catch {
      // fallthrough
    }
  }

  if (!accessToken) {
    onError("Not authenticated — please sign in again");
    return;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const url = `${supabaseUrl}/functions/v1/chat`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "apikey": supabaseAnonKey,
        "x-client-info": "vyroo-web",
      },
      body: JSON.stringify({ conversationId, message, provider, model }),
      signal,
    });

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;
      try {
        const err = await response.json();
        errorMsg = err.error || err.message || errorMsg;
      } catch {}
      onError(errorMsg);
      return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let eventType = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          eventType = line.slice(7);
        } else if (line.startsWith("data: ")) {
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);
            if (eventType === "token" && parsed.token) {
              onToken(parsed.token);
            } else if (eventType === "title" && parsed.title) {
              onTitle?.(parsed.title);
            } else if (eventType === "followups" && parsed.followUps) {
              onFollowUps?.(parsed.followUps);
            } else if (eventType === "step" && parsed) {
              onStep?.(parsed);
            } else if (eventType === "report" && parsed) {
              onReport?.(parsed);
            } else if (eventType === "mode" && parsed) {
              onMode?.(parsed.mode);
            } else if (eventType === "tool" && parsed) {
              onTool?.(parsed);
            } else if (eventType === "search" && parsed) {
              onSearch?.(parsed);
            } else if (eventType === "browse" && parsed) {
              onBrowse?.(parsed);
            } else if (eventType === "sources" && parsed) {
              onSources?.(parsed);
            } else if (eventType === "slides" && parsed) {
              console.log("[ai-stream] slides event received:", parsed?.slideCount);
              onSlides?.(parsed);
            } else if (eventType === "approval_required" && parsed) {
              onApprovalRequired?.(parsed);
            } else if (eventType === "error") {
              onError(parsed.error || "Unknown error");
              return;
            } else if (eventType === "done") {
              onDone();
              return;
            }
          } catch {
            // Skip malformed data
          }
        }
      }
    }

    onDone();
  } catch (error) {
    if (signal?.aborted) return;
    onError(String(error));
  }
}

/**
 * Send an approval/denial response for a tool execution request.
 * Called when the user clicks Approve or Deny on the AgentApprovalCard.
 */
export async function respondToApproval(options: {
  conversationId: string;
  approvalId: string;
  approved: boolean;
  alwaysApprove?: boolean;
}): Promise<void> {
  const { conversationId, approvalId, approved, alwaysApprove } = options;

  let accessToken: string | undefined;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    accessToken = session?.access_token;
  } catch { /* fallthrough */ }

  if (!accessToken) {
    try {
      const { data: { session } } = await supabase.auth.refreshSession();
      accessToken = session?.access_token;
    } catch { /* fallthrough */ }
  }

  if (!accessToken) return;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  await fetch(`${supabaseUrl}/functions/v1/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      "apikey": supabaseAnonKey,
    },
    body: JSON.stringify({
      action: "approval_response",
      conversationId,
      approvalId,
      approved,
      alwaysApprove: alwaysApprove || false,
    }),
  });
}
