import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { WorkflowNodeComponent } from "./WorkflowNode";
import type { Workflow, WorkflowNode, WorkflowEdge } from "@/types/workflows";
import type { AgentTemplate } from "@/types/agents";

// ─── Edge SVG rendering ───

function getNodeCenter(node: WorkflowNode, side: "left" | "right"): { x: number; y: number } {
  const nodeWidth = 220;
  const nodeHeight = 80; // approximate
  return {
    x: side === "left" ? node.position.x : node.position.x + nodeWidth,
    y: node.position.y + nodeHeight / 2,
  };
}

function edgePath(source: { x: number; y: number }, target: { x: number; y: number }): string {
  const dx = Math.abs(target.x - source.x);
  const controlOffset = Math.max(dx * 0.5, 60);
  return `M ${source.x} ${source.y} C ${source.x + controlOffset} ${source.y}, ${target.x - controlOffset} ${target.y}, ${target.x} ${target.y}`;
}

function edgeColor(
  edge: WorkflowEdge,
  nodes: WorkflowNode[],
): { stroke: string; animated: boolean } {
  const sourceNode = nodes.find((n) => n.id === edge.source_node_id);
  const targetNode = nodes.find((n) => n.id === edge.target_node_id);

  if (sourceNode?.status === "failed" || targetNode?.status === "failed") {
    return { stroke: "hsl(var(--destructive))", animated: false };
  }
  if (sourceNode?.status === "running" || targetNode?.status === "running") {
    return { stroke: "hsl(var(--success))", animated: true };
  }
  if (sourceNode?.status === "completed" && targetNode?.status === "completed") {
    return { stroke: "hsl(var(--success))", animated: false };
  }
  return { stroke: "hsl(var(--border))", animated: false };
}

// ─── Edge component ───

function EdgeLine({
  edge,
  nodes,
}: {
  edge: WorkflowEdge;
  nodes: WorkflowNode[];
}) {
  const sourceNode = nodes.find((n) => n.id === edge.source_node_id);
  const targetNode = nodes.find((n) => n.id === edge.target_node_id);
  if (!sourceNode || !targetNode) return null;

  const source = getNodeCenter(sourceNode, "right");
  const target = getNodeCenter(targetNode, "left");
  const d = edgePath(source, target);
  const { stroke, animated } = edgeColor(edge, nodes);

  return (
    <g>
      {/* Wider invisible path for hover/click */}
      <path d={d} fill="none" stroke="transparent" strokeWidth={12} className="cursor-pointer" />
      {/* Visible path */}
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        className={cn(animated && "animate-pulse")}
      />
      {/* Animated dash for running */}
      {animated && (
        <path
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="6 4"
          className="animate-[dash_1.5s_linear_infinite]"
        />
      )}
      {/* Arrow head at target */}
      <circle cx={target.x} cy={target.y} r={3} fill={stroke} />
      {/* Condition label */}
      {edge.condition && (
        <text
          x={(source.x + target.x) / 2}
          y={(source.y + target.y) / 2 - 8}
          textAnchor="middle"
          className="fill-muted-foreground text-[9px] font-medium"
        >
          {edge.condition}
        </text>
      )}
    </g>
  );
}

// ─── Temp edge while dragging a connection ───

function TempEdgeLine({
  start,
  end,
}: {
  start: { x: number; y: number };
  end: { x: number; y: number };
}) {
  const d = edgePath(start, end);
  return (
    <path
      d={d}
      fill="none"
      stroke="hsl(var(--primary))"
      strokeWidth={2}
      strokeDasharray="4 4"
      strokeLinecap="round"
      opacity={0.6}
    />
  );
}

// ─── Props ───

interface WorkflowCanvasProps {
  workflow: Workflow;
  templates: AgentTemplate[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  onEdgeCreate: (sourceNodeId: string, targetNodeId: string) => void;
  onNodeDelete: (nodeId: string) => void;
  onNodeConfigure: (nodeId: string) => void;
  onNodeDuplicate: (nodeId: string) => void;
  isRunning: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

// ─── Component ───

export function WorkflowCanvas({
  workflow,
  templates,
  selectedNodeId,
  onNodeSelect,
  onNodeMove,
  onEdgeCreate,
  onNodeDelete,
  onNodeConfigure,
  onNodeDuplicate,
  isRunning,
  zoom,
  onZoomChange,
}: WorkflowCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Connection dragging
  const [connectionDrag, setConnectionDrag] = useState<{
    sourceNodeId: string;
    side: "left" | "right";
    startPoint: { x: number; y: number };
    currentPoint: { x: number; y: number };
  } | null>(null);

  // ─── Pan handlers ───

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan on left-click on the canvas (not on nodes)
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-workflow-node]")) return;

    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    onNodeSelect(null);
  }, [pan, onNodeSelect]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    if (draggingNodeId) {
      const newX = (e.clientX - dragOffset.x - pan.x) / zoom;
      const newY = (e.clientY - dragOffset.y - pan.y) / zoom;
      onNodeMove(draggingNodeId, { x: Math.round(newX), y: Math.round(newY) });
      return;
    }

