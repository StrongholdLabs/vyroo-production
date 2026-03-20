import { useState } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { ChatPanel } from "@/components/ChatPanel";
import { ComputerPanel } from "@/components/ComputerPanel";
import { ComputerThumbnail } from "@/components/ComputerThumbnail";
import { getConversation } from "@/data/conversations";

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeConversation, setActiveConversation] = useState("1");
  const [computerVisible, setComputerVisible] = useState(true);

  const conversation = getConversation(activeConversation);

  return (
    <div className="h-screen flex overflow-hidden">
      <DashboardSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeId={activeConversation}
        onSelect={setActiveConversation}
      />

      <main className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col min-w-0">
          <ChatPanel
            conversation={conversation}
            computerVisible={computerVisible}
            onOpenComputer={() => setComputerVisible(true)}
          />
        </div>

        <ComputerPanel
          visible={computerVisible}
          onClose={() => setComputerVisible(false)}
          codeLines={conversation.codeLines}
          steps={conversation.steps}
          fileName={conversation.fileName}
          editorLabel={conversation.editorLabel}
        />
      </main>
    </div>
  );
};

export default Dashboard;
