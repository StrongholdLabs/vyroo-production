import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Zap,
  Crown,
  Users,
  Building2,
  Sparkles,
} from "lucide-react";
import { useSubscription } from "@/hooks/useBilling";

interface PlanTier {
  id: "free" | "pro" | "team" | "enterprise";
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  icon: React.ReactNode;
  popular?: boolean;
  cta: string;
  features: string[];
}

const plans: PlanTier[] = [
  {
    id: "free",
    name: "Free",
    description: "Get started with AI-powered assistance",
    monthlyPrice: 0,
    annualPrice: 0,
    icon: <Sparkles size={20} />,
    cta: "Get Started",
    features: [
      "25 messages per day",
      "Budget models (Haiku, GPT-4o Mini, Gemini Flash)",
      "3 community plugins",
      "2 connectors",
      "32K context window",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For power users who need more",
    monthlyPrice: 20,
    annualPrice: 17,
    icon: <Zap size={20} />,
    popular: true,
    cta: "Upgrade to Pro",
    features: [
      "200 messages per day",
      "All mid-tier models (Sonnet 4, GPT-4o, Gemini Pro)",
      "20 premium model queries/day",
      "Unlimited free plugins + 5 paid",
      "10 connectors",
      "128K context window",
      "1 vertical (e-commerce, healthcare, or finance)",
      "Smart model routing",
      "Priority support",
    ],
  },
  {
    id: "team",
    name: "Team",
    description: "Collaborate with your entire team",
    monthlyPrice: 35,
    annualPrice: 30,
    icon: <Users size={20} />,
    cta: "Upgrade to Team",
    features: [
      "500 messages per day per user",
      "All models including Claude Opus",
      "50 premium queries/day",
      "Unlimited plugins",
      "50 connectors",
      "200K context window",
      "All verticals included",
      "Team workspace & analytics",
      "Admin dashboard",
      "SSO & SAML",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom solutions for large organizations",
    monthlyPrice: -1,
    annualPrice: -1,
    icon: <Building2 size={20} />,
    cta: "Contact Sales",
    features: [
      "Custom message limits with SLA",
      "Dedicated model routing",
      "Unlimited connectors & plugins",
      "Private plugin marketplace",
      "All verticals with compliance (HIPAA, SOC 2)",
      "Dedicated account manager",
      "Custom integrations",
      "On-premise deployment option",
      "Custom training & onboarding",
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { data: subscription } = useSubscription();
  const [isAnnual, setIsAnnual] = useState(false);

  const currentPlan = subscription?.plan ?? "free";

  const handlePlanAction = (planId: string) => {
    if (planId === "enterprise") {
      window.open("mailto:sales@vyroo.com?subject=Enterprise%20Plan%20Inquiry", "_blank");
      return;
    }
    if (planId === currentPlan) return;
    // In a real implementation, this would redirect to Stripe Checkout
    console.log(`Upgrading to ${planId}...`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 pt-6 pb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mb-4"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="text-center max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Crown size={24} className="text-primary" />
              <h1 className="text-3xl font-bold text-foreground font-body tracking-tight">
                Choose Your Plan
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Scale your AI capabilities with a plan that fits your needs. All plans include core
              Vyroo features.
            </p>
          </div>

          {/* Annual toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <span
              className={`text-sm font-medium ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAnnual ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}
            >
              Annual
            </span>
            {isAnnual && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Save 20%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pricing grid */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const isCustom = price === -1;

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border transition-all duration-200 ${
                  plan.popular
                    ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]"
                    : isCurrent
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-border bg-card hover:border-muted-foreground/30"
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary text-primary-foreground">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Current plan badge */}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500 text-white">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* Icon + Name */}
                  <div className="flex items-center gap-2 mb-2 mt-1">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        plan.popular
                          ? "bg-primary/15 text-primary"
                          : "bg-accent text-muted-foreground"
                      }`}
                    >
                      {plan.icon}
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  </div>

                  <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-5">
                    {isCustom ? (
                      <div className="text-2xl font-bold text-foreground">Custom</div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-foreground">${price}</span>
                        <span className="text-sm text-muted-foreground">
                          {plan.id === "team" ? "/seat/mo" : "/mo"}
                        </span>
                      </div>
                    )}
                    {plan.id === "team" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimum 3 seats{isAnnual ? ` • $${price * 12}/seat/year` : ""}
                      </p>
                    )}
                    {isAnnual && !isCustom && price > 0 && plan.id !== "team" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ${price * 12}/year, billed annually
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handlePlanAction(plan.id)}
                    disabled={isCurrent}
                    className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 mb-5 ${
                      isCurrent
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-default"
                        : plan.popular
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-accent text-foreground border border-border hover:bg-accent/80"
                    }`}
                  >
                    {isCurrent ? "Current Plan" : plan.cta}
                  </button>

                  {/* Features */}
                  <div className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <Check
                          size={14}
                          className={`mt-0.5 shrink-0 ${
                            plan.popular ? "text-primary" : "text-emerald-400"
                          }`}
                        />
                        <span className="text-xs text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ / Bottom note */}
        <div className="text-center mt-12 text-xs text-muted-foreground">
          <p>
            All plans include end-to-end encryption, multi-model routing, and the Vyroo plugin
            ecosystem.
          </p>
          <p className="mt-1">
            Need help choosing?{" "}
            <a
              href="mailto:support@vyroo.com"
              className="text-primary hover:underline"
            >
              Contact our team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
