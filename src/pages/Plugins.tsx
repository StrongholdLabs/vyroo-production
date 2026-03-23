import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  HeartPulse,
  GraduationCap,
  Landmark,
  Megaphone,
  Terminal,
  Puzzle,
  Sparkles,
  Store,
  Download,
  Trash2,
  Zap,
  Plug,
  Wrench,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { pluginRegistry } from "../lib/plugins/registry";
import type { VyrooPlugin, VerticalType } from "../lib/plugins/types";
import { verticals } from "../lib/plugins/verticals";

// Map icon strings to lucide components
const iconMap: Record<string, LucideIcon> = {
  "shopping-cart": ShoppingCart,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  landmark: Landmark,
  megaphone: Megaphone,
  terminal: Terminal,
  puzzle: Puzzle,
  sparkles: Sparkles,
  store: Store,
};

// Vertical color classes
const verticalColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  blue:   { bg: "bg-blue-500/15",   text: "text-blue-400",   border: "border-blue-500/30",   dot: "bg-blue-400" },
  green:  { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  red:    { bg: "bg-red-500/15",     text: "text-red-400",     border: "border-red-500/30",     dot: "bg-red-400" },
  purple: { bg: "bg-purple-500/15",  text: "text-purple-400",  border: "border-purple-500/30",  dot: "bg-purple-400" },
  amber:  { bg: "bg-amber-500/15",   text: "text-amber-400",   border: "border-amber-500/30",   dot: "bg-amber-400" },
  pink:   { bg: "bg-pink-500/15",    text: "text-pink-400",    border: "border-pink-500/30",    dot: "bg-pink-400" },
  cyan:   { bg: "bg-cyan-500/15",    text: "text-cyan-400",    border: "border-cyan-500/30",    dot: "bg-cyan-400" },
  gray:   { bg: "bg-zinc-500/15",    text: "text-zinc-400",    border: "border-zinc-500/30",    dot: "bg-zinc-400" },
};

function getIconComponent(iconName: string): LucideIcon {
  return iconMap[iconName] ?? Puzzle;
}

function getVerticalColor(vertical: VerticalType) {
  const meta = verticals[vertical];
  return verticalColors[meta?.color ?? "gray"] ?? verticalColors.gray;
}

type FilterTab = "all" | VerticalType;

