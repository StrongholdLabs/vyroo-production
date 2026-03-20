import { useState, useRef, useEffect } from "react";
import {
  Check,
  ChevronDown,
  FileText,
  Sparkles,
  ArrowUp,
  Plus,
  Mic,
  Star,
  ArrowRight,
  Globe,
  Eye,
  Share2,
  Download,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";
import type { Conversation, ChatMessage as ChatMsg } from "@/data/conversations";
import { ComputerThumbnail } from "@/components/ComputerThumbnail";
import { ThinkingIndicator } from "@/components/ThinkingIndicator";
import { ExpandableStep } from "@/components/ExpandableStep";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { InlineComputerCard } from "@/components/InlineComputerCard";
import { DocumentPreview } from "@/components/DocumentPreview";

interface ChatPanelProps {
  conversation: Conversation;
  computerVisible?: boolean;
  onOpenComputer?: () => void;
  onSendMessage?: (msg: string) => void;
}

export function ChatPanel({ conversation, computerVisible, onOpenComputer, onSendMessage }: ChatPanelProps) {
  const [message, setMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { steps, messages, followUps } = conversation;
  const isComplete = conversation.isComplete ?? false;
  const totalSteps = steps.length;
  const completedSteps = steps.filter((s) => s.status === "complete").length;

  // Simulate thinking on send
  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage?.(message);
    setMessage("");
    setIsThinking(true);
    setTimeout(() => setIsThinking(false), 3000);
  };

  // Show thinking briefly on conversation switch
  useEffect(() => {
    setIsThinking(true);
    const t = setTimeout(() => setIsThinking(false), 2000);
    return () => clearTimeout(t);
  }, [conversation.id]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground font-body">Vyroo 1.6 Lite</span>
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6">
        <div className={`mx-auto px-4 md:px-8 space-y-6 transition-all duration-300 ${computerVisible ? "max-w-none lg:px-12" : "max-w-3xl"}`}>
        {messages.map((msg) => (
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

                {msg.hasReport && msg.tableData && (
                  <div className="rounded-xl border border-border overflow-hidden" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                      <FileText size={16} className="text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground truncate">{msg.reportTitle}</span>
                      <button className="ml-auto p-1 text-muted-foreground hover:text-foreground">
                        <span className="text-xs">•••</span>
                      </button>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                      <p className="text-xs text-muted-foreground leading-relaxed">{msg.reportSummary}</p>
                      <div className="overflow-x-auto mt-2">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border">
                              {msg.tableData.headers.map((h, i) => (
                                <th key={i} className="text-left py-1.5 pr-4 font-medium text-foreground">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="text-muted-foreground">
                            {msg.tableData.rows.map((row, ri) => (
                              <tr key={ri} className="border-b border-border/50">
                                {row.map((cell, ci) => (
                                  <td key={ci} className={`py-1.5 pr-4 ${ci === 0 ? "font-medium text-foreground" : ""}`}>{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Task completed */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-success" />
                    <span className="text-sm font-medium text-success">Task completed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground mr-1">How was this result?</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} className="p-0.5 text-muted-foreground/30 hover:text-[hsl(45_80%_55%)] transition-colors">
                        <Star size={16} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Expandable steps in chat */}
        <div className="space-y-3">
          {steps.map((step, i) => (
            <ExpandableStep key={step.id} step={step} isActive={i === 0} />
          ))}
        </div>

        {/* Upgrade banner */}
        <UpgradeBanner />

        {/* Continue working status */}
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-medium">Vyroo will continue working after your reply</span>
        </div>

        {/* Thinking indicator */}
        {isThinking && <ThinkingIndicator />}

        {/* Follow-ups */}
        {followUps.length > 0 && !isThinking && (
          <div className="space-y-2 pt-2">
            <span className="text-xs text-muted-foreground font-medium">Suggested follow-ups</span>
            {followUps.map((item, i) => (
              <button key={i} className="suggested-followup w-full text-left">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-muted-foreground flex-shrink-0">{item.icon}</span>
                  <span className="text-sm text-foreground truncate">{item.text}</span>
                </div>
                <ArrowRight size={16} className="text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Publish card for completed conversations */}
        {isComplete && !isThinking && conversation.editorLabel === "Code Editor" && (
          <div className="rounded-xl border border-border overflow-hidden" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "hsl(var(--success-soft))" }}>
                <Globe size={16} className="text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{conversation.title}</p>
                <p className="text-xs text-muted-foreground">Not published · Just now</p>
              </div>
              <button className="px-4 py-1.5 text-xs font-medium text-foreground rounded-lg transition-colors active:scale-[0.97] hover:opacity-90" style={{ backgroundColor: "hsl(var(--success))" }}>
                Publish
              </button>
            </div>
          </div>
        )}

        {/* Inline computer card when panel is closed */}
        {!computerVisible && onOpenComputer && (
          <InlineComputerCard steps={steps} onOpenComputer={onOpenComputer} />
        )}

        {/* Steps progress bar with code thumbnail */}
        <div className="sticky bottom-0 pt-4">
          <div className="rounded-xl border border-border px-3 py-2.5 flex items-center gap-3" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
            {/* Mini code thumbnail */}
            <div
              className="w-14 h-10 rounded-md overflow-hidden flex-shrink-0 border border-border p-1.5"
              style={{ backgroundColor: "hsl(var(--code-bg))" }}
              onClick={onOpenComputer}
              role="button"
            >
              <div className="space-y-[3px]">
                <div className="h-[2px] rounded-full bg-muted-foreground/20 w-full" />
                <div className="h-[2px] rounded-full bg-muted-foreground/15 w-3/4" />
                <div className="h-[2px] rounded-full bg-muted-foreground/20 w-5/6" />
                <div className="h-[2px] rounded-full bg-muted-foreground/10 w-2/3" />
                <div className="h-[2px] rounded-full bg-muted-foreground/15 w-4/5" />
                <div className="h-[2px] rounded-full bg-muted-foreground/20 w-1/2" />
              </div>
            </div>
            <Check size={16} className="text-success flex-shrink-0" />
            <span className="text-sm text-foreground flex-1 truncate">{steps[steps.length - 1]?.label}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{completedSteps} / {totalSteps}</span>
            <ChevronDown size={16} className="text-muted-foreground" />
          </div>
        </div>

        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pb-4">
        <div className={`mx-auto px-4 md:px-8 transition-all duration-300 ${computerVisible ? "max-w-none lg:px-12" : "max-w-3xl"}`}>
        <div className="input-main rounded-2xl overflow-hidden">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder="Send message to Vyroo"
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
    </div>
  );
}
