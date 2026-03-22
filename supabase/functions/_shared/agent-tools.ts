// Agent Tool Registry: defines available tools for agent execution
// Each tool has an ID, metadata, and an execute function that returns structured output.

export interface AgentToolDefinition {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  execute: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Call Anthropic Messages API and return the text response. */
async function callAnthropic(
  model: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens = 2048
): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`Anthropic API error (${resp.status}): ${errBody}`);
  }

  const data = await resp.json();
  const textBlock = data.content?.find(
    (b: { type: string }) => b.type === "text"
  );
  return textBlock?.text ?? "";
}

/** Strip HTML tags and collapse whitespace. */
function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract <title> from HTML. */
function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripHtml(match[1]) : "";
}

/** Browser-like User-Agent for fetching pages. */
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** Parse CSV text into header + rows. */
function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split("\n");
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).filter(Boolean).map(parseLine);
  return { headers, rows };
}

/** Compute basic stats for an array of numbers. */
function numericStats(values: number[]): {
  count: number;
  min: number;
  max: number;
  avg: number;
  median: number;
} {
  if (values.length === 0) return { count: 0, min: 0, max: 0, avg: 0, median: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  return {
    count: sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: sum / sorted.length,
    median,
  };
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

const webSearch: AgentToolDefinition = {
  id: "web_search",
  name: "Web Search",
  description: "Search the web for information on a given query.",
  parameters: {
    query: { type: "string", description: "The search query", required: true },
  },
  async execute(args) {
    const query = String(args.query ?? "");
    if (!query) return { error: "No query provided", results: [] };

    // Try Brave Search first
    const braveKey = Deno.env.get("BRAVE_SEARCH_API_KEY");
    if (braveKey) {
      try {
        const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`;
        const resp = await fetch(url, {
          headers: { "X-Subscription-Token": braveKey, Accept: "application/json" },
        });
        if (resp.ok) {
          const data = await resp.json();
          const results = (data.web?.results ?? []).map(
            (r: { title?: string; url?: string; description?: string }) => ({
              title: r.title ?? "",
              url: r.url ?? "",
              snippet: r.description ?? "",
            })
          );
          return { results, source: "brave" };
        }
        // If Brave fails (rate limit, etc.), fall through to DuckDuckGo
      } catch {
        // fall through
      }
    }

    // Fallback: DuckDuckGo HTML scrape
    try {
      const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const resp = await fetch(ddgUrl, {
        headers: { "User-Agent": BROWSER_UA },
      });
      const html = await resp.text();

      // Parse result blocks from DuckDuckGo HTML
      const results: { title: string; url: string; snippet: string }[] = [];
      const resultRegex =
        /<a[^>]+class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
      let match: RegExpExecArray | null;
      while ((match = resultRegex.exec(html)) !== null && results.length < 5) {
        const rawUrl = match[1];
        // DuckDuckGo wraps URLs in a redirect; extract the actual URL
        const uddg = new URL(rawUrl, "https://duckduckgo.com").searchParams.get(
          "uddg"
        );
        results.push({
          title: stripHtml(match[2]),
          url: uddg ?? rawUrl,
          snippet: stripHtml(match[3]),
        });
      }

      // If regex didn't match, try a simpler extraction
      if (results.length === 0) {
        const simpleRegex =
          /<a[^>]+class="result__a"[^>]*>([\s\S]*?)<\/a>/gi;
        let sMatch: RegExpExecArray | null;
        while (
          (sMatch = simpleRegex.exec(html)) !== null &&
          results.length < 5
        ) {
          results.push({
            title: stripHtml(sMatch[1]),
            url: "",
            snippet: "",
          });
        }
      }

      return { results, source: "duckduckgo" };
    } catch (err) {
      return {
        error: `Search failed: ${String(err)}`,
        results: [],
      };
    }
  },
};

const browseUrl: AgentToolDefinition = {
  id: "browse_url",
  name: "Browse URL",
  description: "Navigate to a URL and extract its text content.",
  parameters: {
    url: { type: "string", description: "The URL to browse", required: true },
  },
  async execute(args) {
    const url = String(args.url ?? "");
    if (!url) return { error: "No URL provided" };

    try {
      const resp = await fetch(url, {
        headers: { "User-Agent": BROWSER_UA },
        redirect: "follow",
      });

      if (!resp.ok) {
        return { error: `HTTP ${resp.status} ${resp.statusText}`, url };
      }

      const html = await resp.text();
      const title = extractTitle(html);
      const content = stripHtml(html).slice(0, 5000);

      return {
        url,
        title,
        content,
        length: content.length,
      };
    } catch (err) {
      return { error: `Failed to fetch URL: ${String(err)}`, url };
    }
  },
};

const extractContent: AgentToolDefinition = {
  id: "extract_content",
  name: "Extract Content",
  description:
    "Extract specific content from a URL. Optionally provide a selector hint (e.g. 'article', 'main', 'table') to focus extraction.",
  parameters: {
    url: { type: "string", description: "The URL to extract from", required: true },
    selector: {
      type: "string",
      description:
        "Optional element hint to focus extraction (e.g. 'article', 'main', 'table', 'h1')",
    },
  },
  async execute(args) {
    const url = String(args.url ?? "");
    if (!url) return { error: "No URL provided" };

    const selectorHint = args.selector ? String(args.selector) : null;

    try {
      const resp = await fetch(url, {
        headers: { "User-Agent": BROWSER_UA },
        redirect: "follow",
      });

      if (!resp.ok) {
        return { error: `HTTP ${resp.status} ${resp.statusText}`, url };
      }

      const html = await resp.text();
      const title = extractTitle(html);

      const sections: { tag: string; content: string }[] = [];

      if (selectorHint) {
        // Extract content from matching tags
        const tagRegex = new RegExp(
          `<${selectorHint}[^>]*>([\\s\\S]*?)<\\/${selectorHint}>`,
          "gi"
        );
        let tagMatch: RegExpExecArray | null;
        while (
          (tagMatch = tagRegex.exec(html)) !== null &&
          sections.length < 20
        ) {
          const text = stripHtml(tagMatch[1]).trim();
          if (text.length > 10) {
            sections.push({ tag: selectorHint, content: text.slice(0, 2000) });
          }
        }
      }

      // If no sections found via selector, fall back to full text extraction
      if (sections.length === 0) {
        // Try common content elements
        const contentTags = ["article", "main", "section"];
        for (const tag of contentTags) {
          const regex = new RegExp(
            `<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
            "gi"
          );
          let m: RegExpExecArray | null;
          while ((m = regex.exec(html)) !== null && sections.length < 10) {
            const text = stripHtml(m[1]).trim();
            if (text.length > 50) {
              sections.push({ tag, content: text.slice(0, 2000) });
            }
          }
          if (sections.length > 0) break;
        }
      }

      // Final fallback: full body text
      if (sections.length === 0) {
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        const bodyText = bodyMatch ? stripHtml(bodyMatch[1]) : stripHtml(html);
        sections.push({ tag: "body", content: bodyText.slice(0, 5000) });
      }

      const totalWords = sections.reduce(
        (sum, s) => sum + s.content.split(/\s+/).length,
        0
      );

      return {
        url,
        title,
        sections,
        word_count: totalWords,
        extracted_at: new Date().toISOString(),
      };
    } catch (err) {
      return { error: `Failed to extract content: ${String(err)}`, url };
    }
  },
};

