"use client";

import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import { AgentEvent } from "@/app/lib/sseClient";
import { useMemo } from "react";

// --- Default mode: hardcoded 6-agent graph ---
const defaultNodes = [
    { id: "manager", position: { x: 300, y: 0 }, data: { label: "Manager Agent" }, type: "input" },
    { id: "research", position: { x: 100, y: 150 }, data: { label: "Research Agent" } },
    { id: "market", position: { x: 300, y: 150 }, data: { label: "Market Agent" } },
    { id: "competitor", position: { x: 500, y: 150 }, data: { label: "Competitor Agent" } },
    { id: "strategy", position: { x: 300, y: 300 }, data: { label: "Strategy Agent" } },
    { id: "report", position: { x: 300, y: 400 }, data: { label: "Report Agent" }, type: "output" },
];

const defaultEdges = [
    { id: "e1-2", source: "manager", target: "research", animated: true },
    { id: "e1-3", source: "manager", target: "market", animated: true },
    { id: "e1-4", source: "manager", target: "competitor", animated: true },
    { id: "e2-5", source: "research", target: "strategy", animated: true },
    { id: "e3-5", source: "market", target: "strategy", animated: true },
    { id: "e4-5", source: "competitor", target: "strategy", animated: true },
    { id: "e5-6", source: "strategy", target: "report", animated: true },
];

// --- Model color map ---
const MODEL_COLORS: Record<string, string> = {
    groq: "#f59e0b",
    openai: "#10b981",
    tavily: "#3b82f6",
    none: "#64748b",
};

const MODEL_LABELS: Record<string, string> = {
    groq: "Groq",
    openai: "GPT-4o",
    tavily: "Tavily",
    none: "",
};

const STATUS_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
    pending: { bg: "#1e293b", border: "#334155", glow: "none" },
    running: { bg: "#1e293b", border: "#3b82f6", glow: "0 0 20px rgba(59,130,246,0.5)" },
    complete: { bg: "#1e293b", border: "#22c55e", glow: "0 0 12px rgba(34,197,94,0.3)" },
    error: { bg: "#1e293b", border: "#ef4444", glow: "0 0 12px rgba(239,68,68,0.3)" },
};

interface Props {
    events: AgentEvent[];
    modelType?: "default" | "custom";
    customNodes?: any[];
    customEdges?: any[];
}

export default function AgentGraph({ events, modelType, customNodes, customEdges }: Props) {
    // Extract node statuses from SSE events
    const nodeStatuses = useMemo(() => {
        const statuses: Record<string, { status: string; model: string; role: string }> = {};
        for (const e of events) {
            if (e.data && typeof e.data === "object" && "node_id" in e.data) {
                const d = e.data as { node_id: string; status: string; model: string; role: string };
                statuses[d.node_id] = { status: d.status, model: d.model, role: d.role };
            }
        }
        return statuses;
    }, [events]);

    // Default mode
    if (modelType !== "custom" || !customNodes || customNodes.length === 0) {
        const activeAgent = events.length > 0 ? events[events.length - 1].agent_name.toLowerCase().replace("agent", "") : null;
        const nodes = defaultNodes.map((node) => ({
            ...node,
            style: {
                background: node.id === activeAgent ? "#3b82f6" : "#1e293b",
                color: "#fff",
                border: node.id === activeAgent ? "2px solid #60a5fa" : "1px solid #334155",
                borderRadius: "8px",
                padding: "10px",
                width: 150,
                boxShadow: node.id === activeAgent ? "0 0 20px rgba(59, 130, 246, 0.5)" : "none",
            },
        }));
        return (
            <div className="w-full h-full">
                <ReactFlow nodes={nodes} edges={defaultEdges} fitView style={{ background: "transparent" }}>
                    <Background color="#334155" gap={20} />
                    <Controls />
                </ReactFlow>
            </div>
        );
    }

    // Custom mode: build nodes from the user's graph + SSE statuses
    const nodes = customNodes.map((n: any, i: number) => {
        const nodeId = n.id;
        const role = n.data?.role || nodeId;
        const model = n.data?.model || "groq";
        const statusInfo = nodeStatuses[nodeId] || { status: "pending", model, role };
        const sc = STATUS_COLORS[statusInfo.status] || STATUS_COLORS.pending;
        const modelColor = MODEL_COLORS[model] || MODEL_COLORS.groq;

        // Build a rich label
        const statusEmoji = statusInfo.status === "complete" ? "✅" :
            statusInfo.status === "running" ? "⏳" :
            statusInfo.status === "error" ? "❌" : "⏸️";

        const label = nodeId === "input"
            ? `🚀 ${role}`
            : `${statusEmoji} ${role}\n[${MODEL_LABELS[model] || model}]`;

        return {
            id: nodeId,
            type: nodeId === "input" ? "input" : undefined,
            position: n.position || { x: 200, y: i * 140 },
            data: { label },
            style: {
                background: sc.bg,
                color: "#fff",
                border: `2px solid ${sc.border}`,
                borderRadius: "10px",
                padding: "10px 14px",
                width: 180,
                fontSize: "12px",
                fontWeight: "600",
                whiteSpace: "pre-line" as const,
                boxShadow: sc.glow,
                borderLeft: `4px solid ${modelColor}`,
            },
        };
    });

    const edges = (customEdges || []).map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: true,
        style: { stroke: "#6366f1" },
    }));

    return (
        <div className="w-full h-full">
            <ReactFlow nodes={nodes} edges={edges} fitView fitViewOptions={{ padding: 0.3 }} style={{ background: "transparent" }}>
                <Background color="#334155" gap={20} />
                <Controls />
            </ReactFlow>
        </div>
    );
}
