// Anthropic (Claude) Messages API streaming adapter

export interface ChatMsg {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Non-streaming call to Anthropic Messages API with tool use support.
 * Used in the ReAct loop where we need to inspect tool_use blocks before continuing.
 */
export async function callAnthropicWithTools(
  apiKey: string,
  messages: Array<{ role: string; content: any }>,
  model: string,
  tools: Array<{ name: string; description: string; input_schema: object }>,
  systemPrompt?: string
): Promise<{
  textContent: string;
  toolCalls: Array<{ id: string; name: string; input: Record<string, any> }>;
  stopReason: string;
}> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemPrompt || "",
      messages,
      tools,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error: ${res.status} ${err}`);
  }

  const data = await res.json();

  let textContent = "";
  const toolCalls: Array<{ id: string; name: string; input: Record<string, any> }> = [];

  for (const block of data.content || []) {
    if (block.type === "text") {
      textContent += block.text;
    } else if (block.type === "tool_use") {
      toolCalls.push({
        id: block.id,
        name: block.name,
        input: block.input,
      });
    }
  }

  return { textContent, toolCalls, stopReason: data.stop_reason };
}

/**
 * Stream a response from Anthropic's Messages API.
 * Returns a ReadableStream that emits SSE-formatted token events.
 */
export function streamAnthropic(
  apiKey: string,
  messages: ChatMsg[],
  model: string,
  systemPrompt?: string
): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const anthropicMessages = messages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role, content: m.content }));

        const body: Record<string, unknown> = {
          model,
          max_tokens: 4096,
          stream: true,
          messages: anthropicMessages,
        };

        if (systemPrompt) {
          // Use structured system prompt with cache_control for Anthropic prompt caching
          // This can reduce costs by up to 90% on repeated system prompt context
          body.system = [
            {
              type: "text",
              text: systemPrompt,
              cache_control: { type: "ephemeral" },
            },
          ];
        }

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-beta": "prompt-caching-2024-07-31",
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const err = await response.text();
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: `Claude API (${response.status}): ${err}` })}\n\n`
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
                if (
                  parsed.type === "content_block_delta" &&
                  parsed.delta?.text
                ) {
                  const token = parsed.delta.text;
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
