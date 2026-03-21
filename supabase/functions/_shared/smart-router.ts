// Smart Model Router: optimizes model selection for cost and quality
// Auto-routes messages to the best model based on content analysis, user plan, and available keys

export type UserPlan = "free" | "pro" | "team" | "enterprise";

export type ModelTier = "budget" | "standard" | "premium";

export interface SelectOptimalModelOptions {
  userSelectedModel: string | null;
  messageContent: string;
  conversationLength: number;
  userPlan: UserPlan;
  availableKeys: { anthropic?: boolean; openai?: boolean; google?: boolean };
}

export interface ModelCost {
  inputCostPer1M: number;
  outputCostPer1M: number;
}

// --- Model tier classification ---

export const MODEL_TIERS: Record<string, ModelTier> = {
  // Budget tier - fast, cheap
  "claude-haiku-4-5-20251001": "budget",
  "gpt-4o-mini": "budget",
  "gemini-2.0-flash": "budget",
  "llama-3.3-70b": "budget",

  // Standard tier - balanced
  "claude-sonnet-4-20250514": "standard",
  "gpt-4o": "standard",
  "gemini-2.5-pro": "standard",
  "llama-4-scout": "standard",

  // Premium tier - most capable
  "claude-opus-4-20250514": "premium",
};

// --- Cost estimates per model (USD per 1M tokens) ---

const MODEL_COSTS: Record<string, ModelCost> = {
  // Anthropic
  "claude-haiku-4-5-20251001": { inputCostPer1M: 0.80, outputCostPer1M: 4.00 },
  "claude-sonnet-4-20250514": { inputCostPer1M: 3.00, outputCostPer1M: 15.00 },
  "claude-opus-4-20250514": { inputCostPer1M: 15.00, outputCostPer1M: 75.00 },

  // OpenAI
  "gpt-4o-mini": { inputCostPer1M: 0.15, outputCostPer1M: 0.60 },
  "gpt-4o": { inputCostPer1M: 2.50, outputCostPer1M: 10.00 },

  // Google
  "gemini-2.0-flash": { inputCostPer1M: 0.10, outputCostPer1M: 0.40 },
  "gemini-2.5-pro": { inputCostPer1M: 1.25, outputCostPer1M: 10.00 },

  // Together AI (Meta Llama)
  "llama-3.3-70b": { inputCostPer1M: 0.88, outputCostPer1M: 0.88 },
  "llama-4-scout": { inputCostPer1M: 0.18, outputCostPer1M: 0.30 },
};

// --- Free tier allowed models ---

const FREE_TIER_MODELS = new Set([
  "claude-haiku-4-5-20251001",
  "gpt-4o-mini",
  "gemini-2.0-flash",
]);

// --- Message classification patterns ---