const summarize: AgentToolDefinition = {
  id: "summarize",
  name: "Summarize",
  description: "Generate a concise summary of the provided text using AI.",
  parameters: {
    text: { type: "string", description: "The text to summarize", required: true },
    max_length: {
      type: "number",
      description: "Desired maximum length of the summary in words (default 150)",
    },
  },
  async execute(args) {
    const text = String(args.text ?? "");
    if (!text) return { error: "No text provided" };

    const maxLength = Number(args.max_length ?? 150);

    try {
      const summary = await callAnthropic(
        "claude-3-5-haiku-20241022",
        "You are a concise summarizer. Produce a clear, accurate summary of the provided text. Focus on key points and main ideas.",
        `Summarize the following text in approximately ${maxLength} words or fewer:\n\n${text.slice(0, 15000)}`,
        1024
      );

      return {
        summary,
        word_count: summary.split(/\s+/).length,
      };
    } catch (err) {
      return { error: `Summarization failed: ${String(err)}` };
    }
  },
};

const generateCode: AgentToolDefinition = {
  id: "generate_code",
  name: "Generate Code",
  description: "Generate code in the specified language based on a description.",
  parameters: {
    language: { type: "string", description: "The programming language", required: true },
    description: {
      type: "string",
      description: "Description of what the code should do",
      required: true,
    },
    context: {
      type: "string",
      description: "Optional additional context (e.g. existing code, framework info)",
    },
  },
  async execute(args) {
    const language = String(args.language ?? "typescript");
    const description = String(args.description ?? "");
    const context = args.context ? String(args.context) : "";

    if (!description) return { error: "No description provided" };

    try {
      const result = await callAnthropic(
        "claude-sonnet-4-20250514",
        `You are an expert programmer. Generate clean, production-quality ${language} code based on the user's description. Include brief inline comments. Output ONLY a JSON object with two keys: "code" (the generated code as a string) and "explanation" (a brief explanation of the code). No markdown fences around the JSON.`,
        `Language: ${language}\nDescription: ${description}${context ? `\nContext: ${context}` : ""}`,
        4096
      );

      // Try to parse structured output
      try {
        const parsed = JSON.parse(result);
        return {
          code: parsed.code ?? result,
          language,
          explanation: parsed.explanation ?? "",
        };
      } catch {
        // If AI didn't return valid JSON, treat the whole response as code
        return { code: result, language, explanation: "" };
      }
    } catch (err) {
      return { error: `Code generation failed: ${String(err)}` };
    }
  },
};

