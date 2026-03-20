import { useState, useEffect, useRef } from "react";
import {
  Check,
  Loader2,
  ChevronDown,
  Search,
  Globe,
  Code,
  FileText,
  Sparkles,
  ArrowUp,
  Plus,
  Mic,
  Star,
  Presentation,
  Monitor,
  ArrowRight,
} from "lucide-react";

interface LogEntry {
  time: string;
  text: string;
  type: "info" | "action" | "result";
}

interface Step {
  id: number;
  label: string;
  detail: string;
  status: "complete" | "active" | "pending";
  icon: React.ReactNode;
  logs: LogEntry[];
}

const initialSteps: Step[] = [
  {
    id: 1,
    label: "Understanding task",
    detail: "Parsing requirements and planning the research approach",
    status: "complete",
    icon: <Sparkles size={14} />,
    logs: [
      { time: "0:01", text: "Received task: Analyze top 5 DTC skincare brands", type: "info" },
      { time: "0:02", text: "Identifying key comparison metrics", type: "action" },
      { time: "0:03", text: "Planning research strategy across 5 brands", type: "result" },
    ],
  },
  {
    id: 2,
    label: "Researching brands",
    detail: "Browsing documentation and gathering market data",
    status: "complete",
    icon: <Search size={14} />,
    logs: [
      { time: "0:15", text: "Searching for The Ordinary market positioning", type: "action" },
      { time: "0:22", text: "Found pricing data for Glossier product lines", type: "result" },
      { time: "0:30", text: "Analyzing Rhode Skin viral growth metrics", type: "action" },
      { time: "0:38", text: "Comparing Dieux Skin transparency model", type: "result" },
    ],
  },
  {
    id: 3,
    label: "Analyzing pricing strategies",
    detail: "Comparing pricing models and market positioning",
    status: "complete",
    icon: <Globe size={14} />,
    logs: [
      { time: "1:02", text: "Building comparative pricing table", type: "action" },
      { time: "1:15", text: "Categorizing by market tier: budget, mid, premium", type: "info" },
      { time: "1:28", text: "Pricing analysis complete for all 5 brands", type: "result" },
    ],
  },
  {
    id: 4,
    label: "Compile and deliver the final comparative report",
    detail: "Creating final markdown report with all findings",
    status: "complete",
    icon: <FileText size={14} />,
    logs: [
      { time: "2:10", text: "Structuring report sections", type: "action" },
      { time: "2:25", text: "Writing executive summary", type: "action" },
      { time: "2:40", text: "Formatting tables and data visualizations", type: "info" },
      { time: "2:55", text: "Report compiled: dtc_skincare_analysis_final.md", type: "result" },
    ],
  },
];

interface SuggestedFollowUp {
  icon: React.ReactNode;
  text: string;
}

const suggestedFollowUps: SuggestedFollowUp[] = [
  { icon: <Search size={16} />, text: "What are the market trends influencing DTC skincare pricing strategies?" },
  { icon: <Presentation size={16} />, text: "Create a presentation about the top 5 DTC skincare brands and their pricing strategies." },
  { icon: <Monitor size={16} />, text: "Generate a webpage summarizing the key findings of the DTC skincare brand analysis." },
];

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  hasReport?: boolean;
}

const mockMessages: ChatMessage[] = [
  {
    id: "1",
    role: "user",
    content: "Analyze the top 5 DTC skincare brands and their pricing strategies.",
  },
  {
    id: "2",
    role: "assistant",
    content: "Here is the comparative analysis of the top 5 DTC skincare brands and their pricing strategies.",
    hasReport: true,
  },
];

interface ChatPanelProps {
  onSendMessage?: (msg: string) => void;
}

