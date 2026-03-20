import { useState } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { ChatPanel } from "@/components/ChatPanel";
import { ComputerPanel } from "@/components/ComputerPanel";

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeConversation, setActiveConversation] = useState("1");
  const [computerVisible, setComputerVisible] = useState(true);

  return (
    <div className="h-screen flex overflow-hidden">
      <DashboardSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeId={activeConversation}
        onSelect={setActiveConversation}
      />

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <ChatPanel />
        </div>

        <ComputerPanel
          visible={computerVisible}
          onClose={() => setComputerVisible(false)}
        />
      </main>
    </div>
  );
};

export default Dashboard;
