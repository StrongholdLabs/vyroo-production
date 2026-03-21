// Agent Tool Registry: defines available tools for agent execution
// Each tool has an ID, metadata, and an execute function that returns structured output.
// Currently returns realistic mock data — in production these will call real APIs.

export interface AgentToolDefinition {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  execute: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Tool implementations (mock stubs)
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
    return {
      results: [
        {
          title: `Top result for "${query}"`,
          url: `https://example.com/search?q=${encodeURIComponent(query)}`,
          snippet: `This is a highly relevant result about ${query}. It covers the key points and provides detailed analysis.`,
        },
        {
          title: `${query} — Wikipedia`,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(/\s+/g, "_"))}`,
          snippet: `${query} refers to a broad topic encompassing multiple perspectives and historical context.`,
        },
        {
          title: `Latest research on ${query}`,
          url: `https://scholar.example.com/papers/${encodeURIComponent(query)}`,
          snippet: `Recent academic findings related to ${query}, published in leading journals.`,
        },
      ],
    };
  },
};

const browseUrl: AgentToolDefinition = {
  id: "browse_url",
  name: "Browse URL",
  description: "Navigate to a URL and extract its content.",
  parameters: {
    url: { type: "string", description: "The URL to browse", required: true },
  },
  async execute(args) {
    const url = String(args.url ?? "https://example.com");
    return {
      title: `Page at ${new URL(url).hostname}`,
      content: `This is the extracted text content from ${url}. The page contains detailed information about the topic, including sections on background, methodology, results, and conclusions. Key takeaways are highlighted throughout.`,
      links: [
        { text: "Related Article", href: `${url}/related` },
        { text: "References", href: `${url}/references` },
      ],
    };
  },
};

const extractContent: AgentToolDefinition = {
  id: "extract_content",
  name: "Extract Content",
  description: "Extract specific content from a URL using an optional CSS selector.",
  parameters: {
    url: { type: "string", description: "The URL to extract from", required: true },
    selector: { type: "string", description: "Optional CSS selector to target specific elements" },
  },
  async execute(args) {
    const url = String(args.url ?? "https://example.com");
    const selector = args.selector ? String(args.selector) : "body";
    return {
      text: `Extracted content from ${url} using selector "${selector}". The main content discusses several important points with supporting evidence and data visualizations.`,
      metadata: {
        url,
        selector,
        word_count: 342,
        extracted_at: new Date().toISOString(),
      },
    };
  },
};

const summarize: AgentToolDefinition = {
  id: "summarize",
  name: "Summarize",
  description: "Generate a concise summary of the provided text.",
  parameters: {
    text: { type: "string", description: "The text to summarize", required: true },
    max_length: { type: "number", description: "Maximum length of the summary in words" },
  },
  async execute(args) {
    const text = String(args.text ?? "");
    const maxLength = Number(args.max_length ?? 100);
    const words = text.split(/\s+/).slice(0, Math.min(maxLength, 50));
    return {
      summary: words.length > 10
        ? `Summary: ${words.slice(0, 10).join(" ")}... The key points are: (1) the main argument is well-supported, (2) evidence is drawn from multiple sources, (3) conclusions align with current research.`
        : `Summary of provided text covering the main themes and conclusions in ${maxLength} words or fewer.`,
    };
  },
};

