"use client";

import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { AgentEvent } from "@/app/lib/sseClient";
import { useMemo } from 'react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function MarketCharts({ events }: { events: AgentEvent[] }) {
    // Find market data in events
    const marketEvent = events.find(e => e.agent_name === 'MarketAgent' && e.type === 'agent_result');
    const marketData = marketEvent?.data;

    const barData = useMemo(() => {
        // Use dynamic values from the LLM, with intelligent fallbacks
        const tam = marketData?.tam || 0;
        const sam = marketData?.sam || 0;
        const som = marketData?.som || 0;

        return {
            labels: ['TAM', 'SAM', 'SOM'],
            datasets: [
                {
                    label: 'Market Size (Est. $M)',
                    data: [tam, sam, som],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.6)',
                        'rgba(139, 92, 246, 0.6)',
                        'rgba(16, 185, 129, 0.6)',
                    ],
                    borderColor: [
                        '#3b82f6',
                        '#8b5cf6',
                        '#10b981',
                    ],
                    borderWidth: 2,
                    borderRadius: 6,
                },
            ],
        };
    }, [marketData]);

    if (!marketData) {
        return (
            <div className="flex flex-col items-center justify-center h-48 opacity-20">
                <p className="text-sm italic">Waiting for market analysis...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Market Size */}
            {marketData.market_size && (
                <p className="text-lg font-bold text-white">{marketData.market_size}</p>
            )}

            {/* Dynamic Bar Chart */}
            <div className="h-48">
                <Bar
                    data={barData}
                    options={{
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                        },
                        scales: {
                            y: {
                                grid: { color: 'rgba(255,255,255,0.05)' },
                                ticks: { color: '#94a3b8', callback: (val) => `$${val}M` }
                            },
                            x: {
                                ticks: { color: '#94a3b8' }
                            }
                        }
                    }}
                />
            </div>

            {/* Growth Rate & Trends */}
            <div className="text-xs text-slate-400 space-y-1">
                <p><strong className="text-slate-300">Growth Rate:</strong> {marketData.growth_rate || 'Calculating...'}</p>
                <p><strong className="text-slate-300">Top Trends:</strong> {marketData.trends?.join(', ') || 'Analyzing...'}</p>
            </div>
        </div>
    );
}