export function ChatPanel({ onSendMessage }: ChatPanelProps) {
  const [message, setMessage] = useState("");
  const [expandedStep, setExpandedStep] = useState<number | null>(4);
  const [steps] = useState(initialSteps);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const totalSteps = steps.length;
  const completedSteps = steps.filter((s) => s.status === "complete").length;

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage?.(message);
    setMessage("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground font-body">Manus 1.6 Lite</span>
          <ChevronDown size={12} className="text-muted-foreground" />
        </div>
        <div className="flex items-center gap-1">
          {[Sparkles, ArrowUp, Globe, FileText].map((Icon, i) => (
            <button key={i} className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors">
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-16 py-6 space-y-6">
        {mockMessages.map((msg) => (
          <div key={msg.id}>
            {msg.role === "user" ? (
              <div className="flex justify-end">
                <div className="chat-bubble-user px-4 py-3 max-w-lg">
                  <p className="text-sm text-foreground">{msg.content}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-foreground leading-relaxed">{msg.content}</p>

                {/* Report card */}
                {msg.hasReport && (
                  <div className="rounded-xl border border-border overflow-hidden" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                      <FileText size={16} className="text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground truncate">
                        Comparative Analysis: Top 5 DTC Skincare Brands and Pricing Strategi...
                      </span>
                      <button className="ml-auto p-1 text-muted-foreground hover:text-foreground">
                        <span className="text-xs">•••</span>
                      </button>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        This report provides a comprehensive analysis of the top five Direct-to-Consumer (DTC) skincare brands currently leading the market. It examines their market positioning, key product pricing, and the underlying strategies that drive their commercial success.
                      </p>
                      <h4 className="text-sm font-medium text-foreground font-body">1. Overview of the Top 5 DTC Skincare Brands</h4>
                      <p className="text-xs text-muted-foreground">
                        The following brands have been selected based on their market influence, viral growth, and distinct pricing models:
                      </p>
                      {/* Mini table */}
                      <div className="overflow-x-auto mt-2">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-1.5 pr-4 font-medium text-foreground">Brand</th>
                              <th className="text-left py-1.5 pr-4 font-medium text-foreground">Market Positioning</th>
                              <th className="text-left py-1.5 font-medium text-foreground">Core Philosophy</th>
                            </tr>
                          </thead>
                          <tbody className="text-muted-foreground">
                            <tr className="border-b border-border/50">
                              <td className="py-1.5 pr-4 font-medium text-foreground">The Ordinary</td>
                              <td className="py-1.5 pr-4">Value/Budget Leader</td>
                              <td className="py-1.5">Clinical formulations with price integrity.</td>
                            </tr>
                            <tr className="border-b border-border/50">
                              <td className="py-1.5 pr-4 font-medium text-foreground">Glossier</td>
                              <td className="py-1.5 pr-4">Mid-Tier Lifestyle</td>
                              <td className="py-1.5">"Skin first, makeup second" community-driven beauty.</td>
                            </tr>
                            <tr className="border-b border-border/50">
                              <td className="py-1.5 pr-4 font-medium text-foreground">Rhode Skin</td>
                              <td className="py-1.5 pr-4">Viral/Celebrity-Led</td>
                              <td className="py-1.5">Curated essentials for a "glazed" look.</td>
                            </tr>
                            <tr>
                              <td className="py-1.5 pr-4 font-medium text-foreground">Dieux Skin</td>
                              <td className="py-1.5 pr-4">Science/Transparency</td>
                              <td className="py-1.5">Radically transparent, clinically vetted formulas.</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Task completed badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-success" />
                    <span className="text-sm font-medium text-success">Task completed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground mr-1">How was this result?</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        className="p-0.5 text-muted-foreground/30 hover:text-[hsl(45_80%_55%)] transition-colors"
                      >
                        <Star size={16} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Suggested follow-ups */}
        <div className="space-y-2 pt-2">
          <span className="text-xs text-muted-foreground font-medium">Suggested follow-ups</span>
          {suggestedFollowUps.map((item, i) => (
            <button key={i} className="suggested-followup w-full text-left">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-muted-foreground flex-shrink-0">{item.icon}</span>
                <span className="text-sm text-foreground truncate">{item.text}</span>
              </div>
              <ArrowRight size={16} className="text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Steps progress bar (collapsed, bottom of chat) */}
        <div className="sticky bottom-0 pt-4">
          <div
            className="rounded-xl border border-border px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors hover:border-muted-foreground/30"
            style={{ backgroundColor: "hsl(var(--surface-elevated))" }}
          >
            <Check size={18} className="text-success flex-shrink-0" />
            <span className="text-sm text-foreground flex-1">
              {steps[steps.length - 1].label}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">{completedSteps} / {totalSteps}</span>
            <ChevronDown size={16} className="text-muted-foreground" />
          </div>
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 px-4 md:px-8 lg:px-16 pb-4">
        <div className="input-main rounded-2xl overflow-hidden">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Send message to Manus"
            rows={1}
            className="w-full resize-none bg-transparent px-5 pt-4 pb-1 text-foreground placeholder:text-muted-foreground/40 text-sm leading-relaxed focus:outline-none font-body"
          />
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1">
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent active:scale-95">
                <Plus size={18} />
              </button>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent active:scale-95">
                <Sparkles size={18} />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent active:scale-95">
                <Mic size={18} />
              </button>
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="p-2.5 rounded-xl bg-foreground text-primary-foreground disabled:opacity-20 hover:opacity-90 transition-all duration-150 active:scale-95"
              >
                <ArrowUp size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
