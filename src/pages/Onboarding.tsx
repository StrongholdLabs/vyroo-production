import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import { verticals } from "@/lib/plugins/verticals";
import type { VerticalType } from "@/lib/plugins/types";
import {
  Sparkles,
  ShoppingCart,
  HeartPulse,
  GraduationCap,
  Landmark,
  Megaphone,
  Terminal,
  Puzzle,
  ArrowLeft,
  ArrowRight,
  Check,
  Rocket,
} from "lucide-react";

// ── Icon map (same as WorkspaceSelector) ──────────────────────────
const iconMap: Record<string, React.ElementType> = {
  sparkles: Sparkles,
  "shopping-cart": ShoppingCart,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  landmark: Landmark,
  megaphone: Megaphone,
  terminal: Terminal,
  puzzle: Puzzle,
};

// ── Role options ──────────────────────────────────────────────────
const roles = [
  { id: "entrepreneur", emoji: "\u{1F680}", title: "Entrepreneur / Business Owner" },
  { id: "developer", emoji: "\u{1F4BB}", title: "Developer / Engineer" },
  { id: "marketer", emoji: "\u{1F4C8}", title: "Marketer / Growth" },
  { id: "designer", emoji: "\u{1F3A8}", title: "Designer / Creative" },
  { id: "student", emoji: "\u{1F393}", title: "Student / Researcher" },
  { id: "other", emoji: "\u{2728}", title: "Other" },
];

// ── Connector stubs ──────────────────────────────────────────────
const connectors = [
  { id: "google", name: "Google", icon: "https://www.svgrepo.com/show/475656/google-color.svg" },
  { id: "github", name: "GitHub", icon: "https://www.svgrepo.com/show/512317/github-142.svg" },
  { id: "slack", name: "Slack", icon: "https://www.svgrepo.com/show/448248/slack.svg" },
  { id: "notion", name: "Notion", icon: "https://www.svgrepo.com/show/521607/notion.svg" },
];

