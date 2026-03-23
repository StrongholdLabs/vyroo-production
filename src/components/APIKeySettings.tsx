import { useState, useEffect } from "react";
import { Key, Check, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { AIProvider } from "@/hooks/useModelSettings";

interface KeyStatus {
  provider: string;
  configured: boolean;
}

interface ProviderField {
  provider: AIProvider;
  label: string;
  placeholder: string;
}

const PROVIDER_FIELDS: ProviderField[] = [
  { provider: "claude", label: "Anthropic (Claude)", placeholder: "sk-ant-..." },
  { provider: "openai", label: "OpenAI", placeholder: "sk-..." },
  { provider: "gemini", label: "Google (Gemini)", placeholder: "AIza..." },
  { provider: "together", label: "Together AI (Llama)", placeholder: "tok-..." },
];

export function APIKeySettings() {
  const [keyValues, setKeyValues] = useState<Record<string, string>>({});
  const [keyStatuses, setKeyStatuses] = useState<KeyStatus[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  useEffect(() => {
    loadKeyStatuses();
  }, []);

  const loadKeyStatuses = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/api-keys`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      setKeyStatuses(
        (data.keys || []).map((k: any) => ({ provider: k.provider, configured: true }))
      );
    } catch {
      // Silently fail if edge function isn't deployed
    }
  };

  const saveKey = async (provider: AIProvider, apiKey: string) => {
    if (!apiKey.trim()) return;
    setSaving(provider);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      await fetch(`${supabaseUrl}/functions/v1/api-keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ provider, apiKey }),
      });

      setKeyStatuses((prev) => {
        const filtered = prev.filter((k) => k.provider !== provider);
        return [...filtered, { provider, configured: true }];
      });

      setKeyValues((prev) => ({ ...prev, [provider]: "" }));
    } catch {
      // Handle error
    }

    setSaving(null);
  };

  const deleteKey = async (provider: string) => {
    setDeleting(provider);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      await fetch(`${supabaseUrl}/functions/v1/api-keys`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ provider }),
      });

      setKeyStatuses((prev) => prev.filter((k) => k.provider !== provider));
    } catch {
      // Handle error
    }

    setDeleting(null);
  };

  const isConfigured = (provider: string) =>
    keyStatuses.some((k) => k.provider === provider);

  const getKeyValue = (provider: string) => keyValues[provider] || "";

  const setKeyValue = (provider: string, value: string) =>
    setKeyValues((prev) => ({ ...prev, [provider]: value }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-foreground mb-1">API Keys</h3>
        <p className="text-xs text-muted-foreground">
          Add your API keys to enable AI chat. Keys are stored securely and never exposed to the browser.
        </p>
      </div>

      {PROVIDER_FIELDS.map((field) => (
        <div key={field.provider} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Key size={14} className="text-muted-foreground" />
              {field.label}
            </label>
            {isConfigured(field.provider) && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-success flex items-center gap-1">
                  <Check size={12} /> Configured
                </span>
                <button
                  onClick={() => deleteKey(field.provider)}
                  disabled={deleting === field.provider}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  {deleting === field.provider ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              value={getKeyValue(field.provider)}
              onChange={(e) => setKeyValue(field.provider, e.target.value)}
              placeholder={
                isConfigured(field.provider)
                  ? "Key already set (enter new to replace)"
                  : field.placeholder
              }
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={() => saveKey(field.provider, getKeyValue(field.provider))}
              disabled={!getKeyValue(field.provider).trim() || saving === field.provider}
              className="px-3 py-2 rounded-lg bg-foreground text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-30 flex items-center gap-1.5"
            >
              {saving === field.provider ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
