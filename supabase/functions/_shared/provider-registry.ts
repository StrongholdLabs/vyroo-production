// Provider Registry: maps model prefixes to provider configurations

export interface ProviderConfig {
  id: string;
  name: string;
  prefixes: string[];
  baseUrl: string;
}

export const PROVIDER_REGISTRY: Record<string, ProviderConfig> = {
  openai: {
    id: "openai",
    name: "OpenAI",
    prefixes: ["gpt-", "o1-", "o3-"],
    baseUrl: "https://api.openai.com/v1",
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    prefixes: ["claude-"],
    baseUrl: "https://api.anthropic.com/v1",
  },
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    prefixes: ["gemini-"],
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
  },
  together: {
    id: "together",
    name: "Together AI",
    prefixes: ["llama-", "meta-"],
    baseUrl: "https://api.together.xyz/v1",
  },
};

// Map from provider registry IDs to the DB provider column values
// The DB uses 'claude' while the registry uses 'anthropic'
const PROVIDER_TO_DB_KEY: Record<string, string> = {
  anthropic: "claude",
  openai: "openai",
  gemini: "gemini",
  together: "together",
};

/**
 * Resolve which provider handles a given model ID based on prefix matching.
 */
export function resolveProvider(
  modelId: string
): { providerId: string; config: ProviderConfig; dbProvider: string } {
  for (const [id, config] of Object.entries(PROVIDER_REGISTRY)) {
    if (config.prefixes.some((prefix) => modelId.startsWith(prefix))) {
      return {
        providerId: id,
        config,
        dbProvider: PROVIDER_TO_DB_KEY[id] || id,
      };
    }
  }
  // Default to anthropic if no prefix matches
  const fallback = PROVIDER_REGISTRY.anthropic;
  return {
    providerId: "anthropic",
    config: fallback,
    dbProvider: "claude",
  };
}

/**
 * Returns just the provider ID string for a given model.
 */
export function getProviderForModel(model: string): string {
  return resolveProvider(model).providerId;
}

/**
 * Returns an ordered list of fallback provider DB keys to try if the primary fails.
 */
export function getFallbackChain(providerId: string): string[] {
  const chains: Record<string, string[]> = {
    anthropic: ["openai", "gemini"],
    openai: ["claude", "gemini"],
    gemini: ["claude", "openai"],
    together: ["openai", "claude"],
  };
  return chains[providerId] || ["claude"];
}
