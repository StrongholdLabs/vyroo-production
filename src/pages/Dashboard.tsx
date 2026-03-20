import { useState } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { ChatPanel } from "@/components/ChatPanel";
import { ComputerPanel } from "@/components/ComputerPanel";
import { ComputerThumbnail } from "@/components/ComputerThumbnail";
import { getConversation } from "@/data/conversations";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Menu, GripVertical } from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeConversation, setActiveConversation] = useState("1");
  const [computerVisible, setComputerVisible] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileComputerOpen, setMobileComputerOpen] = useState(false);
  const isMobile = useIsMobile();

  const conversation = getConversation(activeConversation);

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
    if (isMobile) setMobileSidebarOpen(false);
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
          onSelect={setActiveConversation}
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
        {!isMobile ? (
          <PanelGroup direction="horizontal" autoSaveId="vyroo-layout">
            <Panel defaultSize={computerVisible ? 55 : 100} minSize={30}>
              <div className="flex flex-col h-full min-w-0">
                <ChatPanel
                  conversation={conversation}
                  computerVisible={computerVisible}
                  onOpenComputer={handleOpenComputer}
                />
              </div>
            </Panel>
            {computerVisible && (
              <>
                <PanelResizeHandle className="w-1.5 relative group flex items-center justify-center hover:bg-accent/50 transition-colors data-[resize-handle-active]:bg-accent">
                  <div className="absolute w-px h-full bg-border group-hover:bg-muted-foreground/30 transition-colors" />
                  <GripVertical size={12} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors z-10" />
                </PanelResizeHandle>
                <Panel defaultSize={45} minSize={25} maxSize={70}>
                  <ComputerPanel
                    visible={true}
                    onClose={handleCloseComputer}
                    codeLines={conversation.codeLines}
                    steps={conversation.steps}
                    fileName={conversation.fileName}
                    editorLabel={conversation.editorLabel}
                    fileTree={conversation.fileTree}
                  />
                </Panel>
              </>
            )}
          </PanelGroup>
        ) : (
          <div className="flex-1 flex flex-col min-w-0">
            <ChatPanel
              conversation={conversation}
              computerVisible={false}
              onOpenComputer={handleOpenComputer}
            />
          </div>
        )}

        {/* Mobile computer panel as bottom drawer */}
        {isMobile && (
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
              />
            </DrawerContent>
          </Drawer>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
