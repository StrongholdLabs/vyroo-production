import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { TaskInput } from "@/components/TaskInput";
import { ActionChips } from "@/components/ActionChips";
import AnimatedCardStack from "@/components/ui/animated-card-stack";
import { useAuth } from "@/contexts/AuthContext";
import type { VerticalType } from "@/lib/plugins/types";

// ── Dynamic slogans per workspace vertical ──────────────────────────────
const verticalSlogans: Record<VerticalType, { headline: string; sub: string }> = {
  general: {
    headline: "What can I help you with?",
    sub: "Research, code, analyze, create — your AI for everything.",
  },
  ecommerce: {
    headline: "Grow your store with AI",
    sub: "Manage products, track orders, optimize inventory — all in one place.",
  },
  healthcare: {
    headline: "Smarter healthcare workflows",
    sub: "Patient scheduling, clinical notes, compliance — AI that understands care.",
  },
  education: {
    headline: "Transform how you teach",
    sub: "Curriculum planning, student analytics, grading — your AI teaching assistant.",
  },
  finance: {
    headline: "Your AI financial analyst",
    sub: "Portfolio tracking, risk analysis, reports — make smarter decisions.",
  },
  marketing: {
    headline: "Create campaigns that convert",
    sub: "Content creation, analytics, A/B testing — marketing on autopilot.",
  },
  devtools: {
    headline: "Ship faster with AI",
    sub: "Code review, CI/CD, debugging, docs — your AI engineering teammate.",
  },
  custom: {
    headline: "Build your own AI workspace",
    sub: "Custom plugins, tailored workflows — make Vyroo truly yours.",
  },
};

// ── Page ─────────────────────────────────────────────────────────────────
const Index = () => {
  const [visible, setVisible] = useState(false);
  const [workspace, setWorkspace] = useState<VerticalType>("general");
  const [transitioning, setTransitioning] = useState(false);
  const { loading } = useAuth();

  const handleWorkspaceChange = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.workspace) {
      setTransitioning(true);
      setTimeout(() => {
        setWorkspace(detail.workspace as VerticalType);
        setTransitioning(false);
      }, 300);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("vyroo-workspace");
    if (stored) setWorkspace(stored as VerticalType);
    window.addEventListener("workspace-changed", handleWorkspaceChange);
    return () => window.removeEventListener("workspace-changed", handleWorkspaceChange);
  }, [handleWorkspaceChange]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (loading) return null;

  const slogan = verticalSlogans[workspace] || verticalSlogans.general;

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <Header />

      {/* ─── Centered Composer ──────────────────────────────────── */}
      <main className="flex flex-col items-center px-4 pt-32 md:pt-40">
        <div
          className={`flex flex-col items-center gap-5 w-full max-w-2xl transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          {/* Dynamic headline */}
          <div
            className={`text-center transition-all duration-300 ${
              transitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
            }`}
          >
            <h1
              className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground leading-[1.15] tracking-tight"
              style={{ textWrap: "balance" as any }}
            >
              {slogan.headline}
            </h1>
            <p className="mt-3 text-muted-foreground text-sm md:text-base max-w-lg mx-auto">
              {slogan.sub}
            </p>
          </div>

          {/* Composer */}
          <div className="w-full">
            <TaskInput />
          </div>

          {/* Action chips */}
          <div
            className={`transition-all duration-700 delay-200 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
            style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <ActionChips />
          </div>
        </div>

        {/* ─── Animated Feature Cards ────────────────────────────── */}
        <div
          className={`w-full mt-12 transition-all duration-1000 delay-500 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <AnimatedCardStack />
        </div>
      </main>

      {/* ─── Footer ──────────────────────────────────────────────── */}
      <div className="pt-16 pb-6 px-4 text-center">
        <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground/40">
          <Link to="/terms" className="hover:text-muted-foreground transition-colors">Terms</Link>
          <span>&middot;</span>
          <Link to="/privacy" className="hover:text-muted-foreground transition-colors">Privacy</Link>
          <span>&middot;</span>
          <Link to="/cookies" className="hover:text-muted-foreground transition-colors">Cookies</Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
