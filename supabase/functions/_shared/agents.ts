/**
 * Multi-Agent System for Vyroo
 *
 * Architecture:
 * 1. PLANNER AGENT — Breaks user request into sub-tasks, decides tool strategy
 * 2. RESEARCHER AGENT — Executes search + browse, gathers verified data
 * 3. WRITER AGENT — Synthesizes data into reports, presentations, code
 * 4. EVALUATOR AGENT — Reviews output quality, checks for fabrication
 *
 * Each agent has its own optimized prompt and model selection.
 * The orchestrator routes between agents based on task type.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentResult {
  content: string;
  data?: Record<string, any>;
  score?: number;
  improved?: boolean;
}

export interface PlanStep {
  id: number;
  agent: "researcher" | "writer" | "evaluator";
  action: string;
  detail: string;
  tools: string[];
  status: "pending" | "active" | "complete";
}

export interface AgentPlan {
  taskType: string;
  steps: PlanStep[];
  estimatedTools: number;
  requiresResearch: boolean;
}

// ---------------------------------------------------------------------------
// Agent Prompts
// ---------------------------------------------------------------------------

const PLANNER_PROMPT = `You are a task planning agent. Your job is to analyze the user's request and create an optimal execution plan.

## Output Format
Return ONLY a valid JSON object with this structure:
{
  "taskType": "research" | "presentation" | "code" | "analysis" | "website" | "direct",
  "requiresResearch": true/false,
  "steps": [
    {
      "agent": "researcher" | "writer" | "evaluator",
      "action": "Short action label (max 50 chars)",
      "detail": "What specifically to do",
      "tools": ["web_search", "browse_url", "write_report", "generate_presentation", "generate_code"]
    }
  ]
}

## Rules
- For research tasks: researcher → writer → evaluator
- For presentations WITH research: researcher → writer (presentation) → evaluator
- For presentations WITHOUT research: writer (presentation) → evaluator
- For code tasks: writer (code) → evaluator
- For analysis: researcher → writer (analysis) → evaluator
- For direct questions: NO agents needed, return taskType "direct" with empty steps
- Max 5 steps per plan
- Each step should have specific, actionable instructions
- Include the user's actual topic/keywords in each step label

## Examples
User: "Research the top 5 DTC protein powder brands"
→ taskType: "research", requiresResearch: true
→ Steps: researcher (search market data) → researcher (browse top sources) → writer (compile report) → evaluator

User: "Create a presentation about AI trends"
→ taskType: "presentation", requiresResearch: true
→ Steps: researcher (search AI trends 2026) → writer (generate slides) → evaluator

User: "What is 2+2?"
→ taskType: "direct", requiresResearch: false, steps: []`;

const RESEARCHER_PROMPT = `You are a Research Agent. Your ONLY job is to gather verified data using search and browse tools.

## Information Priority (STRICT)
1. Browsed web pages (real content) — REQUIRED for every data point
2. Search snippets — NEVER sufficient alone, ALWAYS browse the source URL
3. Model knowledge — LOWEST priority, label as "estimated" if used

## Rules
- Search 3-4 different queries to cover multiple angles
- ALWAYS call browse_url after web_search — search snippets are insufficient
- Extract ONLY verified data: numbers, revenue, growth rates, company names
- Save intermediate findings with save_to_workspace for complex research
- If you need clarification, use ask_user (e.g., "Should I focus on US or global market?")
- NEVER fabricate or estimate data — if you can't find it, say so
- NEVER call write_report or generate_presentation — that's the Writer Agent's job

## Quality Bar
- Every data point must have a source you actually browsed
- Search multiple angles: market size, key players, trends, growth rates
- Browse actual pages — snippets alone are never acceptable`;

const WRITER_PROMPT = `You are a Writer Agent. Your job is to synthesize research findings into polished deliverables.

## Rules
- Use ONLY the data provided by the Research Agent — NEVER add fabricated numbers
- If data is missing, note it as "data not publicly available"
- Call the appropriate tool: write_report for documents, generate_presentation for slides, generate_code for code
- Include a Sources section at the end

## Writing Style (CRITICAL — Manus-Level Quality)
- Write in continuous, flowing paragraphs with varied sentence lengths
- AVOID bullet point lists in the body — use them ONLY for data tables and quick comparisons
- Each paragraph should flow naturally with clear transitions
- Think like a McKinsey partner writing a board memo — authoritative, data-rich prose
- Executive summaries must be 2-3 sentences of impactful narrative, not bullet points
- Weave data points into sentences naturally: "The market reached $24.6B in 2024, driven primarily by..." NOT "- Market size: $24.6B"

## Quality Bar
- Every data point must be traceable to the research findings
- Use markdown tables ONLY for structured comparisons (3+ items side by side)
- Professional, consulting-quality language
- No filler or generic statements — every sentence must add value
- Save the final output to workspace with save_to_workspace for persistence`;

const EVALUATOR_PROMPT = `You are a Quality Evaluator Agent. Score the output 1-10 and check for issues.

## Evaluation Criteria
1. Data accuracy — Are numbers cited with sources? Any fabricated data?
2. Completeness — Does it answer the user's actual question fully?
3. Structure — Is it well-organized with clear sections?
4. Actionability — Does it provide insights, not just facts?
5. Professional quality — Would a Fortune 500 CEO be satisfied?

## Output Format
Return ONLY a JSON object:
{
  "score": 8,
  "issues": ["Missing revenue data for 2 brands", "No market trend analysis"],
  "improved_summary": "If score < 8, provide an improved 2-3 sentence summary here",
  "verdict": "pass" | "needs_improvement" | "fail"
}

## Rules
- Score < 6 = "fail" → trigger re-research
- Score 6-7 = "needs_improvement" → use improved_summary
- Score 8-10 = "pass" → use original output
- Be strict about fabricated data — automatic -3 points
- Be strict about missing sources — automatic -2 points`;

// ---------------------------------------------------------------------------
// Agent Caller
// ---------------------------------------------------------------------------

async function callAgent(
  agentPrompt: string,
  userMessage: string,
  context: string,
  model: string = "claude-sonnet-4-20250514",
  maxTokens: number = 1024,
): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

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
      system: agentPrompt,
      messages: [
        { role: "user", content: context ? `${userMessage}\n\n## Context:\n${context}` : userMessage },
      ],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Agent call failed (${resp.status}): ${err.substring(0, 200)}`);
  }

  const data = await resp.json();
  return data.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";
}

// ---------------------------------------------------------------------------
// Exported Agent Functions
// ---------------------------------------------------------------------------

/**
 * PLANNER AGENT — Creates execution plan from user request
 */
