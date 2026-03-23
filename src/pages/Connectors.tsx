import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Plug } from "lucide-react";
import { useConnectors } from "@/hooks/useConnectors";
import { ConnectorCard } from "@/components/ConnectorCard";
import { CATEGORY_LABELS, type ConnectorCategory } from "@/types/connectors";

const CATEGORY_ORDER: ConnectorCategory[] = [
  "productivity",
  "communication",
  "development",
  "commerce",
];

export default function Connectors() {
  const { data: connectors, isLoading } = useConnectors();

  // Group connectors by category
  const grouped = useMemo(() => {
    if (!connectors) return null;
    const groups: Record<ConnectorCategory, typeof connectors> = {
      productivity: [],
      communication: [],
      development: [],
      commerce: [],
    };
    for (const c of connectors) {
      groups[c.category].push(c);
    }
    return groups;
  }, [connectors]);

  const connectedCount = connectors?.filter((c) => c.status === "connected").length ?? 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Top bar */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            to="/dashboard"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "hsl(var(--accent))" }}
            >
              <Plug size={18} className="text-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground font-body">
                Connectors
              </h1>
              <p className="text-xs text-muted-foreground">
                Connect your tools and services to supercharge your workflows
                {connectedCount > 0 && (
                  <span className="ml-1 text-success">
                    — {connectedCount} connected
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : grouped ? (
          <div className="space-y-8">
            {CATEGORY_ORDER.map((category) => {
              const items = grouped[category];
              if (items.length === 0) return null;
              return (
                <div key={category}>
                  <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    {CATEGORY_LABELS[category]}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((connector) => (
                      <ConnectorCard
                        key={connector.id}
                        connector={connector}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