const TOTAL_STEPS = 4;
const WORKSPACE_KEY = "vyroo-workspace";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { complete } = useOnboarding();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [animating, setAnimating] = useState(false);

  // Step 1 state
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Step 2 state
  const [selectedWorkspace, setSelectedWorkspace] = useState<VerticalType>("general");

  // Step 3 state
  const [connectedTools, setConnectedTools] = useState<Set<string>>(new Set());

  // Step 4 celebration
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (step === 3) {
      const timer = setTimeout(() => setShowCelebration(true), 300);
      return () => clearTimeout(timer);
    }
    setShowCelebration(false);
  }, [step]);

  // ── Navigation helpers ────────────────────────────────────────
  function goNext() {
    if (animating) return;
    if (step === 0 && !selectedRole) return; // require role selection
    if (step === 1) {
      localStorage.setItem(WORKSPACE_KEY, selectedWorkspace);
    }
    if (step >= TOTAL_STEPS - 1) {
      // Finish
      complete();
      navigate("/dashboard");
      return;
    }
    setDirection("right");
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setAnimating(false);
    }, 300);
  }

  function goBack() {
    if (animating || step === 0) return;
    setDirection("left");
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => s - 1);
      setAnimating(false);
    }, 300);
  }

  function toggleConnector(id: string) {
    setConnectedTools((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ── Derived ───────────────────────────────────────────────────
  const userName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "there";

  const avatarUrl: string | undefined =
    user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture;

  const canProceed =
    step === 0 ? !!selectedRole : step === 1 ? !!selectedWorkspace : true;

  const slideClass = animating
    ? direction === "right"
      ? "translate-x-8 opacity-0"
      : "-translate-x-8 opacity-0"
    : "translate-x-0 opacity-100";

  // ── Render steps ──────────────────────────────────────────────
  function renderStep() {
    switch (step) {
      // ── Step 1: Welcome / Role ──────────────────────────────
      case 0:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-16 h-16 rounded-full mx-auto ring-2 ring-white/10"
                />
              ) : (
                <div className="w-16 h-16 rounded-full mx-auto bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl font-bold text-white">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <h2 className="text-2xl font-semibold tracking-tight">
                Welcome to Vyroo, {userName}
              </h2>
              <p className="text-muted-foreground text-sm">
                What best describes you?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {roles.map((role) => {
                const active = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      active
                        ? "border-purple-500/60 bg-purple-500/10 text-foreground shadow-lg shadow-purple-500/5"
                        : "border-border/40 bg-white/[0.02] text-muted-foreground hover:bg-white/5 hover:border-border/60"
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{role.emoji}</span>
                    <span className="text-sm font-medium leading-tight">
                      {role.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      // ── Step 2: Workspace / Vertical ────────────────────────
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                Choose your workspace
              </h2>
              <p className="text-muted-foreground text-sm">
                Pick the vertical that best fits your workflow. You can change it
                later.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {Object.values(verticals).map((v) => {
                const Icon = iconMap[v.iconName] ?? Sparkles;
                const active = selectedWorkspace === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedWorkspace(v.id)}
                    className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      active
                        ? "border-purple-500/60 bg-purple-500/10 text-foreground shadow-lg shadow-purple-500/5"
                        : "border-border/40 bg-white/[0.02] text-muted-foreground hover:bg-white/5 hover:border-border/60"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex-shrink-0 p-2 rounded-lg ${
                        active ? "bg-purple-500/20" : "bg-white/5"
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium leading-tight">
                        {v.name}
                      </div>
                      <div className="text-xs text-muted-foreground/70 mt-1 leading-snug">
                        {v.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      // ── Step 3: Connect tools ───────────────────────────────
      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                Connect your tools
              </h2>
              <p className="text-muted-foreground text-sm">
                Link services you use daily. You can always do this later.
              </p>
            </div>

            <div className="space-y-3">
              {connectors.map((c) => {
                const connected = connectedTools.has(c.id);
                return (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between px-5 py-4 rounded-xl border transition-all duration-200 ${
                      connected
                        ? "border-green-500/40 bg-green-500/5"
                        : "border-border/40 bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={c.icon}
                        alt={c.name}
                        className="w-7 h-7 rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <span className="text-sm font-medium">{c.name}</span>
                    </div>
                    <button
                      onClick={() => toggleConnector(c.id)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                        connected
                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                      }`}
                    >
                      {connected ? (
                        <span className="flex items-center gap-1.5">
                          <Check size={12} /> Connected
                        </span>
                      ) : (
                        "Connect"
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={goNext}
              className="w-full text-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-pointer"
            >
              Skip for now
            </button>
          </div>
        );

      // ── Step 4: All set ─────────────────────────────────────
      case 3:
        return (
          <div className="space-y-8 text-center relative">
            {/* Celebration sparkles */}
            {showCelebration && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 24 }).map((_, i) => (
                  <span
                    key={i}
                    className="sparkle-dot"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 1.5}s`,
                      animationDuration: `${1.5 + Math.random() * 1.5}s`,
                    }}
                  />
                ))}
              </div>
            )}

            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Rocket size={28} className="text-white" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                You're all set!
              </h2>
              <p className="text-muted-foreground text-sm">
                Here's a summary of your choices.
              </p>
            </div>

            {/* Summary */}
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 bg-white/[0.02]">
                <span className="text-lg">
                  {roles.find((r) => r.id === selectedRole)?.emoji ?? ""}
                </span>
                <div>
                  <div className="text-xs text-muted-foreground/60">Role</div>
                  <div className="text-sm font-medium">
                    {roles.find((r) => r.id === selectedRole)?.title ?? ""}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 bg-white/[0.02]">
                {(() => {
                  const v = verticals[selectedWorkspace];
                  const Icon = iconMap[v.iconName] ?? Sparkles;
                  return (
                    <>
                      <div className="p-1.5 rounded-lg bg-white/5">
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground/60">
                          Workspace
                        </div>
                        <div className="text-sm font-medium">{v.name}</div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {connectedTools.size > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 bg-white/[0.02]">
                  <div className="p-1.5 rounded-lg bg-white/5">
                    <Check size={18} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground/60">
                      Connected tools
                    </div>
                    <div className="text-sm font-medium">
                      {connectors
                        .filter((c) => connectedTools.has(c.id))
                        .map((c) => c.name)
                        .join(", ")}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={goNext}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium text-sm hover:brightness-110 transition-all duration-200 cursor-pointer"
            >
              Start your first conversation
            </button>
          </div>
        );

      default:
        return null;
    }
  }

  // ── Main layout ───────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center px-4">
      {/* Sparkle animation styles */}
      <style>{`
        @keyframes sparkle-float {
          0% { opacity: 0; transform: scale(0) translateY(0); }
          30% { opacity: 1; transform: scale(1) translateY(-10px); }
          100% { opacity: 0; transform: scale(0) translateY(-40px); }
        }
        .sparkle-dot {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #3b82f6);
          animation: sparkle-float 2s ease-out infinite;
        }
      `}</style>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {/* Content card */}
      <div
        className={`w-full max-w-lg transition-all duration-300 ease-out ${slideClass}`}
      >
        {renderStep()}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-8 flex flex-col items-center gap-6">
        {/* Back / Next */}
        {step < 3 && (
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}
            <button
              onClick={goNext}
              disabled={!canProceed}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                canProceed
                  ? "bg-white/10 text-foreground hover:bg-white/15"
                  : "bg-white/5 text-muted-foreground/40 cursor-not-allowed"
              }`}
            >
              Next <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Step dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === step
                  ? "bg-purple-500 scale-125"
                  : i < step
                  ? "bg-purple-500/40"
                  : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
