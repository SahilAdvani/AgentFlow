"use client";

import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { AgentEvent } from "@/app/lib/sseClient";
import { useMemo } from 'react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

export default function MarketCharts({ events }: { events: AgentEvent[] }) {
    // Find market data in events
    const marketEvent = events.find(e => e.agent_name === 'MarketAgent' && e.type === 'agent_result');
    const marketData = marketEvent?.data;

    const barData = useMemo(() => ({
        labels: ['TAM', 'SAM', 'SOM'],
        datasets: [
            {
                label: 'Market Size (Est. $M)',
                data: marketData ? [1000, 500, 100] : [0, 0, 0], // Simple placeholder if data structure varies
                backgroundColor: [
                    'rgba(59, 130, 246, 0.5)',
                    'rgba(139, 92, 246, 0.5)',
                    'rgba(16, 185, 129, 0.5)',
                ],
                borderColor: [
                    '#3b82f6',
                    '#8b5cf6',
                    '#10b981',
                ],
                borderWidth: 1,
            },
        ],
    }), [marketData]);

    if (!marketData) {
        return (
            <div className="flex flex-col items-center justify-center h-48 opacity-20">
                <p className="text-sm italic">Waiting for market analysis...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="h-48">
                <Bar
                    data={barData}
                    options={{
                        maintainAspectRatio: false,
                        scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } } }
                    }}
                />
            </div>
            <div className="text-xs text-slate-400 space-y-1">
                <p><strong>Growth Rate:</strong> {marketData.growth_rate || 'N/A'}</p>
                <p><strong>Top Trends:</strong> {marketData.trends?.join(', ') || 'N/A'}</p>
            </div>
        </div>
    );
}