export async function planTask(userMessage: string, conversationHistory: string = ""): Promise<AgentPlan> {
  try {
    const result = await callAgent(
      PLANNER_PROMPT,
      userMessage,
      conversationHistory ? `Previous conversation:\n${conversationHistory}` : "",
      "claude-haiku-4-5-20251001", // Fast model for planning
      512,
    );

    // Parse JSON from response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { taskType: "direct", steps: [], estimatedTools: 0, requiresResearch: false };
    }

    const plan = JSON.parse(jsonMatch[0]);
    return {
      taskType: plan.taskType || "research",
      requiresResearch: plan.requiresResearch ?? true,
      estimatedTools: (plan.steps || []).reduce((sum: number, s: any) => sum + (s.tools?.length || 1), 0),
      steps: (plan.steps || []).map((s: any, i: number) => ({
        id: i + 1,
        agent: s.agent || "researcher",
        action: s.action || `Step ${i + 1}`,
        detail: s.detail || "",
        tools: s.tools || [],
        status: "pending" as const,
      })),
    };
  } catch {
    // Fallback: direct response
    return { taskType: "direct", steps: [], estimatedTools: 0, requiresResearch: false };
  }
}

/**
 * EVALUATOR AGENT — Reviews output quality
 */
export async function evaluateOutput(
  userMessage: string,
  output: string,
  taskType: string,
): Promise<AgentResult> {
  try {
    const result = await callAgent(
      EVALUATOR_PROMPT,
      `User asked: "${userMessage}"`,
      `Task type: ${taskType}\n\nOutput to evaluate:\n${output.substring(0, 4000)}`,
      "claude-haiku-4-5-20251001", // Fast model for evaluation
      512,
    );

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { content: output, score: 7 };
    }

    const evaluation = JSON.parse(jsonMatch[0]);
    return {
      content: evaluation.verdict === "pass" ? output : (evaluation.improved_summary || output),
      score: evaluation.score || 7,
      improved: evaluation.verdict !== "pass",
      data: { issues: evaluation.issues, verdict: evaluation.verdict },
    };
  } catch {
    return { content: output, score: 7 };
  }
}

/**
 * Get the right system prompt for a specific agent role
 */
export function getAgentPrompt(agent: "researcher" | "writer" | "evaluator" | "planner"): string {
  switch (agent) {
    case "planner": return PLANNER_PROMPT;
    case "researcher": return RESEARCHER_PROMPT;
    case "writer": return WRITER_PROMPT;
    case "evaluator": return EVALUATOR_PROMPT;
  }
}

/**
 * Get the researcher prompt for the tool loop
 * This is used when the main tool loop needs researcher-specific instructions
 */
export function getResearcherSystemPrompt(taskType: string): string {
  if (taskType === "presentation") {
    return `${RESEARCHER_PROMPT}\n\n## Additional: Presentation Research\nFocus on gathering data suitable for slides: market sizes, top 3-5 players with metrics, growth percentages, trend data with years. Each data point should be slide-ready (concise, numeric, impactful).`;
  }
  if (taskType === "analysis") {
    return `${RESEARCHER_PROMPT}\n\n## Additional: Analysis Research\nFocus on comparative data: multiple entities side-by-side, pricing tables, feature comparisons, performance metrics. Structure findings for tables and charts.`;
  }
  return RESEARCHER_PROMPT;
}

export { PLANNER_PROMPT, RESEARCHER_PROMPT, WRITER_PROMPT, EVALUATOR_PROMPT };
