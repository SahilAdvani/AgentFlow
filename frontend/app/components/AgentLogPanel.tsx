"use client";

import { useEffect, useRef } from "react";
import { AgentEvent } from "@/app/lib/sseClient";
import { Terminal, Brain, Search, CheckCircle2, AlertTriangle } from "lucide-react";

export default function AgentLogPanel({ events }: { events: AgentEvent[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [events]);

    return (
        <div className="glass h-[830px] rounded-2xl flex flex-col overflow-hidden border border-white/5 shadow-2xl">
            <div className="p-4 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Terminal size={14} className="text-blue-500" />
                    Mission Control Logs
                </h3>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full border border-blue-500/20">
                    LIVE STREAM
                </span>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            >
                {events.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-30">
                        <Brain size={40} className="animate-pulse" />
                        <p className="text-sm italic">Initializing neural connections...</p>
                    </div>
                )}

                {events.map((event, idx) => (
                    <LogEntry key={idx} event={event} />
                ))}
            </div>
        </div>
    );
}

function LogEntry({ event }: { event: AgentEvent }) {
    const isThinking = event.type === 'agent_thinking';
    const isResult = event.type === 'agent_result' || event.type === 'analysis_complete';
    const isError = event.type === 'error';

    return (
        <div className={`p-3 rounded-xl border transition-all duration-300 ${isResult ? 'bg-emerald-500/5 border-emerald-500/20' :
            isError ? 'bg-red-500/5 border-red-500/20' :
                'bg-slate-800/30 border-white/5'
            }`}>
            <div className="flex items-start gap-3">
                <div className={`mt-1 h-2 w-2 rounded-full ${isThinking ? 'bg-blue-500 animate-pulse' :
                    isResult ? 'bg-emerald-500' :
                        isError ? 'bg-red-500' : 'bg-slate-500'
                    }`} />

                <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase text-slate-500 tracking-tighter">
                            {event.agent_name}
                        </span>
                        {isThinking && <Brain size={12} className="text-blue-400 opacity-50" />}
                        {isResult && <CheckCircle2 size={12} className="text-emerald-400" />}
                        {isError && <AlertTriangle size={12} className="text-red-400" />}
                    </div>

                    <p className="text-sm text-slate-300 font-medium break-words leading-relaxed">
                        {typeof event.content === 'string' ? event.content : JSON.stringify(event.content)}
                    </p>

                    {event.data && (
                        <div className="mt-2 text-[11px] font-mono text-slate-500 bg-black/40 p-2 rounded-lg border border-white/5 overflow-x-auto">
                            <pre>{JSON.stringify(event.data, null, 2)}</pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
