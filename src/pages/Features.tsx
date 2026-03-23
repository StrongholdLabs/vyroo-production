import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import {
  Bot,
  Zap,
  Plug,
  Store,
  MessageSquare,
  Code,
  Globe,
  FileText,
  BarChart3,
  Workflow,
  Shield,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Multi-Provider AI Chat",
    description: "Chat with Claude, GPT-4o, Gemini, and Llama. Vyroo auto-routes to the best model for each task.",
  },
  {
    icon: Bot,
    title: "AI Agents",
    description: "Autonomous agents that research, code, analyze data, and execute multi-step workflows.",
  },
  {
    icon: Workflow,
    title: "Visual Workflows",
    description: "Build complex automation flows with a drag-and-drop editor. Chain agents together.",
  },
  {
    icon: Zap,
    title: "Skills",
    description: "Web research, code assistant, document writer, image analysis, and data analyst — built in.",
  },
  {
    icon: Plug,
    title: "Connectors",
    description: "Connect Google, GitHub, Slack, Notion, and Shopify. Your AI has context from your tools.",
  },
  {
    icon: Store,
    title: "Plugin Marketplace",
    description: "Install plugins for e-commerce, healthcare, finance, marketing, and more.",
  },
  {
    icon: Code,
    title: "Code Generation",
    description: "Write, review, and debug code with syntax highlighting, diffs, and a built-in terminal view.",
  },
  {
    icon: Globe,
    title: "Web Research",
    description: "Real-time web search and browsing. Cite sources. Build research timelines.",
  },
  {
    icon: FileText,
    title: "Document Writer",
    description: "Generate reports, articles, and documentation with markdown rendering and export.",
  },
  {
    icon: BarChart3,
    title: "Data Analysis",
    description: "Upload CSVs, generate charts, and get AI-powered insights from your data.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Row-level security, encrypted API keys, and SOC 2 compliant infrastructure.",
  },
  {
    icon: Sparkles,
    title: "Smart Model Routing",
    description: "Automatic model selection based on task complexity. Pay less for simple tasks, get power when you need it.",
  },
];

const Features = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl text-foreground tracking-tight">
            Everything you need, nothing you don't.
          </h1>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
            One AI assistant that connects to your tools, runs agents, and adapts to your workflow.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center mb-4 group-hover:bg-secondary transition-colors">
                <feature.icon size={20} className="text-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-foreground text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Get started free
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">No credit card required</p>
        </div>
      </main>

      {/* Footer */}
      <div className="py-4 px-4 text-center border-t border-border/30">
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

export default Features;
