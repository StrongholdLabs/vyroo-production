import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Check,
  ChevronDown,
  FileText,
  Sparkles,
  ArrowUp,
  Plus,

  Star,
  ArrowRight,
  Globe,
  Eye,
  Share2,
  Download,
  MoreHorizontal,
  ChevronRight,
  Square,
  AudioLines,
} from "lucide-react";
import type { Conversation, ChatMessage as ChatMsg } from "@/data/conversations";
import { ComputerThumbnail } from "@/components/ComputerThumbnail";
import { ThinkingIndicator } from "@/components/ThinkingIndicator";
import { ExpandableStep } from "@/components/ExpandableStep";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { InlineComputerCard } from "@/components/InlineComputerCard";
import { DocumentPreview } from "@/components/DocumentPreview";
import { ProjectInitCard } from "@/components/ProjectInitCard";
import { ModelSwitcher } from "@/components/ModelSwitcher";
import { VoiceMicButton } from "@/components/VoiceMicButton";
import { VoiceAgentOverlay } from "@/components/VoiceAgentOverlay";
import { FollowUpPanel } from "@/components/FollowUpPanel";
import { ShareConversation } from "@/components/ShareConversation";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { SlidesOutlineCard } from "@/components/SlidesOutlineCard";
import { SlidePreviewCard } from "@/components/SlidePreviewCard";
import { useAIChat } from "@/hooks/useAIChat";

