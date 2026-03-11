"use client";

import { useState, useEffect } from "react";
import { AgentEvent, createSSEClient } from "@/app/lib/sseClient";
import AgentLogPanel from "@/app/components/AgentLogPanel";
import AgentGraph from "@/app/components/AgentGraph";
import MarketCharts from "@/app/components/MarketCharts";
import ReportViewer from "@/app/components/ReportViewer";
import { ArrowLeft, Play, Pause, X } from "lucide-react";
import { toast } from "react-toastify";

export default function Dashboard({ session, onBack }: { session: { id: string; idea: string }, onBack: () => void }) {
    const [events, setEvents] = useState<AgentEvent[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [finalReport, setFinalReport] = useState<any>(null);

    useEffect(() => {
        if (isPaused) return;

        const cleanup = createSSEClient(session.id, (event) => {
            setEvents((prev) => [...prev, event]);

            if (event.type === 'analysis_complete') {
                setFinalReport(event.data);
                toast.success("Startup research mission complete!");
            }
            if (event.type === 'error') {
                if (event.error_code === 'RATE_LIMIT_EXCEEDED') {
                    toast.warning("🚀 Provider rate limit reached! Please try again in 1-2 minutes.", {
                        autoClose: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                    });
                } else {
                    toast.error(`Agent failure: ${event.content}`);
                }
            }
        });

        return cleanup;
    }, [session.id, isPaused]);

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-6 rounded-2xl border border-white/10 shadow-xl">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Project: {session.idea}</h2>
                        <p className="text-sm text-slate-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Agent Team Deployment Active (Session: {session.id})
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        {isPaused ? <Play size={16} /> : <Pause size={16} />}
                        {isPaused ? "Resume" : "Interrupt"}
                    </button>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2 bg-red-900/50 hover:bg-red-800/50 rounded-lg text-sm font-medium text-red-200 transition-colors"
                    >
                        <X size={16} />
                        Abort Mission
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Work Area - Graph & Charts */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="glass h-[500px] rounded-2xl p-6 relative overflow-hidden">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Agent Collaboration Graph</h3>
                        <AgentGraph events={events} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass min-h-[300px] rounded-2xl p-6">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Market Opportunity</h3>
                            <MarketCharts events={events} />
                        </div>
                        <div className="glass min-h-[300px] rounded-2xl p-6">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Final Synthesis</h3>
                            {finalReport ? (
                                <ReportViewer data={finalReport} idea={session.idea} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-500 italic text-sm">
                                    Waiting for Report Agent to synthesize final data...
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Live Logs Sidebar */}
                <div className="lg:col-span-4 h-full">
                    <AgentLogPanel events={events} />
                </div>
            </div>
        </div>
    );
}
