import { useState, useCallback } from "react";

export type AIProvider = "claude" | "openai" | "gemini" | "together";

export interface ModelOption {
  id: string;
  name: string;
  provider: AIProvider;
  description?: string;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: "claude", description: "Balanced performance" },
  { id: "claude-opus-4-20250514", name: "Claude Opus 4", provider: "claude", description: "Most capable Claude" },
  { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", provider: "claude", description: "Fast and lightweight" },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", description: "Flagship OpenAI model" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", description: "Cost-effective" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "gemini", description: "Fast and efficient" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "gemini", description: "Most capable Gemini" },
  { id: "llama-3.3-70b", name: "Llama 3.3 70B", provider: "together", description: "Open source, cost-effective" },
  { id: "llama-4-scout", name: "Llama 4 Scout", provider: "together", description: "Latest Meta model" },
];

const STORAGE_KEY = "vyroo-model-settings";

function getStoredSettings(): { provider: AIProvider; model: string } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore parse errors
  }
  return { provider: "claude", model: "claude-sonnet-4-20250514" };
}

export function useModelSettings() {
  const [settings, setSettings] = useState(getStoredSettings);

  const setModel = useCallback((modelId: string) => {
    const modelOption = AVAILABLE_MODELS.find((m) => m.id === modelId);
    if (!modelOption) return;

    const newSettings = { provider: modelOption.provider, model: modelId };
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  }, []);

  const currentModel = AVAILABLE_MODELS.find((m) => m.id === settings.model) ?? AVAILABLE_MODELS[0];

  return {
    provider: settings.provider,
    model: settings.model,
    currentModel,
    setModel,
    availableModels: AVAILABLE_MODELS,
  };
}
