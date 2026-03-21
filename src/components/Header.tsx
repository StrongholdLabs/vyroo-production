import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Bot, Zap, Plug, Store, Workflow, Globe, Code, BarChart3,
  CreditCard, Building2, Sparkles, ChevronDown,
} from "lucide-react";
import vyrooLogo from "@/assets/vyroo-icon.png";

const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
const isMacElectron = isElectron && (window as any).electronAPI?.platform === "darwin";

const featureItems = [
  { icon: Bot, label: "AI Agents", desc: "Autonomous task execution", to: "/features" },
  { icon: Zap, label: "Skills", desc: "Built-in AI capabilities", to: "/features" },
  { icon: Plug, label: "Connectors", desc: "Google, Slack, GitHub & more", to: "/features" },
  { icon: Store, label: "Plugins", desc: "Extend with marketplace", to: "/features" },
  { icon: Workflow, label: "Workflows", desc: "Visual automation builder", to: "/features" },
  { icon: Globe, label: "Web Research", desc: "Real-time search & cite", to: "/features" },
  { icon: Code, label: "Code Gen", desc: "Write, review & debug", to: "/features" },
  { icon: BarChart3, label: "Data Analysis", desc: "Charts & insights", to: "/features" },
];

const pricingItems = [
  { icon: Sparkles, label: "Free", desc: "25 messages/day", to: "/pricing" },
  { icon: CreditCard, label: "Pro — $20/mo", desc: "1,000 messages/month", to: "/pricing" },
  { icon: Building2, label: "Team — $35/seat", desc: "5,000 messages/month", to: "/pricing" },
];

export function Header() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<"features" | "pricing" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isDashboard = location.pathname.startsWith("/dashboard");
  if (isDashboard) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        "bg-background/80 backdrop-blur-md border-b",
        scrolled ? "border-border/50 shadow-sm shadow-black/5" : "border-transparent"
      )}
      style={isElectron ? { WebkitAppRegion: "drag" } as React.CSSProperties : undefined}
    >
      <div className={cn(
        "max-w-screen-xl mx-auto flex items-center justify-between h-12 px-4 md:px-6",
        isMacElectron && "pl-20"
      )}>
        {/* ─── Left: Logo ─────────────────────────────────────────── */}
        <Link
          to="/"
          className="flex items-center gap-2 font-body font-semibold text-foreground text-sm tracking-tight group"
          style={isElectron ? { WebkitAppRegion: "no-drag" } as React.CSSProperties : undefined}
        >
          <img
            src={vyrooLogo}
            alt="Vyroo"
            width={28}
            height={28}
            className="group-hover:scale-110 transition-transform duration-200"
          />
        </Link>

        {/* ─── Center: Nav with dropdowns ─────────────────────────── */}
        <nav className="hidden sm:flex items-center gap-1" ref={menuRef}>
          <DropdownNav
            label="Features"
            isOpen={openMenu === "features"}
            onToggle={() => setOpenMenu(openMenu === "features" ? null : "features")}
            onClose={() => setOpenMenu(null)}
            items={featureItems}
            columns={2}
          />
          <DropdownNav
            label="Pricing"
            isOpen={openMenu === "pricing"}
            onToggle={() => setOpenMenu(openMenu === "pricing" ? null : "pricing")}
            onClose={() => setOpenMenu(null)}
            items={pricingItems}
            columns={1}
          />
        </nav>

        {/* ─── Right: Auth / Profile ─────────────────────────────── */}
        <div className="flex items-center gap-2">
          {/* Mobile nav */}
          <div className="flex sm:hidden items-center gap-1 mr-1">
            <Link to="/features" className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground">Features</Link>
            <Link to="/pricing" className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground">Pricing</Link>
          </div>

          {!loading && !user ? (
            <div className="flex items-center gap-1">
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all font-medium"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="px-3 py-1.5 rounded-lg bg-foreground text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Sign up
              </Link>
            </div>
          ) : !loading && user ? (
            <div className="flex items-center gap-1.5">
              <NotificationBell />
              <ProfileAvatar />
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

// ─── Dropdown Nav ───

interface DropdownItem {
  icon: typeof Bot;
  label: string;
  desc: string;
  to: string;
}

function DropdownNav({
  label,
  isOpen,
  onToggle,
  onClose,
  items,
  columns = 1,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  items: DropdownItem[];
  columns?: number;
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
          isOpen
            ? "text-foreground bg-secondary/50"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
        )}
      >
        {label}
        <ChevronDown
          size={12}
          className={cn("transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute top-full left-1/2 -translate-x-1/2 mt-2 rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-xl p-2 animate-in fade-in slide-in-from-top-2 duration-150",
            columns === 2 ? "w-[420px] grid grid-cols-2 gap-0.5" : "w-[240px]"
          )}
        >
          {items.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={onClose}
              className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors group"
            >
              <div className="mt-0.5 w-7 h-7 rounded-md bg-secondary/50 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary">
                <item.icon size={14} className="text-muted-foreground group-hover:text-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground">{item.label}</div>
                <div className="text-[11px] text-muted-foreground/70">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
