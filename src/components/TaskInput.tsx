import { useState, useRef, useEffect } from "react";
import { ArrowUp, Plus, Smile, X, Link2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { VoiceMicButton } from "@/components/VoiceMicButton";
import { useCreateConversation } from "@/hooks/useConversations";

interface Integration {
  id: string;
  name: string;
  icon: React.ReactNode;
  defaultStatus: "Connect" | "Install";
  badge?: string;
}

const defaultIntegrations: Integration[] = [
  { id: "github", name: "GitHub", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>, defaultStatus: "Connect" },
  { id: "gmail", name: "Gmail", icon: <svg width="16" height="16" viewBox="0 0 24 24"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/></svg>, defaultStatus: "Connect" },
  { id: "browser", name: "My Browser", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>, defaultStatus: "Install" },
  { id: "meta", name: "Meta Ads Manager", icon: <svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06c0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33v7A10 10 0 0022 12.06C22 6.53 17.5 2.04 12 2.04z" fill="#1877F2"/></svg>, defaultStatus: "Connect", badge: "Beta" },
  { id: "instagram", name: "Instagram", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>, defaultStatus: "Connect", badge: "Beta" },
  { id: "outlook", name: "Outlook Mail", icon: <svg width="16" height="16" viewBox="0 0 24 24"><path d="M24 7.387v10.478c0 .23-.08.424-.238.576a.806.806 0 01-.588.234h-8.36v-6.95l1.66 1.28c.07.054.15.08.24.08s.17-.026.24-.08l6.81-5.256a.472.472 0 01.236.064V7.387z" fill="#0072C6"/><path d="M15.548 6.393l-1.248.976H8.814V5.484c0-.108.04-.2.12-.276a.39.39 0 01.282-.112h5.988l.344-.552V6.393z" fill="#0072C6"/><path d="M8.814 18.675V7.37h5.486l.514.398v8.908c0 .553-.45 1-.998 1H8.814z" fill="#0072C6"/><path d="M0 6.0v12c0 .6.4 1.08.94 1.2L9 21V3L.94 4.8C.4 4.92 0 5.4 0 6.0z" fill="#0072C6"/><ellipse cx="4.5" cy="12" rx="2.5" ry="3.5" fill="white"/></svg>, defaultStatus: "Connect" },
  { id: "gcal", name: "Google Calendar", icon: <svg width="16" height="16" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="19" rx="2" fill="#4285F4"/><rect x="2" y="3" width="20" height="5" fill="#1967D2"/><rect x="5" y="10" width="4" height="3" rx="0.5" fill="white"/><rect x="10" y="10" width="4" height="3" rx="0.5" fill="white"/><rect x="15" y="10" width="4" height="3" rx="0.5" fill="white"/><rect x="5" y="15" width="4" height="3" rx="0.5" fill="white"/><rect x="10" y="15" width="4" height="3" rx="0.5" fill="white"/><line x1="7" y1="1" x2="7" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/><line x1="17" y1="1" x2="17" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>, defaultStatus: "Connect" },
  { id: "ocal", name: "Outlook Calendar", icon: <svg width="16" height="16" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="19" rx="2" fill="#0072C6"/><rect x="2" y="3" width="20" height="5" fill="#005A9E"/><rect x="5" y="10" width="4" height="3" rx="0.5" fill="white"/><rect x="10" y="10" width="4" height="3" rx="0.5" fill="white"/><rect x="15" y="10" width="4" height="3" rx="0.5" fill="white"/><rect x="5" y="15" width="4" height="3" rx="0.5" fill="white"/><rect x="10" y="15" width="4" height="3" rx="0.5" fill="white"/><line x1="7" y1="1" x2="7" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/><line x1="17" y1="1" x2="17" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>, defaultStatus: "Connect" },
];

// Real brand SVG logos for connector bar
const connectorLogos: { name: string; svg: React.ReactNode }[] = [
  {
    name: "Google",
    svg: (
      <svg width="14" height="14" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    name: "GitHub",
    svg: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-foreground">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
      </svg>
    ),
  },
  {
    name: "Slack",
    svg: (
      <svg width="14" height="14" viewBox="0 0 24 24">
        <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313z" fill="#E01E5A"/>
        <path d="M8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312z" fill="#36C5F0"/>
        <path d="M18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.165 0a2.528 2.528 0 012.52 2.522v6.312z" fill="#2EB67D"/>
        <path d="M15.165 18.956a2.528 2.528 0 012.52 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 01-2.52-2.523 2.527 2.527 0 012.52-2.52h6.313A2.528 2.528 0 0124 15.165a2.528 2.528 0 01-2.522 2.52h-6.313z" fill="#ECB22E"/>
      </svg>
    ),
  },
  {
    name: "Notion",
    svg: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-foreground">
        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.08 2.02c-.466-.373-.98-.746-2.054-.653l-12.79.933c-.467.047-.56.28-.374.466l1.597 1.442zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.166V6.354c0-.606-.233-.933-.746-.886l-15.177.886c-.56.047-.747.327-.747.934zm14.337.745c.093.42 0 .84-.42.886l-.7.14v10.264c-.606.327-1.166.514-1.633.514-.746 0-.933-.234-1.493-.934l-4.578-7.192v6.958l1.447.326s0 .84-1.166.84l-3.218.187c-.093-.187 0-.653.327-.727l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.452-.233 4.764 7.29v-6.44l-1.214-.14c-.093-.513.28-.886.747-.933l3.225-.187z"/>
      </svg>
    ),
  },
  {
    name: "Shopify",
    svg: (
      <svg width="14" height="14" viewBox="0 0 24 24">
        <path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.192-.192s-1.554-.115-1.554-.115-1.037-1.018-1.153-1.134a.6.6 0 00-.226-.131l-.833 19.07.367-.207zm-3.592-5.616s-.654-.345-1.449-.345c-1.173 0-1.224.735-1.224.921 0 1.01 2.625 1.398 2.625 3.764 0 1.862-1.183 3.058-2.773 3.058-1.908 0-2.886-1.189-2.886-1.189l.51-1.691s1.005.864 1.852.864c.554 0 .783-.436.783-.757 0-1.321-2.155-1.381-2.155-3.546 0-1.824 1.311-3.592 3.957-3.592 1.018 0 1.524.294 1.524.294l-.764 2.219z" fill="#96BF48"/>
        <path d="M14.728 2.677c.015 0 .123-.079.123-.079a3.384 3.384 0 00-.724-.761c-.297.393-.619 1.06-.619 1.06s.474-.188 1.22-.22zm-1.675 1.058s-.452.134-.954.202l-.332-1.263-.104.6c-.255.072-.531.15-.826.233l.332 1.231c-.294.08-.585.158-.854.229L9.1 5.002c-.255.068-.5.134-.714.189l.294 1.093c-.15.04-.296.079-.433.114l-.282-1.053-.38 1.089.29 1.076c-.258.069-.441.116-.441.116L7.127 6.53l-.35 1.004.3 1.112c-.172.046-.306.08-.306.08l.383 1.422s.126-.034.308-.083l-.286-1.064.44-.117.286 1.063.398-1.14-.286-1.065c.214-.058.438-.12.668-.185l.286 1.065.44-.126-.288-1.065c.253-.072.501-.143.736-.213l.287 1.066.474-.163-.288-1.063a38.14 38.14 0 00.636-.218l.288 1.063.506-.207-.289-1.063c.178-.072.35-.143.509-.211l.288 1.065.53-.257-.288-1.063c.15-.069.288-.134.412-.196l.288 1.063.413-.279-.279-1.04z" fill="#5E8E3E"/>
      </svg>
    ),
  },
];

export function TaskInput() {
  const [value, setValue] = useState("");
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [dismissedBar, setDismissedBar] = useState(false);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const createConversation = useCreateConversation();

  const handleSubmit = async () => {
    if (!value.trim()) return;

    // Redirect to login if not authenticated
    if (!user) {
      navigate("/login", { state: { from: "/dashboard" } });
      return;
    }

    // Create a new conversation — the chat edge function inserts the user message
    try {
      const conv = await createConversation.mutateAsync({
        title: value.slice(0, 60) + (value.length > 60 ? "..." : ""),
      });
      // Navigate with the message in state so ChatPanel can send it to the AI
      navigate(`/dashboard/${conv.id}`, { state: { initialMessage: value } });
      setValue("");
    } catch {
      // Fallback for mock mode
      navigate("/dashboard", { state: { task: value } });
      setValue("");
    }
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
          placeholder={user ? "What can I help you with?" : "Ask anything..."}
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
                  {defaultIntegrations.map((item) => {
                    const isConnected = connectedIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setConnectedIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(item.id)) next.delete(item.id);
                            else next.add(item.id);
                            return next;
                          });
                        }}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex-shrink-0 text-muted-foreground">{item.icon}</span>
                          <span className="text-sm text-foreground">{item.name}</span>
                          {item.badge && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {isConnected ? (
                          <span className="flex items-center gap-1 text-xs text-[hsl(var(--success))]">
                            <Check size={12} />
                            Connected
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">{item.defaultStatus}</span>
                        )}
                      </div>
                    );
                  })}
                  <div className="border-t border-border px-4 py-2.5 flex items-center gap-3 hover:bg-accent/50 transition-colors cursor-pointer">
                    <Plus size={14} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground">Add connectors</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">+78 available</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-150 rounded-lg hover:bg-secondary active:scale-95">
              <Smile size={18} />
            </button>
            <VoiceMicButton onTranscript={(text) => setValue(text)} />
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
            <span className="text-sm text-muted-foreground flex-1">Connect your tools to Vyroo</span>
            <div className="flex items-center gap-1.5">
              {connectorLogos.map((tool) => (
                <div key={tool.name} title={tool.name} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                  {tool.svg}
                </div>
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
