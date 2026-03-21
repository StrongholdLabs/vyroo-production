import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { TaskInput } from "@/components/TaskInput";
import { ActionChips } from "@/components/ActionChips";
import { PromoCarousel } from "@/components/PromoCarousel";
import {
  Brain,
  Store,
  Mic,
  Plug,
  MessageSquare,
  Zap,
  Sparkles,
  ShoppingCart,
  HeartPulse,
  GraduationCap,
  Landmark,
  Megaphone,
  Terminal,
  Puzzle,
  Check,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { verticals } from "@/lib/plugins/verticals";
import type { VerticalType } from "@/lib/plugins/types";

// ── Icon mapping for verticals ──────────────────────────────────────────
const verticalIconMap: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  "shopping-cart": ShoppingCart,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  landmark: Landmark,
  megaphone: Megaphone,
  terminal: Terminal,
  puzzle: Puzzle,
};

const verticalColorMap: Record<string, string> = {
  blue: "from-blue-500/20 to-blue-600/5",
  green: "from-green-500/20 to-green-600/5",
  red: "from-red-500/20 to-red-600/5",
  purple: "from-purple-500/20 to-purple-600/5",
  amber: "from-amber-500/20 to-amber-600/5",
  pink: "from-pink-500/20 to-pink-600/5",
  cyan: "from-cyan-500/20 to-cyan-600/5",
  gray: "from-gray-500/20 to-gray-600/5",
};

const verticalBorderMap: Record<string, string> = {
  blue: "border-blue-500/30",
  green: "border-green-500/30",
  red: "border-red-500/30",
  purple: "border-purple-500/30",
  amber: "border-amber-500/30",
  pink: "border-pink-500/30",
  cyan: "border-cyan-500/30",
  gray: "border-gray-500/30",
};

// ── Feature data ────────────────────────────────────────────────────────
const features = [
  {
    icon: Brain,
    title: "Multi-Provider AI",
    description:
      "Switch between Claude, GPT-4, Gemini, and Llama. Pick the best model for every task.",
  },
  {
    icon: Store,
    title: "Plugin Marketplace",
    description:
      "Extend with vertical-specific superpowers. Install plugins in one click.",
  },
  {
    icon: Mic,
    title: "Voice & Computer",
    description:
      "Talk to Vyroo or watch it work in real-time with computer-use mode.",
  },
  {
    icon: Plug,
    title: "Smart Connectors",
    description:
      "Connect Google, Slack, GitHub, Shopify & more. Your tools, unified.",
  },
  {
    icon: MessageSquare,
    title: "Conversation Memory",
    description:
      "Persistent context that remembers everything across sessions.",
  },
  {
    icon: Zap,
    title: "Skills System",
    description:
      "Toggle AI capabilities on or off. Full control over what Vyroo can do.",
  },
];

// ── Pricing data ────────────────────────────────────────────────────────
const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    cta: "Get Started Free",
    ctaStyle: "border border-border text-foreground hover:bg-secondary",
    features: [
      "5 conversations / day",
      "1 AI provider (GPT-4o mini)",
      "Community plugins",
    ],
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    cta: "Start 14-day trial",
    ctaStyle: "bg-foreground text-primary-foreground hover:opacity-90",
    popular: true,
    features: [
      "Unlimited conversations",
      "All AI providers",
      "Premium plugins & connectors",
      "Priority support",
    ],
  },
  {
    name: "Team",
    price: "$79",
    period: "/mo",
    cta: "Start 14-day trial",
    ctaStyle: "border border-border text-foreground hover:bg-secondary",
    features: [
      "Everything in Pro",
      "5 team members included",
      "Shared workspaces & memory",
      "Admin dashboard & analytics",
    ],
  },
];

// ── Scroll animation hook ───────────────────────────────────────────────
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
      style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      {children}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────
