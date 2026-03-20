import { Globe, ExternalLink, ShoppingCart } from "lucide-react";
import { useState } from "react";
import type { ProjectInfo } from "@/data/conversations";
import { ShopifyConnectModal } from "@/components/ShopifyConnectModal";

interface ProjectInitCardProps {
  project: ProjectInfo;
  onView?: () => void;
}

export function ProjectInitCard({ project, onView }: ProjectInitCardProps) {
  const [showShopify, setShowShopify] = useState(false);

  const statusLabel =
    project.status === "initialized"
      ? "Project initialized"
      : project.status === "building"
        ? "Building..."
        : "Ready";

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
            <button
              onClick={() => setShowShopify(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg text-foreground transition-colors active:scale-[0.97] hover:opacity-90"
              style={{ backgroundColor: "hsl(142 60% 45%)", color: "white" }}
            >
              <ShoppingCart size={12} />
              Connect Store
            </button>
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
      <ShopifyConnectModal open={showShopify} onClose={() => setShowShopify(false)} />
    </>
  );
}
