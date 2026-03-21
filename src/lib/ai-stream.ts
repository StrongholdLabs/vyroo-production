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
  signal?: AbortSignal;
}

export async function streamChat(options: StreamOptions) {
  const { conversationId, message, provider, model, onToken, onError, onDone, onTitle, onFollowUps, onStep, onReport, onMode, signal } = options;

  console.log("[ai-stream] streamChat called for:", message);

  // Get a valid session — try cached first (faster), refresh only if needed
  let accessToken: string | undefined;
  try {
    const { data: { session: cachedSession } } = await supabase.auth.getSession();
    accessToken = cachedSession?.access_token;
    console.log("[ai-stream] cached session:", !!cachedSession, "token:", accessToken?.length);
  } catch (e) {
    console.error("[ai-stream] getSession error:", e);
  }

  if (!accessToken) {
    try {
      const { data: { session: freshSession } } = await supabase.auth.refreshSession();
      accessToken = freshSession?.access_token;
      console.log("[ai-stream] refreshed session:", !!freshSession, "token:", accessToken?.length);
    } catch (e) {
      console.error("[ai-stream] refreshSession error:", e);
    }
  }

  if (!accessToken) {
    console.error("[ai-stream] No access token available");
    onError("Not authenticated — please sign in again");
    return;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const url = `${supabaseUrl}/functions/v1/chat`;

  console.log("[ai-stream] Calling chat with token length:", accessToken.length, "apikey length:", supabaseAnonKey?.length);

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
      console.error("[ai-stream] Chat error:", response.status, errorMsg);
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
    console.error("[ai-stream] Fetch error:", error);
    onError(String(error));
  }
}
