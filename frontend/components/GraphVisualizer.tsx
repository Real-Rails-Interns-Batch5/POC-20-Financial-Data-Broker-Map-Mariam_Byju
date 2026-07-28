"use client";

import { useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
  Handle,
  Position
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";

// 1. Custom Node Design
const CustomNode = ({ data }: any) => {
  return (
    <div 
      className="rounded-md p-3 w-[260px] relative cursor-pointer hover:shadow-[0_0_15px_rgba(56,189,248,0.2)] transition-shadow"
      style={{
        background: "#0B1117",
        border: data.risk_level === "critical" ? "1px solid #ef4444" : "1px solid #1F2937",
      }}
    >
      <Handle type="target" position={Position.Left} className="w-1.5 h-1.5 !bg-gray-500 !border-gray-800" />
      <div className="flex flex-col text-left">
        <span className="font-semibold text-sm text-gray-100">{data.label}</span>
        <span className="text-[10px] text-gray-400 mt-1">{data.category}</span>
        <span className={`text-[9px] mt-2 tracking-widest uppercase px-2 py-0.5 rounded-sm inline-block w-max ${
          data.risk_level === "critical" ? "bg-red-500/20 text-red-400 border border-red-500/50" : 
          data.risk_level === "high" ? "bg-orange-500/20 text-orange-400 border border-orange-500/50" : 
          "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
        }`}>
          {data.risk_level} RISK
        </span>
      </div>
      <Handle type="source" position={Position.Right} className="w-1.5 h-1.5 !bg-gray-500 !border-gray-800" />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: any[], edges: any[], direction = "LR") => {
  dagreGraph.setGraph({ rankdir: direction });
  nodes.forEach((node) => dagreGraph.setNode(node.id, { width: 260, height: 80 }));
  edges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target));
  dagre.layout(dagreGraph);
  
  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return { ...node, position: { x: nodeWithPosition.x - 130, y: nodeWithPosition.y - 40 } };
    }),
    edges
  };
};

interface GraphVisualizerProps {
  initialData: {
    nodes: any[];
    edges: any[];
  };
  onNodeSelect?: (nodeData: any) => void;
}

export default function GraphVisualizer({ initialData, onNodeSelect }: GraphVisualizerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  useEffect(() => {
    if (!initialData?.nodes || !initialData?.edges) return;

    try {
      const formattedNodes = initialData.nodes.map((n: any) => ({
        id: n.id,
        type: "custom",
        data: {
          id: n.id, // FIXED: The ID is now passed so page.tsx can read activeNode.id
          label: n.label,
          category: n.category || n.type || "Entity",
          risk_level: n.risk_level,
          compliance_score: n.compliance_score, 
          data_types_held: n.data_types_held
        }
      }));

      const formattedEdges = initialData.edges.map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.protocol || e.label,
        labelStyle: { fill: "#9CA3AF", fontSize: 10, fontWeight: 600 },
        labelBgStyle: { fill: "#030712" },
        animated: e.status === "active",
        style: { stroke: e.status === "flagged" ? "#ef4444" : "#38BDF8", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: e.status === "flagged" ? "#ef4444" : "#38BDF8" },
      }));

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(formattedNodes, formattedEdges);
      setNodes(layoutedNodes as any);
      setEdges(layoutedEdges as any);
    } catch (err) {
      console.error("Failed to process graph data", err);
    }
  }, [initialData, setNodes, setEdges]);

  return (
    <div className="w-full h-full bg-[#030712]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node: any) => {
          if (onNodeSelect) onNodeSelect(node.data);
        }}
        fitView
        colorMode="dark"
        minZoom={0.2}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#1F2937" />
        <Controls className="bg-gray-900 border-gray-800 fill-gray-300" />
      </ReactFlow>
    </div>
  );
}