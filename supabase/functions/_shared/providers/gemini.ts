// Google Gemini streaming adapter

export interface ChatMsg {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Convert standard chat messages to Gemini's format.
 * Gemini uses 'user'/'model' roles and { parts: [{ text }] } content structure.
 * System messages are passed as systemInstruction separately.
 */
function toGeminiMessages(
  messages: ChatMsg[]
): { role: string; parts: { text: string }[] }[] {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
}

/**
 * Stream a response from Google's Gemini API.
 * Returns a ReadableStream that emits SSE-formatted token events.
 */
export function streamGemini(
  apiKey: string,
  messages: ChatMsg[],
  model: string,
  systemPrompt?: string
): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const geminiMessages = toGeminiMessages(messages);

        const body: Record<string, unknown> = {
          contents: geminiMessages,
          generationConfig: {
            maxOutputTokens: 4096,
          },
        };

        if (systemPrompt) {
          body.systemInstruction = {
            parts: [{ text: systemPrompt }],
          };
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const err = await response.text();
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: `Gemini API (${response.status}): ${err}` })}\n\n`
            )
          );
          controller.close();
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

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                // Gemini returns { candidates: [{ content: { parts: [{ text }] } }] }
                const text =
                  parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  controller.enqueue(
                    encoder.encode(
                      `event: token\ndata: ${JSON.stringify({ token: text })}\n\n`
                    )
                  );
                }
              } catch {
                // Skip non-JSON lines
              }
            }
          }
        }

        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({ error: String(error) })}\n\n`
          )
        );
        controller.close();
      }
    },
  });
}