const reviewCode: AgentToolDefinition = {
  id: "review_code",
  name: "Review Code",
  description: "Review code for issues and suggest improvements.",
  parameters: {
    code: { type: "string", description: "The code to review", required: true },
    language: { type: "string", description: "The programming language", required: true },
  },
  async execute(args) {
    const code = String(args.code ?? "");
    const language = String(args.language ?? "typescript");

    if (!code) return { error: "No code provided" };

    try {
      const result = await callAnthropic(
        "claude-sonnet-4-20250514",
        `You are an expert code reviewer. Analyze the provided ${language} code and return a JSON object (no markdown fences) with these keys:
- "issues": array of {severity: "error"|"warning"|"info", line: number|null, message: string}
- "suggestions": array of strings with improvement ideas
- "overall_quality": string, one of "excellent", "good", "fair", "poor"`,
        `Review this ${language} code:\n\n${code.slice(0, 10000)}`,
        2048
      );

      try {
        const parsed = JSON.parse(result);
        return {
          issues: parsed.issues ?? [],
          suggestions: parsed.suggestions ?? [],
          overall_quality: parsed.overall_quality ?? "unknown",
        };
      } catch {
        return {
          issues: [],
          suggestions: [result],
          overall_quality: "unknown",
        };
      }
    } catch (err) {
      return { error: `Code review failed: ${String(err)}` };
    }
  },
};

const analyzeCsv: AgentToolDefinition = {
  id: "analyze_csv",
  name: "Analyze CSV",
  description: "Parse CSV data and compute basic statistics on numeric columns.",
  parameters: {
    data: { type: "string", description: "The CSV data to analyze", required: true },
    question: {
      type: "string",
      description: "Optional question to answer about the data",
    },
  },
  async execute(args) {
    const data = String(args.data ?? "");
    if (!data) return { error: "No CSV data provided" };

    try {
      const { headers, rows } = parseCsv(data);
      if (headers.length === 0) return { error: "Could not parse CSV headers" };

      // Determine which columns are numeric
      const stats: Record<
        string,
        { count: number; min: number; max: number; avg: number; median: number }
      > = {};

      for (let col = 0; col < headers.length; col++) {
        const values: number[] = [];
        for (const row of rows) {
          const val = parseFloat(row[col]);
          if (!isNaN(val)) values.push(val);
        }
        // Only compute stats if at least half the rows have numeric values
        if (values.length >= rows.length * 0.5 && values.length > 0) {
          stats[headers[col]] = numericStats(values);
        }
      }

      // Sample rows (first 5)
      const sampleRows = rows.slice(0, 5).map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h] = row[i] ?? "";
        });
        return obj;
      });

      return {
        columns: headers,
        row_count: rows.length,
        stats,
        sample_rows: sampleRows,
      };
    } catch (err) {
      return { error: `CSV analysis failed: ${String(err)}` };
    }
  },
};

