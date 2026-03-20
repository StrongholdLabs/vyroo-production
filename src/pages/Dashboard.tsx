import { useState } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { TaskExecution } from "@/components/TaskExecution";

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeConversation, setActiveConversation] = useState("1");

  return (
    <div className="h-screen flex overflow-hidden">
      <DashboardSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeId={activeConversation}
        onSelect={setActiveConversation}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <TaskExecution />
      </main>
    </div>
  );
};

export default Dashboard;
