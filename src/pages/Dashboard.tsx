import { useState, useEffect, useRef, useCallback } from "react";
import type { ComputerViewState } from "@/data/conversations";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ChatPanel } from "@/components/ChatPanel";
import { ComputerPanel } from "@/components/ComputerPanel";
import { ComputerThumbnail } from "@/components/ComputerThumbnail";
import { TaskInput } from "@/components/TaskInput";
import { ActionChips } from "@/components/ActionChips";
import { useConversation, useConversations, useSendMessage } from "@/hooks/useConversations";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { useRealtimeConversations } from "@/hooks/useRealtimeConversations";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Menu, Loader2, Monitor, Plus, Search, BarChart, Code, FileText } from "lucide-react";

const Dashboard = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeConversation, setActiveConversation] = useState(conversationId || "");
  const [computerVisible, setComputerVisible] = useState(false);
  const [computerViews, setComputerViews] = useState<Record<string, ComputerViewState>>({});
  const liveComputerView = activeConversation ? computerViews[activeConversation] : undefined;

  // Callback for ChatPanel to update computer view — stored per-conversation
  const handleComputerViewUpdate = useCallback((view: ComputerViewState) => {
    if (activeConversation) {
      setComputerViews(prev => ({ ...prev, [activeConversation]: view }));
    }
  }, [activeConversation]);

  // Sync activeConversation with URL params
  useEffect(() => {
    setActiveConversation(conversationId || "");
    if (!conversationId) setComputerVisible(false);
  }, [conversationId]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileComputerOpen, setMobileComputerOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const isMobile = useIsMobile();
  // initialMessageHandled ref removed — was blocking subsequent new tasks

  // Fetch all conversations to auto-select first when none specified
  const { data: conversations } = useConversations();

  const conversationQuery = useConversation(activeConversation || undefined);
  // When activeConversation is cleared (New task), don't show stale cached data
  // If conversation is loading but we have an ID, provide a stub so ChatPanel renders immediately
  const conversationStub = activeConversation ? {
    id: activeConversation, title: "New task", type: "intelligence" as const,
    icon: "💬", steps: [], messages: [], followUps: [], codeLines: [],
    fileName: "", editorLabel: "Editor",
  } : undefined;
  const conversation = activeConversation ? (conversationQuery.data || conversationStub) : undefined;
  const isLoading = activeConversation ? conversationQuery.isLoading : false;
  const isError = activeConversation ? conversationQuery.isError : false;
  const _sendMessage = useSendMessage(); // kept for future use

  // No auto-select — /dashboard shows the empty "new task" composer.
  // Users pick conversations from the sidebar.

  // Pick up initial message from TaskInput navigation
  useEffect(() => {
    const state = location.state as { initialMessage?: string } | null;
    if (state?.initialMessage) {
      setPendingMessage(state.initialMessage);
      // Clear state so refresh doesn't re-send
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  // Real-time subscriptions for multi-tab sync
  useRealtimeMessages(activeConversation);
  useRealtimeConversations();

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
    navigate(id ? `/dashboard/${id}` : "/dashboard", { replace: true });
    if (isMobile) setMobileSidebarOpen(false);
  };

  const handleSendMessage = (_msg: string) => {
    // Message insertion is handled by the chat edge function — no need to insert here
    // This callback is kept for side effects (e.g., triggering conversation refresh)
  };

  const handleOpenComputer = () => {
    if (isMobile) {
      setMobileComputerOpen(true);
    } else {
      setComputerVisible(true);
    }
  };

  const handleCloseComputer = () => {
    if (isMobile) {
      setMobileComputerOpen(false);
    } else {
      setComputerVisible(false);
    }
  };

  // Loading state (only when we have an ID and are actually fetching)
  if (activeConversation && isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading conversation...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (activeConversation && isError) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <p className="text-sm text-destructive">Failed to load conversation</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Mobile sidebar trigger */}
      {isMobile && (
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="fixed top-3 left-3 z-50 p-2 rounded-lg bg-card border border-border text-foreground hover:bg-accent transition-colors active:scale-95"
        >
          <Menu size={18} />
        </button>
      )}

      {/* Mobile sidebar as sheet */}
      {isMobile && (
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="p-0 w-72 border-r-0" style={{ backgroundColor: "hsl(var(--sidebar-background))" }}>
            <DashboardSidebar
              collapsed={false}
              onToggle={() => setMobileSidebarOpen(false)}
              activeId={activeConversation}
              onSelect={handleSelectConversation}
            />
          </SheetContent>
        </Sheet>
      )}

      {!isMobile ? (
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Resizable Sidebar */}
          {!sidebarCollapsed && (
            <>
              <ResizablePanel
                defaultSize={18}
                minSize={14}
                maxSize={28}
                className="min-w-0"
              >
                <DashboardSidebar
                  collapsed={false}
                  onToggle={() => setSidebarCollapsed(true)}
                  activeId={activeConversation}
                  onSelect={handleSelectConversation}
                />
              </ResizablePanel>
              <ResizableHandle className="w-px bg-border hover:bg-primary/30 transition-colors data-[resize-handle-active]:bg-primary/50" />
            </>
          )}

          {/* Collapsed mini sidebar (not in resizable flow) */}
          {sidebarCollapsed && (
            <div className="flex-shrink-0">
              <DashboardSidebar
                collapsed={true}
                onToggle={() => setSidebarCollapsed(false)}
                activeId={activeConversation}
                onSelect={handleSelectConversation}
              />
            </div>
          )}

          {/* Main content area */}
          <ResizablePanel defaultSize={!conversation || !computerVisible ? 82 : 45} minSize={30}>
            {!conversation ? (
              <div className="flex-1 flex flex-col items-center justify-center px-4 pb-24 h-full">
                <div className="flex flex-col items-center gap-5 w-full max-w-2xl">
                  <h2 className="font-display text-3xl md:text-4xl text-foreground tracking-tight text-center">
                    What can I help you with?
                  </h2>
                  <div className="w-full">
                    <TaskInput />
                  </div>
                  <ActionChips />
                  {/* Feature cards — onboarding hints for new users */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-4">
                    {[
                      { icon: <Search size={16} />, color: "text-blue-400", title: "Research & Analysis", desc: "Deep research with real-time data and cited reports", example: "Top 5 DTC brands in 2026" },
                      { icon: <BarChart size={16} />, color: "text-orange-400", title: "Presentations", desc: "Data-driven slide decks. Download as PPTX.", example: "Create a pitch deck about AI trends" },
                      { icon: <Code size={16} />, color: "text-green-400", title: "Code & Data", desc: "Generate, review, and execute code.", example: "Build a React auth component" },
                      { icon: <FileText size={16} />, color: "text-purple-400", title: "Reports & Writing", desc: "Professional reports with tables and sources.", example: "Write a market analysis report" },
                    ].map((card) => (
                      <button
                        key={card.title}
                        onClick={() => {
                          const textarea = document.querySelector('textarea');
                          if (textarea) {
                            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
                            nativeInputValueSetter?.call(textarea, card.example);
                            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                            textarea.focus();
                          }
                        }}
                        className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border/50 hover:border-border hover:bg-accent/30 transition-all text-left group"
                      >
                        <div className={`w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 ${card.color}`}>
                          {card.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{card.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full min-w-0">
                <ChatPanel
                  conversation={conversation}
                  computerVisible={computerVisible}
                  onOpenComputer={handleOpenComputer}
                  onSendMessage={handleSendMessage}
                  onComputerViewUpdate={handleComputerViewUpdate}
                  initialMessage={pendingMessage}
                  onInitialMessageSent={() => setPendingMessage(null)}
                />
              </div>
            )}
          </ResizablePanel>

          {/* Computer panel */}
          {conversation && computerVisible && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={37} minSize={25} maxSize={55}>
                <ComputerPanel
                  visible={true}
                  onClose={handleCloseComputer}
                  codeLines={conversation.codeLines}
                  steps={conversation.steps}
                  fileName={conversation.fileName}
                  editorLabel={conversation.editorLabel}
                  fileTree={conversation.fileTree}
                  computerView={liveComputerView || conversation.computerView}
                  researchTasks={conversation.researchTasks}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      ) : (
        /* Mobile layout */
        <main className="flex-1 flex overflow-hidden relative">
          {!conversation ? (
            <div className="flex-1 flex flex-col items-center justify-center px-4 pb-24">
              <div className="flex flex-col items-center gap-5 w-full max-w-2xl">
                <h2 className="font-display text-3xl text-foreground tracking-tight text-center">
                  What can I help you with?
                </h2>
                <div className="w-full">
                  <TaskInput />
                </div>
                <ActionChips />
                {/* Feature cards — mobile */}
                <div className="grid grid-cols-1 gap-2 w-full mt-2">
                  {[
                    { icon: <Search size={14} />, color: "text-blue-400", title: "Research", example: "Top 5 DTC brands in 2026" },
                    { icon: <BarChart size={14} />, color: "text-orange-400", title: "Presentations", example: "Create a pitch deck about AI trends" },
                    { icon: <Code size={14} />, color: "text-green-400", title: "Code", example: "Build a React auth component" },
                    { icon: <FileText size={14} />, color: "text-purple-400", title: "Reports", example: "Write a market analysis report" },
                  ].map((card) => (
                    <button key={card.title} onClick={() => {
                      const ta = document.querySelector('textarea');
                      if (ta) { const s = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set; s?.call(ta, card.example); ta.dispatchEvent(new Event('input', { bubbles: true })); ta.focus(); }
                    }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/50 hover:bg-accent/30 transition-all text-left">
                      <span className={`${card.color} flex-shrink-0`}>{card.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{card.title}</p>
                        <p className="text-[11px] text-muted-foreground">{card.example}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-w-0">
              <ChatPanel
                conversation={conversation || {
                  id: activeConversation, title: "New task", type: "intelligence" as const,
                  icon: "💬", steps: [], messages: [], followUps: [], codeLines: [],
                  fileName: "", editorLabel: "Editor",
                }}
                computerVisible={false}
                onOpenComputer={handleOpenComputer}
                onSendMessage={handleSendMessage}
                initialMessage={pendingMessage}
                onInitialMessageSent={() => setPendingMessage(null)}
              />
            </div>
          )}

          {/* Mobile computer panel as bottom drawer */}
          {conversation && (
            <Drawer open={mobileComputerOpen} onOpenChange={setMobileComputerOpen}>
              <DrawerContent className="h-[85vh] p-0 border-t border-border rounded-t-2xl" style={{ backgroundColor: "hsl(var(--computer-bg))" }}>
                <ComputerPanel
                  visible={true}
                  onClose={() => setMobileComputerOpen(false)}
                  codeLines={conversation.codeLines}
                  steps={conversation.steps}
                  fileName={conversation.fileName}
                  editorLabel={conversation.editorLabel}
                  fileTree={conversation.fileTree}
                  computerView={conversation.computerView}
                  researchTasks={conversation.researchTasks}
                />
              </DrawerContent>
            </Drawer>
          )}

          {/* Mobile FAB — New Task button (only when viewing a conversation) */}
          {conversation && (
            <button
              onClick={() => { setActiveConversation(""); navigate("/dashboard"); }}
              className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all z-30"
              aria-label="New task"
            >
              <Plus size={24} />
            </button>
          )}
        </main>
      )}
    </div>
  );
};

export default Dashboard;
