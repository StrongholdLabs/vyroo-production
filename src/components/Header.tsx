import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { NotificationBell } from "@/components/NotificationBell";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between h-12 px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 font-body font-semibold text-foreground text-sm tracking-tight">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-foreground">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
          <span>manus</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-body">Manus 1.6 Lite</span>
          <ChevronDown size={12} className="text-muted-foreground" />
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <ProfileAvatar />
        </div>
      </div>
    </header>
  );
}
