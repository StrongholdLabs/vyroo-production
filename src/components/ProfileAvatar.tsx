import { useState, useRef, useEffect } from "react";
import {
  User,
  Settings,
  Sparkles,
  Home,
  HelpCircle,
  FileText,
  LogOut,
  ExternalLink,
  Zap,
  ChevronRight,
} from "lucide-react";

export function ProfileAvatar() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Credits + Avatar */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Zap size={14} />
          <span className="tabular-nums font-medium">993</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-orange-800 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-transparent hover:ring-muted-foreground/30 transition-all duration-150"
        >
          Ru
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border overflow-hidden shadow-xl z-50 animate-scale-in"
          style={{ backgroundColor: "hsl(var(--popover))" }}
        >
          {/* User info */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-orange-800 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              Ru
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Ru</p>
              <p className="text-xs text-muted-foreground truncate">roelmangal84@gmail.com</p>
            </div>
          </div>

          {/* Plan */}
          <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Free</span>
            <button className="text-xs font-medium px-2.5 py-1 rounded-md border border-border text-foreground hover:bg-accent transition-colors">
              Upgrade
            </button>
          </div>

          {/* Credits */}
          <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap size={14} />
              <span>Credits</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-foreground">
              <span className="tabular-nums font-medium">993</span>
              <ChevronRight size={14} className="text-muted-foreground" />
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <MenuItem icon={<Sparkles size={16} />} label="Personalization" />
            <MenuItem icon={<User size={16} />} label="Account" />
            <MenuItem icon={<Settings size={16} />} label="Settings" />
            <MenuItem icon={<Home size={16} />} label="Homepage" external />
            <MenuItem icon={<HelpCircle size={16} />} label="Get help" external />
            <MenuItem icon={<FileText size={16} />} label="Docs" external />
          </div>

          {/* Sign out */}
          <div className="border-t border-border py-1">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-accent transition-colors">
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, external }: { icon: React.ReactNode; label: string; external?: boolean }) {
  return (
    <button className="w-full flex items-center justify-between px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">{icon}</span>
        <span>{label}</span>
      </div>
      {external && <ExternalLink size={12} className="text-muted-foreground" />}
    </button>
  );
}
