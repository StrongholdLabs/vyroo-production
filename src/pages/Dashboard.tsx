import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ChatPanel } from "@/components/ChatPanel";
import { ComputerPanel } from "@/components/ComputerPanel";
import { ComputerThumbnail } from "@/components/ComputerThumbnail";
import { useConversation, useConversations, useSendMessage } from "@/hooks/useConversations";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { useRealtimeConversations } from "@/hooks/useRealtimeConversations";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Menu, Loader2 } from "lucide-react";

const Dashboard = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeConversation, setActiveConversation] = useState(conversationId || "");
  const [computerVisible, setComputerVisible] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileComputerOpen, setMobileComputerOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: conversation, isLoading, isError } = useConversation(activeConversation);
  const sendMessage = useSendMessage();

  // Real-time subscriptions for multi-tab sync
  useRealtimeMessages(activeConversation);
  useRealtimeConversations();

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
    navigate(`/dashboard/${id}`, { replace: true });
    if (isMobile) setMobileSidebarOpen(false);
  };

  const handleSendMessage = (msg: string) => {
    if (!conversation) return;
    sendMessage.mutate({ conversationId: activeConversation, content: msg });
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
          /* Empty state — no conversation selected */
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="text-center space-y-4 max-w-md">
              <h2 className="text-2xl font-display text-foreground">Start a conversation</h2>
              <p className="text-sm text-muted-foreground">
                Select a conversation from the sidebar or start a new one.
              </p>
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                New task
              </button>
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
                    computerView={conversation.computerView}
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
