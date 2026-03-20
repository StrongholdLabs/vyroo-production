import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Link, Check, ArrowRight, Package, CreditCard, Globe, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SyncStep {
  label: string;
  icon: React.ReactNode;
  duration: number;
}

const SYNC_STEPS: SyncStep[] = [
  { label: "Authenticating store access", icon: <Globe size={14} />, duration: 1200 },
  { label: "Syncing product catalog", icon: <Package size={14} />, duration: 1800 },
  { label: "Importing inventory data", icon: <RefreshCw size={14} />, duration: 1400 },
  { label: "Configuring checkout", icon: <CreditCard size={14} />, duration: 1000 },
];

interface ShopifyConnectModalProps {
  open: boolean;
  onClose: () => void;
  onConnected?: (storeName: string) => void;
}

export function ShopifyConnectModal({ open, onClose, onConnected }: ShopifyConnectModalProps) {
  const [selected, setSelected] = useState<"new" | "existing" | null>(null);
  const [storeUrl, setStoreUrl] = useState("");
  const [phase, setPhase] = useState<"select" | "syncing" | "done">("select");
  const [syncIndex, setSyncIndex] = useState(0);
  const [syncProgress, setSyncProgress] = useState(0);

  // Drive the sync animation
  useEffect(() => {
    if (phase !== "syncing") return;

    if (syncIndex >= SYNC_STEPS.length) {
      setPhase("done");
      return;
    }

    const step = SYNC_STEPS[syncIndex];
    const tickInterval = 40;
    const ticks = Math.floor(step.duration / tickInterval);
    let tick = 0;

    const baseProgress = (syncIndex / SYNC_STEPS.length) * 100;
    const stepWeight = 100 / SYNC_STEPS.length;

    const timer = setInterval(() => {
      tick++;
      const stepPercent = Math.min(tick / ticks, 1);
      // Add slight easing
      const eased = 1 - Math.pow(1 - stepPercent, 2);
      setSyncProgress(Math.round(baseProgress + stepWeight * eased));

      if (tick >= ticks) {
        clearInterval(timer);
        setSyncIndex((i) => i + 1);
      }
    }, tickInterval);

    return () => clearInterval(timer);
  }, [phase, syncIndex]);

  const handleConnect = () => {
    if (selected === "existing" && !storeUrl.trim()) return;
    setPhase("syncing");
    setSyncIndex(0);
    setSyncProgress(0);
  };

  const handleClose = () => {
    setSelected(null);
    setStoreUrl("");
    setPhase("select");
    setSyncIndex(0);
    setSyncProgress(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-border" style={{ backgroundColor: "hsl(var(--card))" }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ShoppingCart size={18} />
            Connect Your Shopify Store
          </DialogTitle>
          <DialogDescription>
            Link your store to enable product sync, checkout, and deployment.
          </DialogDescription>
        </DialogHeader>

        {/* ── Sync progress ── */}
        {phase === "syncing" && (
          <div className="space-y-5 py-4 animate-fade-in">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Syncing store data…</span>
                <span className="text-xs text-muted-foreground tabular-nums">{syncProgress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-accent overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-200 ease-out"
                  style={{
                    width: `${syncProgress}%`,
                    backgroundColor: "hsl(var(--success))",
                  }}
                />
              </div>
            </div>

            {/* Step list */}
            <div className="space-y-2.5">
              {SYNC_STEPS.map((step, i) => {
                const isDone = i < syncIndex;
                const isActive = i === syncIndex;

                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                      isActive ? "bg-accent" : ""
                    }`}
                  >
                    {/* Status icon */}
                    {isDone ? (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "hsl(var(--success-soft))" }}
                      >
                        <Check size={12} className="text-success" />
                      </div>
                    ) : isActive ? (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-accent border border-border">
                        <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border border-border">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                      </div>
                    )}

                    {/* Label */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={`flex-shrink-0 ${isDone ? "text-success" : isActive ? "text-foreground" : "text-muted-foreground/50"}`}>
                        {step.icon}
                      </span>
                      <span
                        className={`truncate ${
                          isDone ? "text-muted-foreground" : isActive ? "text-foreground font-medium" : "text-muted-foreground/50"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>

                    {isDone && (
                      <span className="text-[10px] text-muted-foreground">Done</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Done ── */}
        {phase === "done" && (
          <div className="flex flex-col items-center gap-4 py-6 animate-fade-in">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "hsl(var(--success-soft))" }}
            >
              <Check size={20} className="text-success" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Store connected!</p>
              <p className="text-xs text-muted-foreground mt-1">
                {selected === "new" ? "Your new development store is ready." : `Connected to ${storeUrl || "your store"}.`}
              </p>
            </div>

            {/* Sync summary chips */}
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { label: "47 products", icon: <Package size={12} /> },
                { label: "Checkout ready", icon: <CreditCard size={12} /> },
                { label: "Inventory synced", icon: <RefreshCw size={12} /> },
              ].map((chip, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-xs text-muted-foreground"
                >
                  {chip.icon}
                  {chip.label}
                </div>
              ))}
            </div>

            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-foreground text-primary-foreground hover:opacity-90 transition-all active:scale-[0.97]"
            >
              Continue Building
            </button>
          </div>
        )}

        {/* ── Selection ── */}
        {phase === "select" && (
          <div className="space-y-4 pt-2">
            <div className="grid gap-3">
              <button
                onClick={() => setSelected("new")}
                className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all active:scale-[0.98] ${
                  selected === "new"
                    ? "border-foreground/30 bg-accent"
                    : "border-border hover:border-foreground/20 hover:bg-accent/50"
                }`}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-accent">
                  <Plus size={16} className="text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Create a new store</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    We'll set up a development store so you can start building right away.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setSelected("existing")}
                className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all active:scale-[0.98] ${
                  selected === "existing"
                    ? "border-foreground/30 bg-accent"
                    : "border-border hover:border-foreground/20 hover:bg-accent/50"
                }`}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-accent">
                  <Link size={16} className="text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Connect existing store</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Link your existing Shopify store to manage it from Vyroo.
                  </p>
                </div>
              </button>
            </div>

            {selected === "existing" && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-xs font-medium text-muted-foreground">Shopify admin URL</label>
                <input
                  type="text"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  placeholder="your-store.myshopify.com"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}

            {selected && (
              <button
                onClick={handleConnect}
                disabled={selected === "existing" && !storeUrl.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-foreground text-primary-foreground hover:opacity-90 transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
              >
                {selected === "new" ? "Create Store" : "Connect Store"}
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
