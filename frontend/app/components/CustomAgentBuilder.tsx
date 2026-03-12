"use client";

import React, { useCallback, useState } from "react";
import ReactFlow, {
    MiniMap, Controls, Background,
    useNodesState, useEdgesState, addEdge,
    Node, Edge, Connection, Panel
} from "reactflow";
import "reactflow/dist/style.css";
import { Plus, Play, Trash2, MousePointer2, Info, ChevronRight } from "lucide-react";

interface AgentNodeData {
    role: string;
    label: string;
    instructions: string;
    model?: "groq" | "openai" | "tavily";
}

const MODEL_OPTIONS = [
    { value: "groq", label: "Groq LLaMA", color: "#f59e0b", desc: "Fast reasoning" },
    { value: "openai", label: "GPT-4o Mini", color: "#10b981", desc: "High quality" },
    { value: "tavily", label: "Tavily Search", color: "#3b82f6", desc: "Web search + AI" },
] as const;

const makeNodeStyle = (color: string) => ({
    background: "#0f172a",
    color: "white",
    border: `1.5px solid ${color}`,
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: "600",
    minWidth: "150px",
});

const initialNodes: Node<AgentNodeData>[] = [
    {
        id: "input",
        type: "input",
        position: { x: 220, y: 60 },
        data: { role: "Input", label: "🚀 Startup Idea", instructions: "" },
        style: makeNodeStyle("#3b82f6"),
    },
    {
        id: "agent-1",
        position: { x: 220, y: 200 },
        data: { role: "Market Analyst", label: "📊 Market Analyst", instructions: "Analyze the market size, trends, and competition for the given startup idea. Be concise and data-driven.", model: "groq" },
        style: makeNodeStyle("#8b5cf6"),
    },
    {
        id: "agent-2",
        position: { x: 220, y: 340 },
        data: { role: "Strategy Advisor", label: "🎯 Strategy Advisor", instructions: "Based on the market analysis, propose a go-to-market strategy and key differentiators.", model: "groq" },
        style: makeNodeStyle("#10b981"),
    },
];

const initialEdges: Edge[] = [
    { id: "e-in-1", source: "input", target: "agent-1", animated: true, style: { stroke: "#3b82f6" } },
    { id: "e-1-2", source: "agent-1", target: "agent-2", animated: true, style: { stroke: "#8b5cf6" } },
];

