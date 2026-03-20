import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { label: "Features", href: "#" },
  { label: "Resources", href: "#" },
  { label: "Pricing", href: "#" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between h-14 px-4 md:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-body font-semibold text-foreground text-lg tracking-tight">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-foreground">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
          <span>manus</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 rounded-md"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="hidden md:inline-flex px-4 py-1.5 text-sm font-medium text-foreground border border-border rounded-full hover:bg-secondary transition-colors duration-150 active:scale-[0.97]"
          >
            Sign in
          </Link>
          <Link
            to="/dashboard"
            className="hidden md:inline-flex px-4 py-1.5 text-sm font-medium bg-foreground text-primary-foreground rounded-full hover:opacity-90 transition-all duration-150 active:scale-[0.97]"
          >
            Sign up
          </Link>
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 flex gap-2">
              <Link to="/dashboard" className="flex-1 text-center px-4 py-2 text-sm font-medium border border-border rounded-full">
                Sign in
              </Link>
              <Link to="/dashboard" className="flex-1 text-center px-4 py-2 text-sm font-medium bg-foreground text-primary-foreground rounded-full">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
