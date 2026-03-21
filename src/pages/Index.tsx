import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { TaskInput } from "@/components/TaskInput";
import { ActionChips } from "@/components/ActionChips";
import { useAuth } from "@/contexts/AuthContext";

// ── Page ─────────────────────────────────────────────────────────────────
// Manus / Perplexity style: the landing page IS the app.
// Authenticated users → redirect to dashboard.
// Non-authenticated → clean composer-first experience.

const Index = () => {
  const [visible, setVisible] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Authenticated users go straight to the dashboard
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Don't flash the landing page while checking auth
  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* ─── Centered Composer ──────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-24">
        <div
          className={`flex flex-col items-center gap-5 w-full max-w-2xl transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          {/* Greeting */}
          <h1
            className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground leading-[1.15] tracking-tight text-center"
            style={{ textWrap: "balance" as any }}
          >
            What can I help you with?
          </h1>

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

        {/* ─── Bottom subtle auth links ──────────────────────────────── */}
        <div
          className={`mt-12 flex items-center gap-4 text-sm text-muted-foreground transition-all duration-700 delay-400 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          <Link
            to="/login"
            className="hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <span className="text-border">|</span>
          <Link
            to="/signup"
            className="hover:text-foreground transition-colors"
          >
            Create account
          </Link>
          <span className="text-border">|</span>
          <Link
            to="/pricing"
            className="hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
        </div>
      </main>

      {/* ─── Minimal footer ──────────────────────────────────────────── */}
      <footer className="py-4 px-4 text-center">
        <p className="text-xs text-muted-foreground/40">
          Vyroo — Everything you need, nothing you don't.
        </p>
      </footer>
    </div>
  );
};

export default Index;