const AGENT_COLORS = ["#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];
const ROLE_PRESETS = [
    { role: "Market Analyst", emoji: "📊", instructions: "Analyze the market size, trends, and competition. Be concise and data-driven." },
    { role: "Strategy Advisor", emoji: "🎯", instructions: "Propose a go-to-market strategy and key differentiators." },
    { role: "Risk Evaluator", emoji: "⚠️", instructions: "Identify the top 5 risks for this startup and how to mitigate them." },
    { role: "Revenue Modeler", emoji: "💰", instructions: "Suggest revenue streams and pricing strategies for this business." },
    { role: "Tech Architect", emoji: "🔧", instructions: "Outline the core technical stack and infrastructure needed to build this product." },
];

export default function CustomAgentBuilder({ onLaunch }: { onLaunch: (nodes: Node[], edges: Edge[]) => void }) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNode, setSelectedNode] = useState<Node<AgentNodeData> | null>(null);
    const [showPresets, setShowPresets] = useState(false);

    const onConnect = useCallback(
        (params: Edge | Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: "#6366f1" } }, eds)),
        [setEdges]
    );

    const onNodeClick = (_: React.MouseEvent, node: Node) => setSelectedNode(node as Node<AgentNodeData>);
    const onPaneClick = () => setSelectedNode(null);

    const addAgentNode = (preset?: { role: string; emoji: string; instructions: string }) => {
        const colorIdx = (nodes.length - 1) % AGENT_COLORS.length;
        const role = preset?.role || "New Agent";
        const emoji = preset?.emoji || "🤖";
        const newNode: Node<AgentNodeData> = {
            id: `agent-${Date.now()}`,
            position: { x: 100 + Math.random() * 200, y: 60 + (nodes.length) * 140 },
            data: {
                role,
                label: `${emoji} ${role}`,
                instructions: preset?.instructions || "Describe what this agent should do...",
                model: "groq" as const,
            },
            style: makeNodeStyle(AGENT_COLORS[colorIdx]),
        };
        setNodes((nds) => [...nds, newNode]);
        setShowPresets(false);
    };

    const deleteSelectedNode = () => {
        if (!selectedNode || selectedNode.id === "input") return;
        setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
        setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
        setSelectedNode(null);
    };

    const updateNodeData = (field: "role" | "instructions" | "model", value: string) => {
        if (!selectedNode) return;
        const updated = { ...selectedNode.data, [field]: value };
        if (field === "role") updated.label = `${selectedNode.data.label.split(" ")[0]} ${value}`;
        setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: updated } : n));
        setSelectedNode((prev) => prev ? { ...prev, data: updated } : null);
    };

    const canLaunch = nodes.find((n) => n.id === "input")?.data.instructions?.trim();

    return (
        <div className="flex flex-col gap-0 w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-[#060b14]">

            {/* Guided Tip */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-blue-500/5 border-b border-blue-500/10 text-xs text-blue-400">
                <Info size={13} className="shrink-0" />
                <span>
                    <b>How to use:</b> Click a node to configure it → Drag from the edge dots to connect nodes → Fill in your startup idea on the <b>Startup Idea</b> node → Hit <b>Launch</b>
                </span>
            </div>

            <div className="flex h-[580px] w-full">
                {/* CANVAS */}
                <div className="flex-1 h-full relative">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        fitView
                        fitViewOptions={{ padding: 0.3 }}
                        deleteKeyCode="Delete"
                    >
                        <Controls className="!bg-slate-900 !border-slate-700" />
                        <MiniMap
                            style={{ backgroundColor: "#0b0e14", border: "1px solid rgba(255,255,255,0.06)" }}
                            nodeColor="#6366f1"
                            maskColor="rgba(0,0,0,0.6)"
                        />
                        <Background color="#1e293b" gap={24} />

                        <Panel position="top-left" className="flex items-center gap-2 flex-wrap">
                            <div className="relative">
                                <button
                                    onClick={() => setShowPresets((v) => !v)}
                                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold border border-white/10 shadow-lg transition-all"
                                >
                                    <Plus size={14} />
                                    Add Agent
                                    <ChevronRight size={12} className={`transition-transform ${showPresets ? "rotate-90" : ""}`} />
                                </button>

                                {/* Preset Dropdown */}
                                {showPresets && (
                                    <div className="absolute top-full mt-2 left-0 w-56 bg-[#0d1424] border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden">
                                        {ROLE_PRESETS.map((p) => (
                                            <button
                                                key={p.role}
                                                onClick={() => addAgentNode(p)}
                                                className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
                                            >
                                                <span className="text-base">{p.emoji}</span>
                                                {p.role}
                                            </button>
                                        ))}
                                        <div className="border-t border-white/5" />
                                        <button
                                            onClick={() => addAgentNode()}
                                            className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-500 hover:bg-white/5 hover:text-slate-300 flex items-center gap-2 transition-colors"
                                        >
                                            🤖 Blank Agent
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => onLaunch(nodes, edges)}
                                disabled={!canLaunch}
                                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xl shadow-blue-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Play size={13} fill="white" />
                                Launch Graph
                            </button>
                        </Panel>
                    </ReactFlow>
                </div>

                {/* SIDEBAR */}
                <div className="w-72 shrink-0 border-l border-white/[0.06] bg-[#0a0f1c] flex flex-col">
                    <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MousePointer2 size={14} className="text-blue-400" />
                            <span className="text-sm font-bold text-white">
                                {selectedNode ? (selectedNode.id === "input" ? "Startup Idea" : "Agent Settings") : "Node Settings"}
                            </span>
                        </div>
                        {selectedNode && selectedNode.id !== "input" && (
                            <button onClick={deleteSelectedNode} className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10" title="Delete node">
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>

                    {selectedNode ? (
                        <div className="flex-1 overflow-y-auto p-5 space-y-5">
                            {selectedNode.id === "input" ? (
                                <>
                                    <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 text-xs text-blue-400">
                                        This is the <b>root node</b>. Enter your startup idea here — every agent in the pipeline will work from this input.
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Startup Idea</label>
                                        <textarea
                                            rows={7}
                                            value={selectedNode.data.instructions}
                                            onChange={(e) => updateNodeData("instructions", e.target.value)}
                                            placeholder="e.g. An AI-powered personal finance coach for college students..."
                                            className="w-full bg-[#060b14] border border-slate-800 rounded-xl p-3 text-white text-xs leading-relaxed focus:ring-2 focus:ring-blue-500/50 outline-none resize-none placeholder:text-slate-700 transition-all"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Agent Role</label>
                                        <input
                                            type="text"
                                            value={selectedNode.data.role}
                                            onChange={(e) => updateNodeData("role", e.target.value)}
                                            className="w-full bg-[#060b14] border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                                            placeholder="e.g. Market Analyst"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">AI Model / Tool</label>
                                        <div className="space-y-1.5">
                                            {MODEL_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => updateNodeData("model", opt.value)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-xs ${
                                                        (selectedNode.data.model || "groq") === opt.value
                                                            ? "bg-white/[0.08] border border-white/15 text-white"
                                                            : "bg-transparent border border-white/[0.04] text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
                                                    }`}
                                                >
                                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: opt.color }} />
                                                    <div>
                                                        <div className="font-bold">{opt.label}</div>
                                                        <div className="text-[10px] text-slate-600">{opt.desc}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">System Instructions</label>
                                        <textarea
                                            rows={5}
                                            value={selectedNode.data.instructions}
                                            onChange={(e) => updateNodeData("instructions", e.target.value)}
                                            placeholder="Describe what this agent should do, analyze, or output..."
                                            className="w-full bg-[#060b14] border border-slate-800 rounded-xl p-3 text-white text-xs leading-relaxed focus:ring-2 focus:ring-blue-500/50 outline-none resize-none placeholder:text-slate-700 transition-all"
                                        />
                                    </div>
                                </>
                            )}
                            <div className="text-[10px] text-slate-700 font-mono">
                                Node ID: {selectedNode.id}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-slate-600">
                                <MousePointer2 size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-500 mb-1">Select a node</p>
                                <p className="text-xs text-slate-700 leading-relaxed">Click any node on the canvas to configure its role and instructions.</p>
                            </div>
                            <div className="w-full p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-left">
                                <p className="text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wider">Quick Tips</p>
                                <ul className="space-y-1.5 text-[11px] text-slate-700">
                                    <li>• Drag from a node's <b className="text-slate-500">edge dot</b> to connect agents</li>
                                    <li>• Use the <b className="text-slate-500">Delete</b> key to remove edges</li>
                                    <li>• First set your <b className="text-slate-500">Startup Idea</b> node</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Launch Bar */}
            {!canLaunch && (
                <div className="flex items-center gap-3 px-5 py-3 bg-amber-500/5 border-t border-amber-500/10 text-xs text-amber-500/70">
                    <Info size={13} />
                    Click the <b className="text-amber-400">🚀 Startup Idea</b> node and enter your idea to enable launch.
                </div>
            )}
        </div>
    );
}