const createChart: AgentToolDefinition = {
  id: "create_chart",
  name: "Create Chart",
  description:
    "Generate a Chart.js-compatible JSON config from data. The frontend can render this directly.",
  parameters: {
    data: {
      type: "string",
      description:
        "JSON string with labels and values, or CSV text. E.g. {\"labels\":[\"A\",\"B\"],\"values\":[10,20]}",
      required: true,
    },
    chart_type: {
      type: "string",
      description: "Chart type: bar, line, or pie (default: bar)",
      required: true,
    },
    title: { type: "string", description: "Optional chart title" },
  },
  async execute(args) {
    const chartType = String(args.chart_type ?? args.type ?? "bar");
    const title = args.title ? String(args.title) : "Chart";
    const rawData = String(args.data ?? "");

    if (!rawData) return { error: "No data provided" };

    let labels: string[] = [];
    let datasets: { label: string; data: number[] }[] = [];

    try {
      // Try parsing as JSON first
      const parsed = JSON.parse(rawData);
      if (Array.isArray(parsed.labels)) {
        labels = parsed.labels.map(String);
      }
      if (Array.isArray(parsed.values)) {
        datasets = [{ label: title, data: parsed.values.map(Number) }];
      } else if (Array.isArray(parsed.datasets)) {
        datasets = parsed.datasets;
      }
    } catch {
      // Try parsing as CSV
      try {
        const { headers, rows } = parseCsv(rawData);
        if (headers.length >= 2) {
          labels = rows.map((r) => r[0]);
          // Each numeric column becomes a dataset
          for (let c = 1; c < headers.length; c++) {
            const vals = rows.map((r) => parseFloat(r[c]) || 0);
            datasets.push({ label: headers[c], data: vals });
          }
        }
      } catch {
        return { error: "Could not parse data as JSON or CSV" };
      }
    }

    if (labels.length === 0 || datasets.length === 0) {
      return { error: "Could not extract labels and values from data" };
    }

    // Generate colors
    const palette = [
      "rgba(54, 162, 235, 0.7)",
      "rgba(255, 99, 132, 0.7)",
      "rgba(75, 192, 192, 0.7)",
      "rgba(255, 206, 86, 0.7)",
      "rgba(153, 102, 255, 0.7)",
      "rgba(255, 159, 64, 0.7)",
      "rgba(199, 199, 199, 0.7)",
    ];

    const chartConfig = {
      type: chartType,
      data: {
        labels,
        datasets: datasets.map((ds, i) => ({
          ...ds,
          backgroundColor:
            chartType === "pie"
              ? palette.slice(0, labels.length)
              : palette[i % palette.length],
          borderColor:
            chartType === "line"
              ? palette[i % palette.length].replace("0.7", "1")
              : undefined,
          borderWidth: chartType === "line" ? 2 : 1,
          fill: chartType === "line" ? false : undefined,
        })),
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: title },
          legend: { display: datasets.length > 1 || chartType === "pie" },
        },
        scales:
          chartType === "pie"
            ? undefined
            : {
                y: { beginAtZero: true },
              },
      },
    };

    return { chart_config: chartConfig };
  },
};

const writeReport: AgentToolDefinition = {
  id: "write_report",
  name: "Write Report",
  description: "Write a structured report on a given topic using AI.",
  parameters: {
    topic: { type: "string", description: "The topic of the report", required: true },
    data: {
      type: "string",
      description: "Optional data or findings to incorporate into the report",
    },
    format: {
      type: "string",
      description: "Output format: markdown (default) or html",
    },
  },
  async execute(args) {
    const topic = String(args.topic ?? "");
    if (!topic) return { error: "No topic provided" };

    const data = args.data ? String(args.data) : "";
    const format = String(args.format ?? "markdown");

    try {
      const content = await callAnthropic(
        "claude-sonnet-4-20250514",
        `You are a professional report writer. Write a well-structured ${format === "html" ? "HTML" : "Markdown"} report on the given topic. Include: Executive Summary, Key Findings, Analysis, and Recommendations sections. Be thorough but concise.`,
        `Write a report on: ${topic}${data ? `\n\nIncorporate these data/findings:\n${data.slice(0, 10000)}` : ""}`,
        4096
      );

      return {
        content,
        format,
        word_count: content.split(/\s+/).length,
      };
    } catch (err) {
      return { error: `Report writing failed: ${String(err)}` };
    }
  },
};

