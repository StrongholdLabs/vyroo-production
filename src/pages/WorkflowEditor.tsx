import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useAgentTemplates } from "@/hooks/useAgentTemplates";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWorkflow, useSaveWorkflow } from "@/hooks/useWorkflows";
import { useRealtimeWorkflow, useWorkflowPresence } from "@/hooks/useRealtimeWorkflow";
import { WorkflowCanvas } from "@/components/agents/workflow/WorkflowCanvas";
import { WorkflowToolbar } from "@/components/agents/workflow/WorkflowToolbar";
import { WorkflowSidebar } from "@/components/agents/workflow/WorkflowSidebar";
import { CollaboratorAvatars } from "@/components/agents/workflow/CollaboratorAvatars";
import type { Workflow, WorkflowNode, WorkflowEdge } from "@/types/workflows";

// ─── Default new workflow ───

function createNewWorkflow(): Workflow {
  return {
    id: `wf-${Date.now()}`,
    user_id: "demo",
    name: "Untitled Workflow",
    description: "A new multi-agent workflow",
    nodes: [],
    edges: [],
    status: "draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ─── Component ───

const WorkflowEditor = () => {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: templates = [] } = useAgentTemplates();

  // Persistence hooks
  const isNewWorkflow = !workflowId || workflowId === "new";
  const { data: loadedWorkflow, isLoading: isLoadingWorkflow } = useWorkflow(
    isNewWorkflow ? undefined : workflowId,
  );
  const saveMutation = useSaveWorkflow();

  // Workflow state
  const [workflow, setWorkflow] = useState<Workflow>(createNewWorkflow);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [runStep, setRunStep] = useState(0);
  const [saveNotice, setSaveNotice] = useState<"saved" | "saving" | null>(null);
  const [hasInitialized, setHasInitialized] = useState(isNewWorkflow);

  // Auto-save debounce ref
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  // Realtime collaboration
  const handleRemoteUpdate = useCallback(
    (update: { name?: string; nodes?: WorkflowNode[]; edges?: WorkflowEdge[] }) => {
      setWorkflow((prev) => ({
        ...prev,
        ...(update.name !== undefined ? { name: update.name } : {}),
        ...(update.nodes !== undefined ? { nodes: update.nodes } : {}),
        ...(update.edges !== undefined ? { edges: update.edges } : {}),
        updated_at: new Date().toISOString(),
      }));
    },
    [],
  );

  const { broadcastUpdate } = useRealtimeWorkflow(
    isNewWorkflow ? undefined : workflowId,
    handleRemoteUpdate,
  );
  const { users: collaborators } = useWorkflowPresence(
    isNewWorkflow ? undefined : workflowId,
  );

  // Load workflow from Supabase when data arrives
  useEffect(() => {
    if (loadedWorkflow && !hasInitialized) {
      setWorkflow(loadedWorkflow);
      lastSavedRef.current = JSON.stringify({
        name: loadedWorkflow.name,
        nodes: loadedWorkflow.nodes,
        edges: loadedWorkflow.edges,
      });
      setHasInitialized(true);
    }
  }, [loadedWorkflow, hasInitialized]);

  // Hide sidebar on mobile
  useEffect(() => {
    if (isMobile) setShowSidebar(false);
  }, [isMobile]);

  // ─── Save logic ───

  const doSave = useCallback(async () => {
    const persistableStatus =
      workflow.status === "running" || workflow.status === "completed" || workflow.status === "failed"
        ? "draft"
        : workflow.status;

    setSaveNotice("saving");
    try {
      const result = await saveMutation.mutateAsync({
        id: isNewWorkflow ? undefined : workflowId,
        name: workflow.name,
        description: workflow.description,
        nodes: workflow.nodes,
        edges: workflow.edges,
        status: persistableStatus,
      });

      lastSavedRef.current = JSON.stringify({
        name: workflow.name,
        nodes: workflow.nodes,
        edges: workflow.edges,
      });

      setSaveNotice("saved");
      setTimeout(() => setSaveNotice(null), 2000);

      // If this was a new workflow, navigate to its persisted ID
      if (isNewWorkflow && result?.id) {
        navigate(`/agents/workflow/${result.id}`, { replace: true });
      }
    } catch {
      setSaveNotice(null);
    }
  }, [workflow, isNewWorkflow, workflowId, saveMutation, navigate]);

  // Auto-save on significant changes (debounced 2s)
  useEffect(() => {
    if (!hasInitialized || isRunning) return;

    const currentSnapshot = JSON.stringify({
      name: workflow.name,
      nodes: workflow.nodes,
      edges: workflow.edges,
    });

    // Skip if nothing changed
    if (currentSnapshot === lastSavedRef.current) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      doSave();
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [workflow.name, workflow.nodes, workflow.edges, hasInitialized, isRunning, doSave]);

  // ─── Workflow name ───

  const handleNameChange = useCallback((name: string) => {
    setWorkflow((prev) => ({ ...prev, name, updated_at: new Date().toISOString() }));
    broadcastUpdate({ name });
  }, [broadcastUpdate]);

  // ─── Node operations ───

  const handleNodeSelect = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    if (nodeId && !showSidebar && !isMobile) {
      setShowSidebar(true);
    }
  }, [showSidebar, isMobile]);

  const handleNodeMove = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setWorkflow((prev) => {
      const nodes = prev.nodes.map((n) => (n.id === nodeId ? { ...n, position } : n));
      broadcastUpdate({ nodes });
      return { ...prev, nodes, updated_at: new Date().toISOString() };
    });
  }, [broadcastUpdate]);

  const handleAddAgent = useCallback((templateId: string) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      agent_template_id: templateId,
      position: {
        x: 100 + workflow.nodes.length * 320,
        y: 200,
      },
      config: {},
      status: "idle",
    };
    setWorkflow((prev) => {
      const nodes = [...prev.nodes, newNode];
      broadcastUpdate({ nodes });
      return { ...prev, nodes, updated_at: new Date().toISOString() };
    });
  }, [workflow.nodes.length, broadcastUpdate]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setWorkflow((prev) => {
      const nodes = prev.nodes.filter((n) => n.id !== nodeId);
      const edges = prev.edges.filter((e) => e.source_node_id !== nodeId && e.target_node_id !== nodeId);
      broadcastUpdate({ nodes, edges });
      return { ...prev, nodes, edges, updated_at: new Date().toISOString() };
    });
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId, broadcastUpdate]);

  const handleDuplicateNode = useCallback((nodeId: string) => {
    const original = workflow.nodes.find((n) => n.id === nodeId);
    if (!original) return;
    const newNode: WorkflowNode = {
      ...original,
      id: `node-${Date.now()}`,
      position: { x: original.position.x + 40, y: original.position.y + 40 },
      status: "idle",
      run_id: undefined,
    };
    setWorkflow((prev) => {
      const nodes = [...prev.nodes, newNode];
      broadcastUpdate({ nodes });
      return { ...prev, nodes, updated_at: new Date().toISOString() };
    });
  }, [workflow.nodes, broadcastUpdate]);

  const handleNodeConfigure = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    if (!showSidebar) setShowSidebar(true);
  }, [showSidebar]);

  const handleNodeConfigChange = useCallback((nodeId: string, config: WorkflowNode["config"]) => {
    setWorkflow((prev) => {
      const nodes = prev.nodes.map((n) => (n.id === nodeId ? { ...n, config } : n));
      broadcastUpdate({ nodes });
      return { ...prev, nodes, updated_at: new Date().toISOString() };
    });
  }, [broadcastUpdate]);

  // ─── Edge operations ───

  const handleEdgeCreate = useCallback((sourceNodeId: string, targetNodeId: string) => {
    // Don't allow duplicate edges
    const exists = workflow.edges.some(
      (e) => e.source_node_id === sourceNodeId && e.target_node_id === targetNodeId,
    );
    if (exists) return;

    const newEdge: WorkflowEdge = {
      id: `edge-${Date.now()}`,
      source_node_id: sourceNodeId,
      target_node_id: targetNodeId,
      condition: "on_success",
    };
    setWorkflow((prev) => {
      const edges = [...prev.edges, newEdge];
      broadcastUpdate({ edges });
      return { ...prev, edges, updated_at: new Date().toISOString() };
    });
  }, [workflow.edges, broadcastUpdate]);

  // ─── Zoom ───

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(1.5, z + 0.1));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.5, z - 0.1));
  }, []);

  const handleFitView = useCallback(() => {
    setZoom(1);
  }, []);

  // ─── Auto-layout ───

  const handleAutoLayout = useCallback(() => {
    setWorkflow((prev) => {
      const sorted = [...prev.nodes];
      // Simple left-to-right layout
      const updated = sorted.map((node, index) => ({
        ...node,
        position: { x: 100 + index * 320, y: 200 },
      }));
      return { ...prev, nodes: updated, updated_at: new Date().toISOString() };
    });
  }, []);

  // ─── Run simulation ───

  const handleRun = useCallback(() => {
    if (workflow.nodes.length === 0) return;
    setIsRunning(true);
    setRunStep(0);
    setWorkflow((prev) => ({
      ...prev,
      status: "running",
      nodes: prev.nodes.map((n) => ({ ...n, status: "idle" as const })),
    }));

    // Simulate sequential execution
    let step = 0;
    const nodeIds = workflow.nodes.map((n) => n.id);

    const runNext = () => {
      if (step >= nodeIds.length) {
        // All done
        setIsRunning(false);
        setWorkflow((prev) => ({ ...prev, status: "completed" }));
        return;
      }

      const currentId = nodeIds[step];
      setRunStep(step + 1);

      // Set current node to running
      setWorkflow((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === currentId ? { ...n, status: "running" as const } : n,
        ),
      }));

      // Complete after delay
      setTimeout(() => {
        setWorkflow((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) =>
            n.id === currentId ? { ...n, status: "completed" as const } : n,
          ),
        }));
        step++;
        runNext();
      }, 2500);
    };

    runNext();
  }, [workflow.nodes]);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    setRunStep(0);
    setWorkflow((prev) => ({
      ...prev,
      status: "draft",
      nodes: prev.nodes.map((n) => ({ ...n, status: "idle" as const })),
    }));
  }, []);

  const handleSave = useCallback(() => {
    doSave();
  }, [doSave]);

  // Loading state while fetching existing workflow
  if (!isNewWorkflow && isLoadingWorkflow && !hasInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading workflow...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Back + Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
        <button
          onClick={() => navigate("/agents")}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          <ArrowLeft size={16} />
        </button>

        {/* Collaborators + Save status */}
        <div className="flex items-center gap-3 ml-auto">
          <CollaboratorAvatars users={collaborators} />

          {saveNotice && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
              {saveNotice === "saving" ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={12} className="text-[hsl(var(--success))]" />
                  <span className="text-[hsl(var(--success))]">Saved</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <WorkflowToolbar
        workflowName={workflow.name}
        onNameChange={handleNameChange}
        agents={templates}
        onAddAgent={handleAddAgent}
        onAutoLayout={handleAutoLayout}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        isRunning={isRunning}
        runProgress={isRunning ? `Step ${runStep}/${workflow.nodes.length}` : undefined}
        onRun={handleRun}
        onStop={handleStop}
        onSave={handleSave}
        onSettings={() => {
          setSelectedNodeId(null);
          setShowSidebar(!showSidebar);
        }}
      />

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        <WorkflowCanvas
          workflow={workflow}
          templates={templates}
          selectedNodeId={selectedNodeId}
          onNodeSelect={handleNodeSelect}
          onNodeMove={handleNodeMove}
          onEdgeCreate={handleEdgeCreate}
          onNodeDelete={handleDeleteNode}
          onNodeConfigure={handleNodeConfigure}
          onNodeDuplicate={handleDuplicateNode}
          isRunning={isRunning}
          zoom={zoom}
          onZoomChange={setZoom}
        />

        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && !isMobile && (
            <WorkflowSidebar
              workflow={workflow}
              selectedNodeId={selectedNodeId}
              templates={templates}
              onClose={() => setShowSidebar(false)}
              onDeleteNode={handleDeleteNode}
              onNodeConfigChange={handleNodeConfigChange}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WorkflowEditor;
