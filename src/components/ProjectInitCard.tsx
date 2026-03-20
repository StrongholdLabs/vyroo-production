import { Globe, ExternalLink, ShoppingCart, Check, RefreshCw, LayoutDashboard, Unplug, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { ProjectInfo } from "@/data/conversations";
import { ShopifyConnectModal } from "@/components/ShopifyConnectModal";

interface ProjectInitCardProps {
  project: ProjectInfo;
  onView?: () => void;
}

export function ProjectInitCard({ project, onView }: ProjectInitCardProps) {
  const [showShopify, setShowShopify] = useState(false);
  const [connectedStore, setConnectedStore] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [badgeMenuOpen, setBadgeMenuOpen] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);

  const statusLabel =
    project.status === "initialized"
      ? "Project initialized"
      : project.status === "building"
        ? "Building..."
        : "Ready";

  const handleShopifyClose = () => {
    setShowShopify(false);
  };

  const handleStoreConnected = (storeName: string) => {
    setShowShopify(false);
    setSyncing(true);
    setConnectedStore(storeName);
    // Simulate live sync finishing
    setTimeout(() => setSyncing(false), 3000);
  };

  return (
    <>
      <div
        className="rounded-xl border border-border overflow-hidden transition-shadow hover:shadow-md"
        style={{ backgroundColor: "hsl(var(--surface-elevated))" }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "hsl(var(--success-soft))" }}
          >
            <Globe size={16} className="text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
            <p className="text-xs text-muted-foreground">{statusLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            {connectedStore ? (
              <div className="relative" ref={badgeRef}>
                <button
                  onClick={() => !syncing && setBadgeMenuOpen(!badgeMenuOpen)}
                  disabled={syncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors hover:bg-accent/50 active:scale-[0.97] disabled:pointer-events-none"
                  style={{
                    borderColor: syncing ? "hsl(var(--border))" : "hsl(var(--success) / 0.3)",
                    backgroundColor: syncing ? "transparent" : "hsl(var(--success-soft))",
                  }}
                >
                  {syncing ? (
                    <RefreshCw size={12} className="text-muted-foreground animate-spin" />
                  ) : (
                    <Check size={12} className="text-success" />
                  )}
                  <span className={`font-medium truncate max-w-[120px] ${syncing ? "text-muted-foreground" : "text-success"}`}>
                    {syncing ? "Syncing…" : connectedStore}
                  </span>
                  {!syncing && (
                    <>
                      <span className="relative flex h-2 w-2 ml-0.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ backgroundColor: "hsl(var(--success))" }} />
                        <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "hsl(var(--success))" }} />
                      </span>
                      <ChevronDown size={10} className="text-success/60 ml-0.5" />
                    </>
                  )}
                </button>

                {badgeMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setBadgeMenuOpen(false)} />
                    <div
                      className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-border py-1 z-20 shadow-xl"
                      style={{ backgroundColor: "hsl(var(--popover))" }}
                    >
                      <button
                        onClick={() => { setBadgeMenuOpen(false); window.open("#", "_blank"); }}
                        className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-foreground hover:bg-accent transition-colors"
                      >
                        <LayoutDashboard size={14} className="text-muted-foreground" />
                        View Dashboard
                      </button>
                      <button
                        onClick={() => { setBadgeMenuOpen(false); setSyncing(true); setTimeout(() => setSyncing(false), 3000); }}
                        className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-foreground hover:bg-accent transition-colors"
                      >
                        <RefreshCw size={14} className="text-muted-foreground" />
                        Re-sync Store
                      </button>
                      <div className="h-px bg-border my-1" />
                      <button
                        onClick={() => { setBadgeMenuOpen(false); setConnectedStore(null); setSyncing(false); }}
                        className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-destructive hover:bg-accent transition-colors"
                      >
                        <Unplug size={14} />
                        Disconnect Store
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowShopify(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors active:scale-[0.97] hover:opacity-90"
                style={{ backgroundColor: "hsl(142 60% 45%)", color: "white" }}
              >
                <ShoppingCart size={12} />
                Connect Store
              </button>
            )}
            <button
              onClick={onView}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg border border-border text-foreground hover:bg-accent transition-colors active:scale-[0.97]"
            >
              View
              <ExternalLink size={12} />
            </button>
          </div>
        </div>
      </div>
      <ShopifyConnectModal
        open={showShopify}
        onClose={handleShopifyClose}
        onConnected={handleStoreConnected}
      />
    </>
  );
}
