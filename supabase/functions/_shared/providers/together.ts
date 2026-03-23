// Together AI streaming adapter (OpenAI-compatible API for Meta Llama models)

export interface ChatMsg {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Map user-facing model IDs to Together AI's full model identifiers.
 */
const MODEL_MAP: Record<string, string> = {
  "llama-3.3-70b": "meta-llama/Llama-3.3-70B-Instruct-Turbo",
  "llama-4-scout": "meta-llama/Llama-4-Scout-17B-16E-Instruct",
};

function resolveTogetherModel(model: string): string {
  return MODEL_MAP[model] || model;
}

/**
 * Stream a response from Together AI's OpenAI-compatible Chat Completions API.
 * Returns a ReadableStream that emits SSE-formatted token events.
 */
export function streamTogether(
  apiKey: string,
  messages: ChatMsg[],
  model: string,
  systemPrompt?: string
): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const togetherModel = resolveTogetherModel(model);

        const togetherMessages = systemPrompt
          ? [
              { role: "system", content: systemPrompt },
              ...messages.map((m) => ({ role: m.role, content: m.content })),
            ]
          : messages.map((m) => ({ role: m.role, content: m.content }));

        const response = await fetch(
          "https://api.together.xyz/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: togetherModel,
              stream: true,
              messages: togetherMessages,
            }),
          }
        );

        if (!response.ok) {
          const err = await response.text();
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: `Together AI API (${response.status}): ${err}` })}\n\n`
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
                const token = parsed.choices?.[0]?.delta?.content;
                if (token) {
                  controller.enqueue(
                    encoder.encode(
                      `event: token\ndata: ${JSON.stringify({ token })}\n\n`
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
