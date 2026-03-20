import { useState, useEffect } from "react";
import { Key, Check, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface KeyStatus {
  provider: string;
  configured: boolean;
}

export function APIKeySettings() {
  const [claudeKey, setClaudeKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
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

  const saveKey = async (provider: "claude" | "openai", apiKey: string) => {
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

      if (provider === "claude") setClaudeKey("");
      else setOpenaiKey("");
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-foreground mb-1">API Keys</h3>
        <p className="text-xs text-muted-foreground">
          Add your API keys to enable AI chat. Keys are stored securely and never exposed to the browser.
        </p>
      </div>

      {/* Claude API Key */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Key size={14} className="text-muted-foreground" />
            Anthropic (Claude)
          </label>
          {isConfigured("claude") && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-success flex items-center gap-1">
                <Check size={12} /> Configured
              </span>
              <button
                onClick={() => deleteKey("claude")}
                disabled={deleting === "claude"}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
              >
                {deleting === "claude" ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="password"
            value={claudeKey}
            onChange={(e) => setClaudeKey(e.target.value)}
            placeholder={isConfigured("claude") ? "Key already set (enter new to replace)" : "sk-ant-..."}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => saveKey("claude", claudeKey)}
            disabled={!claudeKey.trim() || saving === "claude"}
            className="px-3 py-2 rounded-lg bg-foreground text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-30 flex items-center gap-1.5"
          >
            {saving === "claude" ? <Loader2 size={14} className="animate-spin" /> : "Save"}
          </button>
        </div>
      </div>

      {/* OpenAI API Key */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Key size={14} className="text-muted-foreground" />
            OpenAI
          </label>
          {isConfigured("openai") && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-success flex items-center gap-1">
                <Check size={12} /> Configured
              </span>
              <button
                onClick={() => deleteKey("openai")}
                disabled={deleting === "openai"}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
              >
                {deleting === "openai" ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="password"
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            placeholder={isConfigured("openai") ? "Key already set (enter new to replace)" : "sk-..."}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => saveKey("openai", openaiKey)}
            disabled={!openaiKey.trim() || saving === "openai"}
            className="px-3 py-2 rounded-lg bg-foreground text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-30 flex items-center gap-1.5"
          >
            {saving === "openai" ? <Loader2 size={14} className="animate-spin" /> : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
