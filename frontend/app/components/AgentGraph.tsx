"use client";

import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { AgentEvent } from "@/app/lib/sseClient";
import { useMemo } from 'react';

const initialNodes = [
    { id: 'manager', position: { x: 300, y: 0 }, data: { label: 'Manager Agent' }, type: 'input' },
    { id: 'research', position: { x: 100, y: 150 }, data: { label: 'Research Agent' } },
    { id: 'market', position: { x: 300, y: 150 }, data: { label: 'Market Agent' } },
    { id: 'competitor', position: { x: 500, y: 150 }, data: { label: 'Competitor Agent' } },
    { id: 'strategy', position: { x: 300, y: 300 }, data: { label: 'Strategy Agent' } },
    { id: 'report', position: { x: 300, y: 400 }, data: { label: 'Report Agent' }, type: 'output' },
];

const initialEdges = [
    { id: 'e1-2', source: 'manager', target: 'research', animated: true },
    { id: 'e1-3', source: 'manager', target: 'market', animated: true },
    { id: 'e1-4', source: 'manager', target: 'competitor', animated: true },
    { id: 'e2-5', source: 'research', target: 'strategy', animated: true },
    { id: 'e3-5', source: 'market', target: 'strategy', animated: true },
    { id: 'e4-5', source: 'competitor', target: 'strategy', animated: true },
    { id: 'e5-6', source: 'strategy', target: 'report', animated: true },
];

export default function AgentGraph({ events }: { events: AgentEvent[] }) {
    // Highlight nodes based on events
    const nodes = useMemo(() => {
        const activeAgent = events.length > 0 ? events[events.length - 1].agent_name.toLowerCase().replace('agent', '') : null;

        return initialNodes.map(node => ({
            ...node,
            style: {
                background: node.id === activeAgent ? '#3b82f6' : '#1e293b',
                color: '#fff',
                border: node.id === activeAgent ? '2px solid #60a5fa' : '1px solid #334155',
                borderRadius: '8px',
                padding: '10px',
                width: 150,
                boxShadow: node.id === activeAgent ? '0 0 20px rgba(59, 130, 246, 0.5)' : 'none'
            }
        }));
    }, [events]);

    return (
        <div className="w-full h-full">
            <ReactFlow
                nodes={nodes}
                edges={initialEdges}
                fitView
                style={{ background: 'transparent' }}
            >
                <Background color="#334155" gap={20} />
                <Controls />
            </ReactFlow>
        </div>
    );
}