/** Render inline markdown (bold + code) within table cells */
function renderInlineMarkdown(text: string): React.ReactNode {
  if (!text || (!text.includes("**") && !text.includes("`"))) return text;
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|`(.+?)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[1]) parts.push(<strong key={key++} className="font-semibold text-foreground">{match[1]}</strong>);
    else if (match[2]) parts.push(<code key={key++} className="px-1 py-0.5 rounded bg-secondary text-xs">{match[2]}</code>);
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <>{parts}</>;
}

interface ChatPanelProps {
  conversation: Conversation;
  computerVisible?: boolean;
  onOpenComputer?: () => void;
  onSendMessage?: (msg: string) => void;
  onComputerViewUpdate?: (view: any) => void;
  initialMessage?: string | null;
  onInitialMessageSent?: () => void;
}

export function ChatPanel({ conversation, computerVisible, onOpenComputer, onSendMessage, onComputerViewUpdate, initialMessage, onInitialMessageSent }: ChatPanelProps) {
  const [message, setMessage] = useState("");
  const [reportMenuOpen, setReportMenuOpen] = useState<string | null>(null);
  const [previewMsg, setPreviewMsg] = useState<ChatMsg | null>(null);
  const [voiceAgentOpen, setVoiceAgentOpen] = useState(false);
  const [voiceAiResponse, setVoiceAiResponse] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const responseStartRef = useRef<HTMLDivElement>(null);
  const hasScrolledToResponse = useRef(false);

  const { send: sendAI, abort, isStreaming, streamingContent, error: aiError, followUps: aiFollowUps, steps: streamingSteps, report: streamingReport, lastReport, slidesData, lastSlidesData, taskMode, toolCalls, searchResults, browseData, isUsingTools, sources } = useAIChat({
    conversationId: conversation.id,
  });

  // Auto-open computer panel when tools are used
  useEffect(() => {
    if (isUsingTools && onOpenComputer) {
      onOpenComputer();
    }
  }, [isUsingTools]);

  // Push live tool data to Computer Panel — using enriched data from backend
  useEffect(() => {
    if (!onComputerViewUpdate) return;
    if (searchResults.length > 0 || browseData.length > 0 || streamingReport || slidesData) {
      const latestSearch = searchResults[searchResults.length - 1];
      const latestBrowse = browseData[browseData.length - 1];

      // Determine which tab to show based on latest activity
      let viewType: "browser" | "search" | "document" | "slides" = "search";
      if (slidesData) viewType = "slides";
      else if (streamingReport?.content) viewType = "document";
      else if (latestBrowse) viewType = "browser";

      // Favicon color palette for search results
      const faviconColors = ["hsl(210 80% 55%)", "hsl(150 60% 45%)", "hsl(45 80% 50%)", "hsl(340 65% 50%)", "hsl(280 60% 55%)", "hsl(20 80% 50%)"];

      onComputerViewUpdate({
        type: viewType,
        searchQuery: latestSearch?.query,
        // Map search results with enriched data (favicon, domain)
        searchResults: latestSearch?.results?.map((r: any, i: number) => ({
          title: r.title,
          url: r.url,
          date: r.domain || "",
          snippet: r.snippet || "",
          faviconColor: faviconColors[i % faviconColors.length],
          favicon: r.favicon || "",
        })),
        browserUrl: latestBrowse?.url,
        // Use structured sections from backend if available, fallback to raw text
        browserContent: latestBrowse ? {
          type: "website" as const,
          siteName: latestBrowse.domain || "",
          pageTitle: latestBrowse.title || "Page",
          sections: (latestBrowse.sections && latestBrowse.sections.length > 0)
            ? latestBrowse.sections.map((s: any) => ({
                type: s.type as "nav" | "hero" | "text" | "table" | "tags" | "list",
                content: s.content || "",
                items: s.items,
                tableHeaders: s.tableHeaders,
                tableRows: s.tableRows,
              }))
            : [{ type: "text" as const, content: latestBrowse.content?.substring(0, 5000) || "" }],
        } : undefined,
        // Browser tabs from all browsed URLs
        browserTabs: browseData.length > 0 ? browseData.map((b, i) => ({
          id: String(i),
          title: b.title || b.domain || "Page",
          url: b.url,
          favicon: b.favicon,
          active: i === browseData.length - 1,
        })) : undefined,
        // Document/report data for the Document tab
        document: streamingReport?.content ? {
          title: streamingReport.title,
          content: streamingReport.content,
          format: streamingReport.format || "markdown",
          wordCount: streamingReport.word_count || 0,
        } : undefined,
        // Slides data for the Slides tab
        slides: slidesData ? {
          title: slidesData.title,
          slides: slidesData.slides,
          slideCount: slidesData.slideCount,
        } : undefined,
        // Timeline with elapsed timestamps and enriched data
        timeline: [
          ...searchResults.map((s: any, i: number) => ({
            id: i + 1,
            timestamp: s.elapsed || "0:00",
            type: "search" as const,
            title: `Searched: "${s.query}"`,
            snippet: `Found ${s.results.length} results`,
          })),
          ...browseData.map((b: any, i: number) => {
            const domain = b.domain || (() => { try { return new URL(b.url).hostname; } catch { return ""; } })();
            const durationSec = b.durationMs ? Math.round(b.durationMs / 1000) : 0;
            return {
              id: 100 + i,
              timestamp: b.elapsed || "0:00",
              type: "browse" as const,
              title: b.title || "Browsed page",
              url: b.url,
              domain,
              faviconColor: faviconColors[i % faviconColors.length],
              snippet: b.content?.substring(0, 150) || "",
              duration: durationSec > 0 ? `${durationSec}s` : undefined,
            };
          }),
          ...(streamingReport?.content ? [{
            id: 200,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: "save" as const,
            title: `Report: ${streamingReport.title}`,
            snippet: `${streamingReport.word_count || 0} words`,
          }] : []),
        ],
      });
    }
  }, [searchResults, browseData, streamingReport, slidesData, onComputerViewUpdate]);

  // Auto-focus composer on conversation switch
  useEffect(() => {
    const timer = setTimeout(() => textareaRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, [conversation.id]);

  // Auto-scroll to bottom on initial load
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }, 100);
  }, [conversation.id]);

  // Auto-scroll to response START when final response begins (not the bottom)
  // This guides the user to read from the top of the response
  useEffect(() => {
    if (isStreaming && streamingContent && !hasScrolledToResponse.current) {
      hasScrolledToResponse.current = true;
      // Scroll to the response start with some offset so user sees context
      responseStartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (!isStreaming) {
      hasScrolledToResponse.current = false;
    }
  }, [isStreaming, streamingContent]);

  // Auto-send initial message from TaskInput
  const initialSentRef = useRef(false);
  useEffect(() => {
    if (initialMessage && !initialSentRef.current && !isStreaming) {
      initialSentRef.current = true;
      onSendMessage?.(initialMessage);
      sendAI(initialMessage);
      onInitialMessageSent?.();
    }
  }, [initialMessage]);

  const { steps, messages, followUps: staticFollowUps } = conversation;
  // Use AI-generated follow-ups if available, otherwise fall back to conversation's static ones
  const dynamicFollowUps = aiFollowUps.length > 0 ? aiFollowUps : [];
  const isComplete = conversation.isComplete ?? false;
  const isWebsite = conversation.type === "website";
  const totalSteps = steps.length;
  const completedSteps = steps.filter((s) => s.status === "complete").length;
  const isThinking = isStreaming;
  const isAgentic = taskMode === "agentic" || steps.length > 1;
  const lastAssistantId = useMemo(() => messages.filter(m => m.role === "assistant").pop()?.id, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage?.(message);
    sendAI(message);
    setMessage("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <ModelSwitcher />
        </div>
        <div className="flex items-center gap-1">
          <ShareConversation conversationId={conversation.id} />
          <button
            onClick={() => setVoiceAgentOpen(true)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
            title="Voice Agent"
          >
            <AudioLines size={16} />
          </button>
          {[Sparkles, ArrowUp, Globe, FileText].map((Icon, i) => (
            <button key={i} className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors">
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto py-6">
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
                <div className="text-sm text-foreground leading-relaxed prose prose-sm dark:prose-invert prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground prose-code:text-foreground prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-secondary prose-pre:border prose-pre:border-border max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>

                {msg.hasReport && msg.tableData && (
                  <div className="rounded-xl border border-border overflow-hidden" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                      <FileText size={16} className="text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground truncate">{msg.reportTitle}</span>
                      <div className="ml-auto relative">
                        <button
                          onClick={() => setReportMenuOpen(reportMenuOpen === msg.id ? null : msg.id)}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        {reportMenuOpen === msg.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setReportMenuOpen(null)} />
                            <div
                              className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-border py-1.5 z-20 shadow-xl"
                              style={{ backgroundColor: "hsl(var(--popover))" }}
                            >
                              <button
                                onClick={() => { setReportMenuOpen(null); setPreviewMsg(msg); }}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                              >
                                <Eye size={16} className="text-muted-foreground" />
                                Preview
                              </button>
                              <button
                                onClick={() => setReportMenuOpen(null)}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                              >
                                <Share2 size={16} className="text-muted-foreground" />
                                Share
                              </button>
                              <button
                                onClick={() => setReportMenuOpen(null)}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                              >
                                <Download size={16} className="text-muted-foreground" />
                                <span className="flex-1 text-left">Download</span>
                                <ChevronRight size={14} className="text-muted-foreground" />
                              </button>
                              <div className="h-px bg-border my-1" />
                              <button
                                onClick={() => setReportMenuOpen(null)}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                              >
                                <Globe size={16} className="text-[hsl(210_60%_55%)]" />
                                Convert to Google Docs
                              </button>
                              <button
                                onClick={() => setReportMenuOpen(null)}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                              >
                                <Globe size={16} className="text-[hsl(45_80%_55%)]" />
                                Save to Google Drive
                              </button>
                              <button
                                onClick={() => setReportMenuOpen(null)}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                              >
                                <Globe size={16} className="text-[hsl(210_80%_55%)]" />
                                Save to OneDrive (personal)
                              </button>
                              <button
                                onClick={() => setReportMenuOpen(null)}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                              >
                                <Globe size={16} className="text-[hsl(210_60%_45%)]" />
                                Save to OneDrive (work/school)
                              </button>
                            </div>
                          </>
                        )}
                      </div>
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
                                  <td key={ci} className={`py-1.5 pr-4 ${ci === 0 ? "font-medium text-foreground" : ""}`}>{renderInlineMarkdown(cell)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Project init card for website conversations */}
                {isWebsite && conversation.project && (
                  <ProjectInitCard project={conversation.project} onView={onOpenComputer} />
                )}

                {/* Task completed — only for agentic, complete tasks, on the last assistant message */}
                {isAgentic && isComplete && msg.id === lastAssistantId && (
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
                )}
              </div>
            )}
          </div>
        ))}

        {/* Steps — show streaming steps during execution, fallback to persisted steps (hide in direct mode) */}
        {taskMode !== "direct" && (streamingSteps.length > 0 ? streamingSteps : steps).length > 0 && (
          <div className="space-y-1">
            {(streamingSteps.length > 0 ? streamingSteps : steps).map((step) => (
              <ExpandableStep
                key={step.id}
                step={step}
                isActive={step.status === "active"}
              />
            ))}
          </div>
        )}

        {/* Upgrade banner — show for free plan users after agentic response */}
        {!isStreaming && streamingSteps.length > 0 && (
          <UpgradeBanner />
        )}

        {/* Continue working status removed — not in original Manus design */}

        {/* Sources removed — not in original Manus design */}

        {/* Streaming response */}
        <div ref={responseStartRef} />
        {isStreaming && streamingContent && (
          <div className="space-y-2">
            <div className="text-sm text-foreground leading-relaxed prose prose-sm dark:prose-invert prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground prose-code:text-foreground prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-secondary prose-pre:border prose-pre:border-border max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
              <span className="inline-block w-0.5 h-4 bg-foreground animate-pulse ml-0.5 align-text-bottom" />
            </div>
          </div>
        )}

        {/* Report card — persists across follow-ups */}
        {(() => { const activeReport = streamingReport || lastReport; return activeReport ? (
          <div className="rounded-xl border border-border overflow-hidden" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <FileText size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground truncate">{activeReport.title}</span>
              <div className="ml-auto relative">
                <button
                  onClick={() => setReportMenuOpen(reportMenuOpen === "streaming" ? null : "streaming")}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                >
                  <MoreHorizontal size={16} />
                </button>
                {reportMenuOpen === "streaming" && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setReportMenuOpen(null)} />
                    <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-border py-1.5 z-20 shadow-xl" style={{ backgroundColor: "hsl(var(--popover))" }}>
                      <button onClick={() => { setReportMenuOpen(null); setPreviewMsg({ id: "streaming", role: "assistant", content: activeReport.content || "", hasReport: true, reportTitle: activeReport.title, reportSummary: activeReport.summary, tableData: { headers: activeReport.headers, rows: activeReport.rows } } as any); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors">
                        <Eye size={16} className="text-muted-foreground" />Preview
                      </button>
                      <button onClick={() => setReportMenuOpen(null)} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors">
                        <Share2 size={16} className="text-muted-foreground" />Share
                      </button>
                      <button onClick={() => setReportMenuOpen(null)} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors">
                        <Download size={16} className="text-muted-foreground" /><span className="flex-1 text-left">Download</span><ChevronRight size={14} className="text-muted-foreground" />
                      </button>
                      <div className="h-px bg-border my-1" />
                      <button onClick={() => setReportMenuOpen(null)} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors">
                        <Globe size={16} className="text-[hsl(210_60%_55%)]" />Convert to Google Docs
                      </button>
                      <button onClick={() => setReportMenuOpen(null)} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors">
                        <Globe size={16} className="text-[hsl(45_80%_55%)]" />Save to Google Drive
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="px-4 py-3 space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">{activeReport.summary}</p>
              {activeReport.headers.length > 0 && (
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        {activeReport.headers.map((h, i) => (
                          <th key={i} className="text-left py-1.5 pr-4 font-medium text-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      {activeReport.rows.map((row, ri) => (
                        <tr key={ri} className="border-b border-border/50">
                          {row.map((cell, ci) => (
                            <td key={ci} className={`py-1.5 pr-4 ${ci === 0 ? "font-medium text-foreground" : ""}`}>{renderInlineMarkdown(cell)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null; })()}

        {/* Slides outline + preview cards — persists across follow-ups */}
        {(() => { const activeSlides = slidesData || lastSlidesData; return activeSlides ? (
          <div className="space-y-3">
            <SlidesOutlineCard
              title="Slides outline"
              subtitle={activeSlides.title}
              slides={activeSlides.slides.map((s, i) => ({
                number: i + 1,
                title: s.title,
                description: s.subtitle || "",
              }))}
              onSlideClick={() => onOpenComputer?.()}
            />
            {/* Inline slide preview cards (first 2) */}
            {activeSlides.slides.slice(0, 2).map((slide, i) => (
              <SlidePreviewCard
                key={i}
                slide={slide}
                slideNumber={i + 1}
                totalSlides={activeSlides.slideCount}
                onClick={() => onOpenComputer?.()}
              />
            ))}
          </div>
        ) : null; })()}

        {/* AI error */}
        {aiError && (
          <div className="px-3 py-2 rounded-lg border border-destructive/30 bg-destructive/10 text-sm text-destructive">
            {aiError}
          </div>
        )}

        {/* Thinking indicator */}
        {isThinking && !streamingContent && <ThinkingIndicator />}

        {/* AI-generated follow-ups */}
        <FollowUpPanel
          followUps={dynamicFollowUps}
          visible={!isThinking && dynamicFollowUps.length > 0}
          onSelect={(text) => {
            onSendMessage?.(text);
            sendAI(text);
          }}
        />

        {/* Static follow-ups (from conversation data, fallback) */}
        {staticFollowUps.length > 0 && dynamicFollowUps.length === 0 && !isThinking && (
          <div className="space-y-2 pt-2">
            <span className="text-xs text-muted-foreground font-medium">Suggested follow-ups</span>
            {staticFollowUps.map((item, i) => (
              <button key={i} className="suggested-followup w-full text-left" onClick={() => {
                onSendMessage?.(item.text);
                sendAI(item.text);
              }}>
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
        {isComplete && !isThinking && isWebsite && (
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

        {/* Inline computer card when panel is closed (hide in direct mode and when no steps) */}
        {taskMode !== "direct" && !computerVisible && onOpenComputer && (streamingSteps.length > 0 || steps.length > 0) && (
          <InlineComputerCard steps={streamingSteps.length > 0 ? streamingSteps : steps} onOpenComputer={onOpenComputer} />
        )}

        {/* Steps progress bar with code thumbnail — only show when there are steps */}
        {totalSteps > 0 && (
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
        )}

        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pb-4">
        <div className={`mx-auto px-4 md:px-8 transition-all duration-300 ${computerVisible ? "max-w-none lg:px-12" : "max-w-3xl"}`}>
        <div className="input-main rounded-2xl overflow-hidden">
          <textarea
            ref={textareaRef}
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
              <VoiceMicButton onTranscript={(text) => setMessage((prev) => prev + text)} />
              {isStreaming ? (
                <button
                  onClick={abort}
                  className="p-2.5 rounded-xl bg-destructive text-destructive-foreground hover:opacity-90 transition-all duration-150 active:scale-95"
                >
                  <Square size={16} />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="p-2.5 rounded-xl bg-foreground text-primary-foreground disabled:opacity-20 hover:opacity-90 transition-all duration-150 active:scale-95"
                >
                  <ArrowUp size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
      {/* Document preview modal */}
      {previewMsg && (
        <DocumentPreview
          open={!!previewMsg}
          onClose={() => setPreviewMsg(null)}
          title={previewMsg.reportTitle || ""}
          summary={previewMsg.reportSummary || ""}
          tableData={previewMsg.tableData}
        />
      )}
      {/* Voice Agent Overlay */}
      <VoiceAgentOverlay
        open={voiceAgentOpen}
        onClose={() => setVoiceAgentOpen(false)}
        onTranscript={(text) => {
          onSendMessage?.(text);
          sendAI(text);
        }}
        aiResponse={voiceAiResponse}
      />
    </div>
  );
}
