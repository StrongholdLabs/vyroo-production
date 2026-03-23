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
import { Menu, Loader2, Monitor } from "lucide-react";

const Dashboard = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeConversation, setActiveConversation] = useState(conversationId || "");
  const [computerVisible, setComputerVisible] = useState(false);
  const [liveComputerView, setLiveComputerView] = useState<ComputerViewState | undefined>();

  // Callback for ChatPanel to update computer view with live tool data
  const handleComputerViewUpdate = useCallback((view: ComputerViewState) => {
    setLiveComputerView(view);
  }, []);

  // Sync activeConversation with URL params
  useEffect(() => {
    setActiveConversation(conversationId || "");
    if (!conversationId) setComputerVisible(false);
  }, [conversationId]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileComputerOpen, setMobileComputerOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const initialMessageHandled = useRef(false);

  // Fetch all conversations to auto-select first when none specified
  const { data: conversations } = useConversations();

  const conversationQuery = useConversation(activeConversation || undefined);
  // When activeConversation is cleared (New task), don't show stale cached data
  const conversation = activeConversation ? conversationQuery.data : undefined;
  const isLoading = activeConversation ? conversationQuery.isLoading : false;
  const isError = activeConversation ? conversationQuery.isError : false;
  const _sendMessage = useSendMessage(); // kept for future use

  // No auto-select — /dashboard shows the empty "new task" composer.
  // Users pick conversations from the sidebar.

  // Pick up initial message from TaskInput navigation
  useEffect(() => {
    const state = location.state as { initialMessage?: string } | null;
    if (state?.initialMessage && !initialMessageHandled.current) {
      initialMessageHandled.current = true;
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

      {/* Desktop sidebar */}
      {!isMobile && (
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeId={activeConversation}
          onSelect={handleSelectConversation}
        />
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

      <main className="flex-1 flex overflow-hidden relative">
        {!conversation ? (
          /* Empty state — composer like landing page */
          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-24">
            <div className="flex flex-col items-center gap-5 w-full max-w-2xl">
              <h2 className="font-display text-3xl md:text-4xl text-foreground tracking-tight text-center">
                What can I help you with?
              </h2>
              <div className="w-full">
                <TaskInput />
              </div>
              <ActionChips />

              {/* Computer panel hint */}
              <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg bg-secondary/30 border border-border/30">
                <Monitor size={14} className="text-muted-foreground flex-shrink-0" />
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground/70">Computer Panel</span> — code editor, browser, terminal & research timeline appear alongside your chat when needed.
                </p>
              </div>
            </div>
          </div>
        ) : !isMobile ? (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={computerVisible ? 55 : 100} minSize={30}>
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
            </ResizablePanel>

            {computerVisible && (
              <>
                <ResizableHandle />
                <ResizablePanel defaultSize={45} minSize={25} maxSize={65}>
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
          <div className="flex-1 flex flex-col min-w-0">
            <ChatPanel
              conversation={conversation}
              computerVisible={false}
              onOpenComputer={handleOpenComputer}
              onSendMessage={handleSendMessage}
            />
          </div>
        )}

        {/* Mobile computer panel as bottom drawer */}
        {isMobile && conversation && (
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
      </main>
    </div>
  );
};

export default Dashboard;
