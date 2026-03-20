import { useState, useRef, useEffect } from "react";
import { ArrowUp, Plus, Smile, Mic, X, Link2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Integration {
  id: string;
  name: string;
  icon: string;
  defaultStatus: "Connect" | "Install";
  badge?: string;
}

const defaultIntegrations: Integration[] = [
  { id: "github", name: "GitHub", icon: "🐙", defaultStatus: "Connect" },
  { id: "gmail", name: "Gmail", icon: "✉️", defaultStatus: "Connect" },
  { id: "browser", name: "My Browser", icon: "🌐", defaultStatus: "Install" },
  { id: "meta", name: "Meta Ads Manager", icon: "📘", defaultStatus: "Connect", badge: "Beta" },
  { id: "instagram", name: "Instagram", icon: "📷", defaultStatus: "Connect", badge: "Beta" },
  { id: "outlook", name: "Outlook Mail", icon: "📨", defaultStatus: "Connect" },
  { id: "gcal", name: "Google Calendar", icon: "📅", defaultStatus: "Connect" },
  { id: "ocal", name: "Outlook Calendar", icon: "📆", defaultStatus: "Connect" },
];

const connectedIcons = ["🟢", "📘", "🔵", "💬", "🟣", "📎"];

export function TaskInput() {
  const [value, setValue] = useState("");
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [dismissedBar, setDismissedBar] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSubmit = () => {
    if (!value.trim()) return;
    navigate("/dashboard", { state: { task: value } });
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowIntegrations(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-0">
      <div className="input-main rounded-2xl overflow-visible relative">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Assign a task or ask anything"
          rows={2}
          className="w-full resize-none bg-transparent px-5 pt-4 pb-1 text-foreground placeholder:text-muted-foreground/60 text-[15px] leading-relaxed focus:outline-none font-body"
        />
        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-1">
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-150 rounded-lg hover:bg-secondary active:scale-95">
              <Plus size={18} />
            </button>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowIntegrations(!showIntegrations)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-150 rounded-lg hover:bg-secondary active:scale-95"
              >
                <Link2 size={18} />
              </button>

              {showIntegrations && (
                <div
                  className="absolute left-0 bottom-full mb-2 w-72 rounded-xl border border-border overflow-hidden shadow-xl z-50 animate-scale-in"
                  style={{ backgroundColor: "hsl(var(--popover))" }}
                >
                  {integrations.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{item.icon}</span>
                        <span className="text-sm text-foreground">{item.name}</span>
                        {item.badge && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{item.status}</span>
                    </div>
                  ))}
                  <div className="border-t border-border px-4 py-2.5 flex items-center gap-3 hover:bg-accent/50 transition-colors cursor-pointer">
                    <span className="text-sm"><Plus size={14} /></span>
                    <span className="text-sm text-foreground">Add connectors</span>
                    <div className="ml-auto flex items-center gap-1">
                      <span className="text-xs">🟢</span>
                      <span className="text-xs">📎</span>
                      <span className="text-[10px] text-muted-foreground">+78</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-150 rounded-lg hover:bg-secondary active:scale-95">
              <Smile size={18} />
            </button>
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-150 rounded-lg hover:bg-secondary active:scale-95">
              <Mic size={18} />
            </button>
            <button
              onClick={handleSubmit}
              disabled={!value.trim()}
              className="p-2.5 rounded-xl bg-foreground text-primary-foreground disabled:opacity-20 hover:opacity-90 transition-all duration-150 active:scale-95"
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>

        {/* Connect your tools bar */}
        {!dismissedBar && (
          <div
            className="flex items-center gap-3 px-4 py-2.5 border-t cursor-pointer"
            style={{ borderColor: "hsl(var(--computer-border))" }}
            onClick={() => setShowIntegrations(!showIntegrations)}
          >
            <Link2 size={14} className="text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground flex-1">Connect your tools to Manus</span>
            <div className="flex items-center gap-0.5">
              {connectedIcons.map((icon, i) => (
                <span key={i} className="text-xs">{icon}</span>
              ))}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setDismissedBar(true); }}
              className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
