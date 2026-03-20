import { useState } from "react";
import { ShoppingCart, Plus, Link, X, Check, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ShopifyConnectModalProps {
  open: boolean;
  onClose: () => void;
}

export function ShopifyConnectModal({ open, onClose }: ShopifyConnectModalProps) {
  const [selected, setSelected] = useState<"new" | "existing" | null>(null);
  const [storeUrl, setStoreUrl] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  const handleConnect = () => {
    if (selected === "existing" && !storeUrl.trim()) return;
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setConnected(true);
    }, 2000);
  };

  const handleClose = () => {
    setSelected(null);
    setStoreUrl("");
    setConnecting(false);
    setConnected(false);
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

        {connected ? (
          <div className="flex flex-col items-center gap-4 py-6">
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
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-foreground text-primary-foreground hover:opacity-90 transition-all active:scale-[0.97]"
            >
              Continue Building
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Option cards */}
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

            {/* Store URL input for existing */}
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

            {/* Connect button */}
            {selected && (
              <button
                onClick={handleConnect}
                disabled={connecting || (selected === "existing" && !storeUrl.trim())}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-foreground text-primary-foreground hover:opacity-90 transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
              >
                {connecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    {selected === "new" ? "Create Store" : "Connect Store"}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