    if (connectionDrag) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setConnectionDrag({
        ...connectionDrag,
        currentPoint: {
          x: (e.clientX - rect.left - pan.x) / zoom,
          y: (e.clientY - rect.top - pan.y) / zoom,
        },
      });
    }
  }, [isPanning, panStart, draggingNodeId, dragOffset, pan, zoom, onNodeMove, connectionDrag]);

  const handleCanvasMouseUp = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (draggingNodeId) {
      setDraggingNodeId(null);
    }

    if (connectionDrag) {
      // Check if we're over a node
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = (e.clientX - rect.left - pan.x) / zoom;
        const mouseY = (e.clientY - rect.top - pan.y) / zoom;

        // Find node under cursor
        const targetNode = workflow.nodes.find((n) => {
          return (
            n.id !== connectionDrag.sourceNodeId &&
            mouseX >= n.position.x &&
            mouseX <= n.position.x + 220 &&
            mouseY >= n.position.y &&
            mouseY <= n.position.y + 80
          );
        });

        if (targetNode) {
          if (connectionDrag.side === "right") {
            onEdgeCreate(connectionDrag.sourceNodeId, targetNode.id);
          } else {
            onEdgeCreate(targetNode.id, connectionDrag.sourceNodeId);
          }
        }
      }
      setConnectionDrag(null);
    }
  }, [isPanning, draggingNodeId, connectionDrag, workflow.nodes, pan, zoom, onEdgeCreate]);

  // ─── Zoom via wheel ───

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newZoom = Math.min(1.5, Math.max(0.5, zoom + delta));
    onZoomChange(newZoom);
  }, [zoom, onZoomChange]);

  // ─── Node drag handlers ───

  const handleNodeDragStart = useCallback((e: React.MouseEvent, nodeId: string) => {
    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setDraggingNodeId(nodeId);
    setDragOffset({
      x: e.clientX - (node.position.x * zoom + pan.x),
      y: e.clientY - (node.position.y * zoom + pan.y),
    });
  }, [workflow.nodes, zoom, pan]);

  // ─── Connection drag start ───

  const handleConnectionStart = useCallback((e: React.MouseEvent, nodeId: string, side: "left" | "right") => {
    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const startPoint = getNodeCenter(node, side);
    setConnectionDrag({
      sourceNodeId: nodeId,
      side,
      startPoint,
      currentPoint: startPoint,
    });
  }, [workflow.nodes]);

  // ─── Template lookup helper ───

  const getTemplate = useCallback(
    (templateId: string) => templates.find((t) => t.id === templateId),
    [templates],
  );

  // Canvas size for SVG
  const canvasSize = 4000;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex-1 h-full overflow-hidden cursor-grab select-none",
        isPanning && "cursor-grabbing",
        draggingNodeId && "cursor-grabbing",
      )}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
      onWheel={handleWheel}
      style={{
        backgroundImage:
          "radial-gradient(circle, hsl(var(--border) / 0.3) 1px, transparent 1px)",
        backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    >
      {/* Transform container */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          width: canvasSize,
          height: canvasSize,
          position: "relative",
        }}
      >
        {/* SVG overlay for edges */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={canvasSize}
          height={canvasSize}
          style={{ overflow: "visible" }}
        >
          <defs>
            <style>{`
              @keyframes dash {
                to { stroke-dashoffset: -20; }
              }
            `}</style>
          </defs>
          {/* Existing edges */}
          {workflow.edges.map((edge) => (
            <EdgeLine key={edge.id} edge={edge} nodes={workflow.nodes} />
          ))}
          {/* Temp connection edge */}
          {connectionDrag && (
            <TempEdgeLine
              start={connectionDrag.startPoint}
              end={connectionDrag.currentPoint}
            />
          )}
        </svg>

        {/* Nodes */}
        {workflow.nodes.map((node) => (
          <div key={node.id} data-workflow-node>
            <WorkflowNodeComponent
              node={node}
              template={getTemplate(node.agent_template_id)}
              isSelected={selectedNodeId === node.id}
              isDragging={draggingNodeId === node.id}
              onDragStart={handleNodeDragStart}
              onSelect={onNodeSelect}
              onDelete={onNodeDelete}
              onConfigure={onNodeConfigure}
              onDuplicate={onNodeDuplicate}
              onConnectionStart={handleConnectionStart}
            />
          </div>
        ))}
      </div>

      {/* Empty state */}
      {workflow.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-muted-foreground/40">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">Add agents to build your workflow</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Use the toolbar above to add agent nodes
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
