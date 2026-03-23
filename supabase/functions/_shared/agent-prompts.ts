// Agent Prompts: system prompts for the agent orchestration loop

import type { AgentToolDefinition } from "./agent-tools.ts";

interface AgentTemplateInfo {
  name: string;
  description: string;
  system_prompt: string;
  capabilities: string[];
}

interface StepInfo {
  step_number: number;
  label: string;
  type: string;
  description: string;
}

interface StepResult {
  step_number: number;
  label: string;
  output: Record<string, unknown>;
}

/**
 * Generates a planning system prompt.
 * The AI should respond with a JSON array of step objects.
 */
export function getPlanningPrompt(
  template: AgentTemplateInfo,
  goal: string,
  tools: AgentToolDefinition[]
): string {
  const toolList = tools
    .map(
      (t) =>
        `- **${t.id}**: ${t.description}. Parameters: ${Object.entries(t.parameters)
          .map(([k, v]) => `${k} (${v.type}${v.required ? ", required" : ""})`)
          .join(", ")}`
    )
    .join("\n");

  return `You are ${template.name}, an AI agent. ${template.system_prompt}

Your capabilities: ${template.capabilities.join(", ")}

AVAILABLE TOOLS:
${toolList}

USER'S GOAL:
${goal}

YOUR TASK:
Create a step-by-step execution plan to accomplish the user's goal. Each step should be a concrete, actionable task that uses one of the available tools or performs an LLM reasoning step.

Respond with ONLY a valid JSON array (no markdown fences, no explanation). Each element must have:
- "label": short human-readable name for the step (max 60 chars)
- "type": one of "search", "browse", "code", "write", "think", "tool_call", "llm_call", "delegate"
- "description": detailed description of what this step does
- "tool": the tool ID to use (optional, only if the step uses a tool)
- "tool_args": arguments for the tool as an object (optional, only if tool is specified)

Keep the plan focused — aim for 3–8 steps. Prefer fewer, high-impact steps over many small ones.

Example response format:
[
  {"label": "Research the topic", "type": "search", "description": "Search for current information about X", "tool": "web_search", "tool_args": {"query": "X latest developments"}},
  {"label": "Analyze findings", "type": "think", "description": "Review search results and identify key themes"},
  {"label": "Write summary", "type": "write", "description": "Produce a concise summary report", "tool": "write_report", "tool_args": {"topic": "X analysis"}}
]`;
}

/**
 * Generates a prompt for executing a specific step within the plan.
 */
export function getStepExecutionPrompt(
  template: AgentTemplateInfo,
  step: StepInfo,
  context: {
    goal: string;
    previousResults: StepResult[];
    customInstructions?: string;
  }
): string {
  const prevContext =
    context.previousResults.length > 0
      ? `\nPREVIOUS STEP RESULTS:\n${context.previousResults
          .map(
            (r) =>
              `Step ${r.step_number} (${r.label}): ${JSON.stringify(r.output).slice(0, 500)}`
          )
          .join("\n")}`
      : "";

  const customBlock = context.customInstructions
    ? `\nADDITIONAL INSTRUCTIONS:\n${context.customInstructions}`
    : "";

  return `You are ${template.name}, an AI agent. ${template.system_prompt}

OVERALL GOAL: ${context.goal}

CURRENT STEP (${step.step_number}): ${step.label}
STEP TYPE: ${step.type}
STEP DESCRIPTION: ${step.description}
${prevContext}${customBlock}

Execute this step thoroughly. Provide a detailed, actionable result. If this step involves analysis or reasoning, explain your thought process. If it involves content creation, produce high-quality output.

Respond with a clear, structured result for this step. Be concise but thorough.`;
}

/**
 * Generates a prompt for creating a final summary of the entire agent run.
 */
export function getSummaryPrompt(
  goal: string,
  stepResults: StepResult[]
): string {
  const resultsSummary = stepResults
    .map(
      (r) =>
        `Step ${r.step_number} — ${r.label}:\n${JSON.stringify(r.output).slice(0, 600)}`
    )
    .join("\n\n");

  return `You completed an AI agent run with the following goal and step results.

GOAL: ${goal}

STEP RESULTS:
${resultsSummary}

Produce a final summary that:
1. States whether the goal was achieved
2. Highlights the key findings or deliverables from each step
3. Notes any limitations or areas for improvement
4. Provides actionable next steps the user can take

Be concise (under 300 words). Use markdown formatting for readability.`;
}