const CODE_PATTERNS = [
  /```[\s\S]*```/, // code blocks
  /\b(write|create|build|implement|refactor|debug|fix)\s+(a\s+)?(code|function|class|component|script|program|module|api|endpoint)/i,
  /\b(function|class|const|let|var|import|export|def|async|await)\b.*[{(]/,
  /\b(debug|TypeError|SyntaxError|ReferenceError|stack\s*trace|error\s*at\s*line)\b/i,
  /\b(html|css|javascript|typescript|python|rust|go|java|sql|react|vue|angular)\b/i,
];

const MATH_DATA_PATTERNS = [
  /\b(calculate|compute|sum|average|median|percentage|ratio|formula)\b/i,
  /\b(data|dataset|csv|json|table|chart|graph|plot|statistics|regression)\b/i,
  /\b(analyze\s+(?:the\s+)?(?:data|numbers|results|metrics))\b/i,
  /\d+\s*[+\-*/^%]\s*\d+/, // arithmetic expressions
  /\b\d{3,}\b/, // large numbers suggest data/math context
];

const COMPLEX_PATTERNS = [
  /\b(analyze|compare|contrast|explain\s+in\s+detail|elaborate|comprehensive|thorough)\b/i,
  /\b(pros?\s+and\s+cons?|advantages?\s+and\s+disadvantages?|trade-?offs?)\b/i,
  /\?.*\?/, // multiple question marks suggest multiple questions
  /\b(step[- ]by[- ]step|in[- ]depth|detailed|extensive)\b/i,
];

const SIMPLE_PATTERNS = [
  /^(hi|hello|hey|thanks|thank you|ok|okay|yes|no|sure|got it|cool)\s*[.!?]?$/i,
  /^(what|who|when|where|how)\s+(is|are|was|were|do|does|did)\s+\w+\s*\??\s*$/i, // simple single questions
];

// --- Classification ---

type MessageCategory = "simple" | "code" | "math_data" | "complex" | "general";

function classifyMessage(content: string): MessageCategory {
  const trimmed = content.trim();

  // Simple messages: short and matches simple patterns
  if (trimmed.length < 50 && SIMPLE_PATTERNS.some((p) => p.test(trimmed))) {
    return "simple";
  }

  // Code-related
  if (CODE_PATTERNS.some((p) => p.test(trimmed))) {
    return "code";
  }

  // Math/data
  if (MATH_DATA_PATTERNS.some((p) => p.test(trimmed))) {
    return "math_data";
  }

  // Long or complex
  if (trimmed.length > 500 || COMPLEX_PATTERNS.some((p) => p.test(trimmed))) {
    return "complex";
  }

  return "general";
}

// --- Model selection for each category with provider availability ---

interface ModelCandidate {
  model: string;
  provider: "anthropic" | "openai" | "google";
}

const CATEGORY_PREFERENCES: Record<MessageCategory, ModelCandidate[]> = {
  simple: [
    { model: "claude-haiku-4-5-20251001", provider: "anthropic" },
    { model: "gpt-4o-mini", provider: "openai" },
    { model: "gemini-2.0-flash", provider: "google" },
  ],
  code: [
    { model: "claude-sonnet-4-20250514", provider: "anthropic" },
    { model: "gpt-4o", provider: "openai" },
    { model: "gemini-2.5-pro", provider: "google" },
  ],
  math_data: [
    { model: "gpt-4o", provider: "openai" },
    { model: "claude-sonnet-4-20250514", provider: "anthropic" },
    { model: "gemini-2.5-pro", provider: "google" },
  ],
  complex: [
    { model: "claude-sonnet-4-20250514", provider: "anthropic" },
    { model: "gpt-4o", provider: "openai" },
    { model: "gemini-2.5-pro", provider: "google" },
  ],
  general: [
    { model: "claude-haiku-4-5-20251001", provider: "anthropic" },
    { model: "gpt-4o-mini", provider: "openai" },
    { model: "gemini-2.0-flash", provider: "google" },
  ],
};

// --- Public API ---

/**
 * Select the optimal model based on message content, user plan, and available API keys.
 * Always respects an explicit user model selection.
 */
export function selectOptimalModel(options: SelectOptimalModelOptions): string {
  const { userSelectedModel, messageContent, userPlan, availableKeys } = options;

  // 1. If user explicitly selected a model, honor it (with free tier gate)
  if (userSelectedModel) {
    if (userPlan === "free" && !FREE_TIER_MODELS.has(userSelectedModel)) {
      // Downgrade to the best available free model
      return pickFirstAvailable(
        [
          { model: "claude-haiku-4-5-20251001", provider: "anthropic" },
          { model: "gpt-4o-mini", provider: "openai" },
          { model: "gemini-2.0-flash", provider: "google" },
        ],
        availableKeys
      );
    }
    return userSelectedModel;
  }

  // 2. Auto-route based on message classification
  const category = classifyMessage(messageContent);
  const candidates = CATEGORY_PREFERENCES[category];

  // For free tier, filter to allowed models only
  if (userPlan === "free") {
    const freeCandidates = candidates
      .filter((c) => FREE_TIER_MODELS.has(c.model))
      .concat(
        // Add free fallbacks if the category doesn't have any free models
        [
          { model: "claude-haiku-4-5-20251001", provider: "anthropic" as const },
          { model: "gpt-4o-mini", provider: "openai" as const },
          { model: "gemini-2.0-flash", provider: "google" as const },
        ]
      );
    return pickFirstAvailable(freeCandidates, availableKeys);
  }

  // For paid tiers, use full preference list with availability check
  return pickFirstAvailable(candidates, availableKeys);
}

/**
 * Pick the first model whose provider key is available.
 * Falls back to the first model in the list if no keys match (the chat function
 * will handle the missing-key error).
 */
function pickFirstAvailable(
  candidates: ModelCandidate[],
  availableKeys: { anthropic?: boolean; openai?: boolean; google?: boolean }
): string {
  for (const candidate of candidates) {
    if (availableKeys[candidate.provider]) {
      return candidate.model;
    }
  }
  // No key available for any candidate — return first anyway; the chat
  // edge function will surface the "no API key" error to the user.
  return candidates[0]?.model ?? "claude-haiku-4-5-20251001";
}

/**
 * Get estimated cost per 1M tokens for a given model.
 */
export function getModelCostEstimate(model: string): ModelCost {
  return MODEL_COSTS[model] ?? { inputCostPer1M: 0, outputCostPer1M: 0 };
}
