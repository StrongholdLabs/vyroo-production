import { useState } from "react";
import {
  Mail,
  MessageSquare,
  FileText,
  Github,
  ShoppingCart,
  Loader2,
  Check,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { ConnectorInfo } from "@/types/connectors";
import { useConnectAPIKey, useDisconnectConnector } from "@/hooks/useConnectors";

// Map icon string names to lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  mail: Mail,
  "message-square": MessageSquare,
  "file-text": FileText,
  github: Github,
  "shopping-cart": ShoppingCart,
};

interface ConnectorCardProps {
  connector: ConnectorInfo;
}

export function ConnectorCard({ connector }: ConnectorCardProps) {
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const connectAPIKey = useConnectAPIKey();
  const disconnect = useDisconnectConnector();

  const Icon = ICON_MAP[connector.icon] || Mail;
  const isConnected = connector.status === "connected";
  const isLoading = connectAPIKey.isPending || disconnect.isPending;

  const handleConnect = () => {
    if (connector.authType === "oauth") {
      toast.info("OAuth integration coming soon", {
        description: `${connector.name} OAuth flow will be available in a future update.`,
      });
      return;
    }

    // API key connector — show inline input
    setShowApiKeyInput(true);
  };

  const handleSubmitApiKey = () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }

    connectAPIKey.mutate(
      { connectorId: connector.id, apiKey: apiKey.trim() },
      {
        onSuccess: () => {
          toast.success(`${connector.name} connected successfully`);
          setShowApiKeyInput(false);
          setApiKey("");
        },
        onError: (err) => {
          toast.error(`Failed to connect ${connector.name}`, {
            description: String(err),
          });
        },
      }
    );
  };

  const handleDisconnect = () => {
    disconnect.mutate(connector.id, {
      onSuccess: () => {
        toast.success(`${connector.name} disconnected`);
      },
      onError: (err) => {
        toast.error(`Failed to disconnect ${connector.name}`, {
          description: String(err),
        });
      },
    });
  };

  const handleCancelApiKey = () => {
    setShowApiKeyInput(false);
    setApiKey("");
  };

  return (
    <div
      className="rounded-xl border border-border p-4 transition-colors hover:border-muted-foreground/30"
      style={{ backgroundColor: "hsl(var(--card))" }}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Icon + Info */}
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "hsl(var(--accent))" }}
          >
            <Icon size={20} className="text-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                {connector.name}
              </h3>
              {isConnected && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-success/20 text-success">
                  <Check size={10} />
                  Connected
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {connector.description}
            </p>
            {/* Capabilities */}
            <div className="flex flex-wrap gap-1 mt-2">
              {connector.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="text-[10px] px-1.5 py-0.5 rounded-md border border-border text-muted-foreground"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex-shrink-0">
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors disabled:opacity-50"
            >
              {disconnect.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                "Disconnect"
              )}
            </button>
          ) : !showApiKeyInput ? (
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Connect
            </button>
          ) : null}
        </div>
      </div>

      {/* Inline API key input */}
      {showApiKeyInput && !isConnected && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmitApiKey()}
            placeholder={`Enter ${connector.name} API key`}
            className="flex-1 h-8 px-3 text-xs border border-border rounded-lg bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            style={{ backgroundColor: "hsl(var(--input-surface))" }}
            autoFocus
          />
          <button
            onClick={handleSubmitApiKey}
            disabled={connectAPIKey.isPending}
            className="h-8 px-3 text-xs font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
          >
            {connectAPIKey.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              "Save"
            )}
          </button>
          <button
            onClick={handleCancelApiKey}
            className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Account info when connected */}
      {isConnected && connector.accountInfo?.email && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[11px] text-muted-foreground">
            Connected as{" "}
            <span className="text-foreground">
              {connector.accountInfo.email}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
