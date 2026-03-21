import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Bot, Zap, Plug, Store, Workflow, Globe, Code, BarChart3,
  CreditCard, Building2, Sparkles, ChevronDown, Menu, X,
} from "lucide-react";
import vyrooLogo from "@/assets/vyroo-icon.png";

const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;

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

// ─── Animated Nav Link (hover slide effect) ───
function AnimatedNavLink({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="group relative inline-flex items-center overflow-hidden h-5 text-sm"
    >
      <div className="flex flex-col transition-transform duration-300 ease-out group-hover:-translate-y-1/2">
        <span className="text-gray-300">{children}</span>
        <span className="text-white">{children}</span>
      </div>
    </Link>
  );
}

export function Header() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<"features" | "pricing" | null>(null);
  const [headerShape, setHeaderShape] = useState("rounded-full");
  const menuRef = useRef<HTMLDivElement>(null);
  const shapeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shape transition for mobile menu
  useEffect(() => {
    if (shapeTimeoutRef.current) clearTimeout(shapeTimeoutRef.current);
    if (isOpen) {
      setHeaderShape("rounded-xl");
    } else {
      shapeTimeoutRef.current = setTimeout(() => setHeaderShape("rounded-full"), 300);
    }
    return () => { if (shapeTimeoutRef.current) clearTimeout(shapeTimeoutRef.current); };
  }, [isOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isDashboard = location.pathname.startsWith("/dashboard");
  if (isDashboard) return null;

  return (
    <header
      className={cn(
        "fixed top-6 left-1/2 -translate-x-1/2 z-50",
        "flex flex-col items-center",
        "px-6 py-3 backdrop-blur-md",
        headerShape,
        "bg-[#1f1f1f57]",
        "w-[calc(100%-2rem)] sm:w-auto",
        "transition-[border-radius] duration-0 ease-in-out"
      )}
      style={isElectron ? { WebkitAppRegion: "drag" } as React.CSSProperties : undefined}
      ref={menuRef}
    >
      <div className="flex items-center justify-between w-full gap-x-6 sm:gap-x-8">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img
            src={vyrooLogo}
            alt="Vyroo"
            width={24}
            height={24}
            className="hover:scale-110 transition-transform duration-200"
          />
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden sm:flex items-center space-x-6 text-sm">
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

        {/* Desktop auth */}
        <div className="hidden sm:flex items-center gap-3">
          {!loading && !user ? (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm border border-[#333] bg-[rgba(31,31,31,0.62)] text-gray-300 rounded-full hover:border-white/50 hover:text-white transition-colors duration-200"
              >
                Sign in
              </Link>
              <div className="relative group">
                <div className="absolute inset-0 -m-2 rounded-full bg-gray-100 opacity-40 blur-lg pointer-events-none transition-all duration-300 ease-out group-hover:opacity-60 group-hover:blur-xl group-hover:-m-3" />
                <Link
                  to="/signup"
                  className="relative z-10 px-4 py-2 text-sm font-semibold text-black bg-gradient-to-br from-gray-100 to-gray-300 rounded-full hover:from-gray-200 hover:to-gray-400 transition-all duration-200"
                >
                  Sign up
                </Link>
              </div>
            </>
          ) : !loading && user ? (
            <div className="flex items-center gap-2">
              <NotificationBell />
              <ProfileAvatar />
            </div>
          ) : null}
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden flex items-center justify-center w-8 h-8 text-gray-300"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close Menu" : "Open Menu"}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile expanded menu */}
      <div
        className={cn(
          "sm:hidden flex flex-col items-center w-full transition-all ease-in-out duration-300 overflow-hidden",
          isOpen ? "max-h-[500px] opacity-100 pt-4" : "max-h-0 opacity-0 pt-0 pointer-events-none"
        )}
      >
        <nav className="flex flex-col items-center space-y-4 text-base w-full">
          <Link to="/features" onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white transition-colors w-full text-center">
            Features
          </Link>
          <Link to="/pricing" onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white transition-colors w-full text-center">
            Pricing
          </Link>
        </nav>
        {!loading && !user && (
          <div className="flex flex-col items-center space-y-3 mt-4 w-full">
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm border border-[#333] bg-[rgba(31,31,31,0.62)] text-gray-300 rounded-full hover:border-white/50 hover:text-white transition-colors w-full text-center"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-black bg-gradient-to-br from-gray-100 to-gray-300 rounded-full hover:from-gray-200 hover:to-gray-400 transition-all w-full text-center"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

// ─── Dropdown Nav (pill-style) ───

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
          "flex items-center gap-1 text-sm transition-colors duration-200",
          isOpen ? "text-white" : "text-gray-300 hover:text-white"
        )}
      >
        {label}
        <ChevronDown size={11} className={cn("transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute top-full left-1/2 -translate-x-1/2 mt-4 rounded-xl bg-[#1a1a1a]/95 backdrop-blur-xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-150",
            columns === 2 ? "w-[420px] grid grid-cols-2 gap-0.5" : "w-[240px]"
          )}
        >
          {items.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={onClose}
              className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
            >
              <div className="mt-0.5 w-7 h-7 rounded-md bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10">
                <item.icon size={14} className="text-gray-400 group-hover:text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-200">{item.label}</div>
                <div className="text-[11px] text-gray-500">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