const generateCode: AgentToolDefinition = {
  id: "generate_code",
  name: "Generate Code",
  description: "Generate code in the specified language based on a description.",
  parameters: {
    language: { type: "string", description: "The programming language", required: true },
    description: { type: "string", description: "Description of what the code should do", required: true },
  },
  async execute(args) {
    const language = String(args.language ?? "typescript");
    const description = String(args.description ?? "a utility function");
    const codeTemplates: Record<string, string> = {
      typescript: `// ${description}\nexport function execute(input: unknown): unknown {\n  // Implementation\n  console.log("Executing: ${description}");\n  return { success: true, input };\n}\n`,
      python: `# ${description}\ndef execute(input):\n    \"\"\"${description}\"\"\"\n    print(f"Executing: ${description}")\n    return {"success": True, "input": input}\n`,
      javascript: `// ${description}\nfunction execute(input) {\n  // Implementation\n  console.log("Executing: ${description}");\n  return { success: true, input };\n}\nmodule.exports = { execute };\n`,
    };
    return {
      code: codeTemplates[language.toLowerCase()] ?? codeTemplates.typescript,
      filename: `generated.${language === "python" ? "py" : language === "javascript" ? "js" : "ts"}`,
    };
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
    const language = String(args.language ?? "typescript");
    return {
      issues: [
        {
          severity: "warning",
          line: 3,
          message: "Consider adding input validation before processing.",
        },
        {
          severity: "info",
          line: 7,
          message: "This function could benefit from explicit return type annotation.",
        },
      ],
      suggestions: [
        `Add error handling for edge cases in the ${language} implementation.`,
        "Consider extracting magic numbers into named constants.",
        "Add JSDoc/docstring comments for public API surfaces.",
      ],
    };
  },
};

const analyzeCsv: AgentToolDefinition = {
  id: "analyze_csv",
  name: "Analyze CSV",
  description: "Analyze CSV data and answer questions about it.",
  parameters: {
    data: { type: "string", description: "The CSV data or reference to analyze", required: true },
    question: { type: "string", description: "The question to answer about the data", required: true },
  },
  async execute(args) {
    const question = String(args.question ?? "What are the trends?");
    return {
      answer: `Based on the analysis of the provided dataset: the data shows a clear upward trend over the measured period. In response to "${question}", the key finding is that the primary metric increased by approximately 23% with statistical significance (p < 0.05).`,
      chart_data: {
        type: "line",
        labels: ["Q1", "Q2", "Q3", "Q4"],
        datasets: [
          {
            label: "Primary Metric",
            data: [42, 55, 61, 78],
          },
        ],
      },
    };
  },
};

const createChart: AgentToolDefinition = {
  id: "create_chart",
  name: "Create Chart",
  description: "Create a chart visualization from data.",
  parameters: {
    data: { type: "string", description: "The data to visualize", required: true },
    type: { type: "string", description: "Chart type (bar, line, pie, scatter)", required: true },
  },
  async execute(args) {
    const chartType = String(args.type ?? "bar");
    return {
      chart_url: `https://charts.example.com/render/${chartType}/${Date.now()}`,
      chart_config: {
        type: chartType,
        data: {
          labels: ["Category A", "Category B", "Category C", "Category D"],
          datasets: [
            {
              label: "Values",
              data: [30, 50, 20, 40],
            },
          ],
        },
        options: {
          responsive: true,
          title: { display: true, text: `Generated ${chartType} chart` },
        },
      },
    };
  },
};

const writeReport: AgentToolDefinition = {
  id: "write_report",
  name: "Write Report",
  description: "Write a structured report on a given topic.",
  parameters: {
    topic: { type: "string", description: "The topic of the report", required: true },
    outline: { type: "string", description: "Optional outline or structure for the report" },
  },
  async execute(args) {
    const topic = String(args.topic ?? "Untitled Report");
    return {
      content: `# Report: ${topic}\n\n## Executive Summary\nThis report provides a comprehensive analysis of ${topic}, examining current trends, key findings, and actionable recommendations.\n\n## Key Findings\n1. The primary trend shows significant growth in the target area.\n2. Stakeholder feedback has been largely positive.\n3. Implementation timelines align with projected milestones.\n\n## Recommendations\n- Continue monitoring key performance indicators.\n- Expand scope to include secondary factors.\n- Schedule follow-up analysis in 30 days.\n\n## Conclusion\nThe analysis of ${topic} reveals promising opportunities for further development and optimization.`,
      word_count: 87,
    };
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
 * Throws if the tool is not found.
 */
export async function executeTool(
  toolId: string,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const tool = AGENT_TOOLS[toolId];
  if (!tool) {
    throw new Error(`Unknown tool: ${toolId}`);
  }
  return tool.execute(args);
}
