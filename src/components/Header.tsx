import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import vyrooLogo from "@/assets/vyroo-icon.png";

const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
const isMacElectron = isElectron && (window as any).electronAPI?.platform === "darwin";

export function Header() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Don't render header on dashboard (it has its own sidebar/chrome)
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

        {/* ─── Center: Nav links ──────────────────────────────────── */}
        <nav className="hidden sm:flex items-center gap-1">
          <NavLink to="/features" active={location.pathname === "/features"}>Features</NavLink>
          <NavLink to="/pricing" active={location.pathname === "/pricing"}>Pricing</NavLink>
        </nav>

        {/* ─── Right: Auth / Profile ─────────────────────────────── */}
        <div className="flex items-center gap-2">
          {/* Mobile nav links */}
          <div className="flex sm:hidden items-center gap-1 mr-1">
            <NavLink to="/features" active={location.pathname === "/features"}>Features</NavLink>
            <NavLink to="/pricing" active={location.pathname === "/pricing"}>Pricing</NavLink>
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

function NavLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={cn(
        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
        active
          ? "text-foreground bg-secondary/50"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
      )}
    >
      {children}
    </Link>
  );
}