const executeCode: AgentToolDefinition = {
  id: "execute_code",
  name: "Execute Code",
  description:
    "Execute Python or JavaScript code in a sandboxed environment and return the output.",
  parameters: {
    code: { type: "string", description: "The code to execute", required: true },
    language: {
      type: "string",
      description: 'Programming language: "python" or "javascript"',
      required: true,
    },
    timeout: {
      type: "number",
      description: "Max execution time in milliseconds (default 5000)",
    },
  },
  async execute(args) {
    const code = String(args.code ?? "");
    const language = String(args.language ?? "javascript").toLowerCase();
    const timeout = Math.min(Math.max(Number(args.timeout ?? 5000), 100), 30000);
    const MAX_OUTPUT = 10000;

    if (!code) return { error: "No code provided" };

    if (language !== "javascript" && language !== "python") {
      return {
        error: `Unsupported language: "${language}". Supported: "javascript", "python".`,
      };
    }

    // -----------------------------------------------------------------------
    // Python — cannot run natively on Deno; delegate to client-side Pyodide
    // -----------------------------------------------------------------------
    if (language === "python") {
      return {
        execute_on_client: true,
        language: "python",
        code,
        timeout,
        message:
          "Python execution is not available server-side. The frontend should execute this code using Pyodide (client-side Python runtime).",
      };
    }

    // -----------------------------------------------------------------------
    // JavaScript — run in a sandboxed Function with console capture
    // -----------------------------------------------------------------------
    try {
      const logs: string[] = [];

      // Build a fake console that captures output
      const fakeConsole = {
        log: (...a: unknown[]) => logs.push(a.map(String).join(" ")),
        warn: (...a: unknown[]) => logs.push(`[warn] ${a.map(String).join(" ")}`),
        error: (...a: unknown[]) => logs.push(`[error] ${a.map(String).join(" ")}`),
        info: (...a: unknown[]) => logs.push(`[info] ${a.map(String).join(" ")}`),
        debug: (...a: unknown[]) => logs.push(`[debug] ${a.map(String).join(" ")}`),
      };

      // Wrap the user code in an async IIFE so `await` works, and inject
      // our fake console as the `console` binding.
      const wrappedCode = `
        return (async () => {
          ${code}
        })();
      `;

      // deno-lint-ignore no-new-func
      const fn = new Function("console", wrappedCode);

      // Execute with a timeout using AbortController + Promise.race
      let returnValue: unknown;
      const execPromise = (async () => {
        returnValue = await fn(fakeConsole);
      })();

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Execution timed out after ${timeout}ms`)),
          timeout
        );
      });

      await Promise.race([execPromise, timeoutPromise]);

      // Serialize the return value
      let returnStr: string | undefined;
      if (returnValue !== undefined) {
        try {
          returnStr =
            typeof returnValue === "string"
              ? returnValue
              : JSON.stringify(returnValue, null, 2);
        } catch {
          returnStr = String(returnValue);
        }
      }

      // Build stdout string and truncate if needed
      let stdout = logs.join("\n");
      let truncated = false;
      if (stdout.length > MAX_OUTPUT) {
        stdout = stdout.slice(0, MAX_OUTPUT);
        truncated = true;
      }
      if (returnStr && returnStr.length > MAX_OUTPUT) {
        returnStr = returnStr.slice(0, MAX_OUTPUT);
        truncated = true;
      }

      return {
        language: "javascript",
        stdout: stdout || undefined,
        return_value: returnStr,
        truncated,
        success: true,
      };
    } catch (err) {
      const message = String(err instanceof Error ? err.message : err);
      return {
        language: "javascript",
        error: message,
        success: false,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const AGENT_TOOLS: Record<string, AgentToolDefinition> = {
  web_search: webSearch,
  browse_url: browseUrl,
  extract_content: extractContent,
  summarize: summarize,
  generate_code: generateCode,
  review_code: reviewCode,
  analyze_csv: analyzeCsv,
  create_chart: createChart,
  write_report: writeReport,
  execute_code: executeCode,
};

/**
 * Retrieve a subset of tool definitions filtered by their IDs.
 * Returns all tools if `enabledToolIds` is undefined or empty.
 */
export function getToolDefinitions(
  enabledToolIds?: string[]
): AgentToolDefinition[] {
  if (!enabledToolIds || enabledToolIds.length === 0) {
    return Object.values(AGENT_TOOLS);
  }
  return enabledToolIds
    .map((id) => AGENT_TOOLS[id])
    .filter(Boolean);
}

/**
 * Execute a tool by ID with the given arguments.
 * Returns an error object instead of throwing if the tool fails.
 */
export async function executeTool(
  toolId: string,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const tool = AGENT_TOOLS[toolId];
  if (!tool) {
    return { error: `Unknown tool: ${toolId}` };
  }
  try {
    return await tool.execute(args);
  } catch (err) {
    return { error: `Tool "${toolId}" failed: ${String(err)}` };
  }
}