const Index = () => {
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="flex-none flex flex-col items-center justify-center px-4 pt-24 pb-20 md:pt-32 md:pb-28">
        <div
          className={`flex flex-col items-center gap-6 w-full max-w-6xl transition-all duration-700 ${
            heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <h1
            className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground leading-[1.1] tracking-tight text-center"
            style={{ textWrap: "balance" as any }}
          >
            Your AI assistant that actually
            <br className="hidden sm:block" /> knows your business
          </h1>

          <p className="text-muted-foreground text-base md:text-lg text-center max-w-2xl leading-relaxed">
            Vyroo combines powerful AI with vertical-specific plugins to
            automate your workflows, manage your data, and grow your business.
          </p>

          <div className="w-full max-w-2xl">
            <TaskInput />
          </div>

          <div
            className={`transition-all duration-700 delay-200 ${
              heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
            style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <ActionChips />
          </div>

          <p className="text-xs text-muted-foreground/60">
            No credit card required
          </p>

          {/* Social proof */}
          <div
            className={`flex items-center gap-3 transition-all duration-700 delay-300 ${
              heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
            style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <div className="flex -space-x-2">
              {[
                "bg-blue-500",
                "bg-green-500",
                "bg-purple-500",
                "bg-amber-500",
                "bg-pink-500",
              ].map((bg, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-full ${bg} border-2 border-background flex items-center justify-center text-[10px] text-white font-medium`}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              Trusted by <span className="text-foreground font-medium">2,000+</span> businesses
            </span>
          </div>
        </div>
      </section>

      {/* ─── Feature Grid ─────────────────────────────────────────────── */}
      <section className="px-4 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <Section>
            <h2 className="font-display text-3xl md:text-4xl text-foreground text-center mb-4 tracking-tight">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="text-muted-foreground text-center mb-12 md:mb-16 max-w-xl mx-auto">
              A complete AI toolkit built for people who ship.
            </p>
          </Section>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Section key={f.title}>
                <div
                  className="group rounded-2xl border border-border/60 p-6 hover:border-border transition-colors duration-300"
                  style={{
                    background:
                      "linear-gradient(145deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)",
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <f.icon size={20} className="text-foreground" />
                  </div>
                  <h3 className="text-foreground font-semibold text-base mb-2">
                    {f.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Verticals ────────────────────────────────────────────────── */}
      <section className="px-4 py-20 md:py-28 border-t border-border/40">
        <div className="max-w-6xl mx-auto">
          <Section>
            <h2 className="font-display text-3xl md:text-4xl text-foreground text-center mb-4 tracking-tight">
              One platform. Every industry.
            </h2>
            <p className="text-muted-foreground text-center mb-12 md:mb-16 max-w-xl mx-auto">
              Vyroo adapts to your domain with purpose-built plugins and workflows.
            </p>
          </Section>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(verticals) as VerticalType[]).map((key) => {
              const v = verticals[key];
              const Icon = verticalIconMap[v.iconName] || Sparkles;
              const gradient = verticalColorMap[v.color] || verticalColorMap.gray;
              const borderColor = verticalBorderMap[v.color] || verticalBorderMap.gray;

              return (
                <Section key={v.id}>
                  <div
                    className={`rounded-2xl border ${borderColor} p-5 bg-gradient-to-br ${gradient} hover:scale-[1.02] transition-transform duration-300`}
                  >
                    <Icon size={22} className="text-foreground mb-3" />
                    <h3 className="text-foreground font-semibold text-sm mb-1">
                      {v.name}
                    </h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {v.description}
                    </p>
                  </div>
                </Section>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Pricing Preview ──────────────────────────────────────────── */}
      <section className="px-4 py-20 md:py-28 border-t border-border/40">
        <div className="max-w-6xl mx-auto">
          <Section>
            <h2 className="font-display text-3xl md:text-4xl text-foreground text-center mb-4 tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground text-center mb-12 md:mb-16 max-w-md mx-auto">
              Start free. Upgrade when you need more power.
            </p>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {pricingPlans.map((plan) => (
              <Section key={plan.name}>
                <div
                  className={`rounded-2xl border p-6 flex flex-col relative ${
                    plan.popular
                      ? "border-foreground/30 ring-1 ring-foreground/10"
                      : "border-border/60"
                  }`}
                  style={{
                    background:
                      "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)",
                  }}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-semibold px-3 py-0.5 rounded-full bg-foreground text-primary-foreground">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-foreground font-semibold text-lg mb-1">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-3xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-muted-foreground text-sm">
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((feat) => (
                      <li
                        key={feat}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <Check size={14} className="mt-0.5 text-foreground flex-shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={plan.name === "Free" ? "/signup" : "/pricing"}
                    className={`w-full text-center py-2.5 rounded-xl text-sm font-medium transition-all duration-200 block ${plan.ctaStyle}`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </Section>
            ))}
          </div>

          <Section>
            <p className="text-center mt-8 text-sm text-muted-foreground">
              <Link
                to="/pricing"
                className="text-foreground hover:underline font-medium"
              >
                View full pricing details
              </Link>
            </p>
          </Section>
        </div>
      </section>

      {/* ─── CTA Footer ───────────────────────────────────────────────── */}
      <section className="px-4 py-20 md:py-28 border-t border-border/40">
        <Section className="max-w-6xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4 tracking-tight">
            Ready to supercharge your workflow?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Get started in 30 seconds — no credit card required.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-foreground text-primary-foreground text-base font-semibold hover:opacity-90 transition-opacity duration-200"
          >
            Get Started Free
            <ArrowRight size={18} />
          </Link>
          <p className="mt-6 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-foreground hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </Section>
      </section>
    </div>
  );
};

export default Index;
