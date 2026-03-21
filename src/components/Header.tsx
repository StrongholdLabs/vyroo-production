import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { NotificationBell } from "@/components/NotificationBell";
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
const isMacElectron = isElectron && (window as any).electronAPI?.platform === "darwin";

// ── Context-aware status messages ───────────────────────────────────────
const pageContextMap: Record<string, { label: string; color: string }> = {
  "/dashboard": { label: "Chat", color: "bg-green-500" },
  "/agents": { label: "Agents", color: "bg-purple-500" },
  "/plugins": { label: "Plugins", color: "bg-blue-500" },
  "/settings": { label: "Settings", color: "bg-gray-400" },
  "/admin": { label: "Admin", color: "bg-amber-500" },
  "/pricing": { label: "Pricing", color: "bg-emerald-500" },
  "/onboarding": { label: "Setup", color: "bg-pink-500" },
};

function getPageContext(pathname: string) {
  // Check exact matches first, then prefix matches
  if (pageContextMap[pathname]) return pageContextMap[pathname];
  for (const [prefix, ctx] of Object.entries(pageContextMap)) {
    if (pathname.startsWith(prefix)) return ctx;
  }
  return null;
}

export function Header() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for header shadow effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const pageContext = getPageContext(location.pathname);
  const isHome = location.pathname === "/";

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
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
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="text-foreground group-hover:scale-110 transition-transform duration-200"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
          <span>Vyroo</span>
        </Link>

        {/* ─── Center: Workspace + Context ─────────────────────────── */}
        <div className="flex items-center gap-2">
          <WorkspaceSelector />

          {/* Page context indicator — shows where user is */}
          {pageContext && !isHome && (
            <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-200">
              <span className="text-muted-foreground/30 text-xs">/</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary/50">
                <div className={cn("w-1.5 h-1.5 rounded-full", pageContext.color)} />
                <span className="text-xs font-medium text-muted-foreground">
                  {pageContext.label}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ─── Right: Auth / Profile ───────────────────────────────── */}
        <div className="flex items-center gap-2">
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