export default function Plugins() {
  const navigate = useNavigate();
  const [plugins, setPlugins] = useState<VyrooPlugin[]>(() => pluginRegistry.getAll());
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [installingId, setInstallingId] = useState<string | null>(null);

  // Subscribe to registry changes
  useEffect(() => {
    const update = () => setPlugins(pluginRegistry.getAll());
    const unsub = pluginRegistry.subscribe(update);
    update(); // sync on mount
    return unsub;
  }, []);

  const handleInstall = useCallback(async (pluginId: string) => {
    setInstallingId(pluginId);
    try {
      await pluginRegistry.install(pluginId);
    } catch (err) {
      console.error("Failed to install plugin:", err);
    } finally {
      setInstallingId(null);
      setPlugins(pluginRegistry.getAll());
    }
  }, []);

  const handleUninstall = useCallback(async (pluginId: string) => {
    setInstallingId(pluginId);
    try {
      await pluginRegistry.deactivate(pluginId);
    } catch (err) {
      console.error("Failed to uninstall plugin:", err);
    } finally {
      setInstallingId(null);
      setPlugins(pluginRegistry.getAll());
    }
  }, []);

  // Filter and search
  const filteredPlugins = useMemo(() => {
    let result = plugins;
    if (activeTab !== "all") {
      result = result.filter((p) => p.vertical === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          verticals[p.vertical]?.name.toLowerCase().includes(q),
      );
    }
    return result;
  }, [plugins, activeTab, search]);

  const activeCount = plugins.filter((p) => pluginRegistry.isActive(p.id)).length;

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    ...Object.values(verticals).map((v) => ({ key: v.id as FilterTab, label: v.name })),
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Hero header */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 pt-6 pb-8">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mb-4"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.6) 100%)",
                  }}
                >
                  <Store size={20} className="text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground font-body tracking-tight">
                  Plugin Store
                </h1>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                Extend Vyroo with vertical-specific superpowers
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3">
              <div className="text-xs font-medium text-muted-foreground px-3 py-1.5 rounded-lg border border-border bg-card">
                <span className="text-foreground tabular-nums">{plugins.length}</span>
                {" available"}
              </div>
              {activeCount > 0 && (
                <div className="text-xs font-medium px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <span className="tabular-nums">{activeCount}</span>
                  {" active"}
                </div>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mt-6 max-w-lg">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search plugins..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="border-b border-border sticky top-0 z-10" style={{ backgroundColor: "hsl(var(--background))" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Plugin grid */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {filteredPlugins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Puzzle size={40} className="text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              {search.trim()
                ? "No plugins match your search"
                : "No plugins available in this category"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlugins.map((plugin) => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                isActive={pluginRegistry.isActive(plugin.id)}
                isInstalling={installingId === plugin.id}
                onInstall={() => handleInstall(plugin.id)}
                onUninstall={() => handleUninstall(plugin.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Plugin Card
// ---------------------------------------------------------------------------

interface PluginCardProps {
  plugin: VyrooPlugin;
  isActive: boolean;
  isInstalling: boolean;
  onInstall: () => void;
  onUninstall: () => void;
}

function PluginCard({ plugin, isActive, isInstalling, onInstall, onUninstall }: PluginCardProps) {
  const Icon = getIconComponent(plugin.icon);
  const vColor = getVerticalColor(plugin.vertical);
  const verticalMeta = verticals[plugin.vertical];

  const skillCount = plugin.skills?.length ?? 0;
  const connectorCount = plugin.connectors?.length ?? 0;
  const toolCount = plugin.tools?.length ?? 0;

  return (
    <div
      className={`group relative rounded-xl border transition-all duration-200 hover:shadow-lg hover:shadow-black/20 ${
        isActive
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-border bg-card hover:border-muted-foreground/30"
      }`}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
            Active
          </span>
        </div>
      )}

      <div className="p-5">
        {/* Icon + Name */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${vColor.bg} ${vColor.border} border`}
          >
            <Icon size={20} className={vColor.text} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{plugin.name}</h3>
            <span className="text-[11px] text-muted-foreground font-mono">v{plugin.version}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">
          {plugin.description}
        </p>

        {/* Vertical badge */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${vColor.bg} ${vColor.text} border ${vColor.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${vColor.dot}`} />
            {verticalMeta?.name ?? plugin.vertical}
          </span>
        </div>

        {/* Counts */}
        <div className="flex items-center gap-2 mb-4">
          {skillCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-accent/50 px-2 py-0.5 rounded-md">
              <Zap size={11} />
              {skillCount} {skillCount === 1 ? "skill" : "skills"}
            </span>
          )}
          {connectorCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-accent/50 px-2 py-0.5 rounded-md">
              <Plug size={11} />
              {connectorCount} {connectorCount === 1 ? "connector" : "connectors"}
            </span>
          )}
          {toolCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-accent/50 px-2 py-0.5 rounded-md">
              <Wrench size={11} />
              {toolCount} {toolCount === 1 ? "tool" : "tools"}
            </span>
          )}
          {skillCount === 0 && connectorCount === 0 && toolCount === 0 && (
            <span className="text-[11px] text-muted-foreground/60 italic">No components yet</span>
          )}
        </div>

        {/* Install / Uninstall button */}
        <button
          onClick={isActive ? onUninstall : onInstall}
          disabled={isInstalling}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
            isInstalling
              ? "opacity-50 cursor-not-allowed bg-accent text-muted-foreground"
              : isActive
                ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                : "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
          }`}
        >
          {isInstalling ? (
            <>
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Working...
            </>
          ) : isActive ? (
            <>
              <Trash2 size={13} />
              Uninstall
            </>
          ) : (
            <>
              <Download size={13} />
              Install
            </>
          )}
        </button>
      </div>
    </div>
  );
}
