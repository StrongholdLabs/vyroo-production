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
  signal?: AbortSignal;
}

export async function streamChat(options: StreamOptions) {
  const { conversationId, message, provider, model, onToken, onError, onDone, onTitle, onFollowUps, signal } = options;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    onError("Not authenticated");
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
        Authorization: `Bearer ${session.access_token}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({ conversationId, message, provider, model }),
      signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "Stream request failed" }));
      onError(err.error || `HTTP ${response.status}`);
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
