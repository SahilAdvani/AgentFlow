"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, MousePointer2, Zap, ChevronRight, Send, BarChart3, Network, Shield, FileText, Clock, Cpu, Info } from "lucide-react";
import Link from "next/link";
import CustomAgentBuilder from "@/app/components/CustomAgentBuilder";
import { Node, Edge } from "reactflow";

type Mode = "compare" | "default" | "custom";

export default function ExplorePage() {
    return (
        <Suspense>
            <ExploreContent />
        </Suspense>
    );
}

function ExploreContent() {
    const [mode, setMode] = useState<Mode>("compare");
    const [idea, setIdea] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDefaultLaunch = async () => {
        if (!idea.trim()) return;
        setLoading(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
            const resp = await fetch(`${baseUrl}/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idea, email: email || undefined }),
            });
            const data = await resp.json();
            router.push(`/?session_id=${data.session_id}&idea=${encodeURIComponent(idea)}&modelType=default`);
        } catch {
            setLoading(false);
        }
    };

    const handleCustomLaunch = async (nodes: Node[], edges: Edge[]) => {
        const inputNode = nodes.find((n) => n.id === "input");
        const idea = inputNode?.data?.instructions || "Custom Pipeline";
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
            const resp = await fetch(`${baseUrl}/analyze/custom`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idea, nodes, edges }),
            });
            const data = await resp.json();
            router.push(`/?session_id=${data.session_id}&idea=${encodeURIComponent(idea)}&modelType=custom`);
        } catch (err) {
            console.error(err);
        }
    };

    const defaultFeatures = [
        { icon: <BarChart3 size={14} />, text: "Market size & TAM/SAM/SOM analysis" },
        { icon: <Network size={14} />, text: "Competitor landscape mapping" },
        { icon: <Zap size={14} />, text: "Strategy & UVP generation" },
        { icon: <FileText size={14} />, text: "PDF report synthesis" },
        { icon: <Clock size={14} />, text: "Ready in ~5 minutes" },
        { icon: <Shield size={14} />, text: "Reliable with retries" },
    ];

    const customFeatures = [
        { icon: <MousePointer2 size={14} />, text: "Visual drag-and-drop builder" },
        { icon: <Cpu size={14} />, text: "Custom agent roles & instructions" },
        { icon: <Network size={14} />, text: "DAG-based execution order" },
        { icon: <ArrowRight size={14} />, text: "Context passing between nodes" },
        { icon: <Zap size={14} />, text: "Real-time streaming dashboard" },
        { icon: <Shield size={14} />, text: "Unlimited agent nodes" },
    ];

    return (
        <div className="min-h-screen bg-[#060b14] text-white flex flex-col overflow-x-hidden">
            {/* Ambient BG */}
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-blue-600/8 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[130px]" />
                <div className="absolute inset-0 opacity-[0.025]"
                    style={{ backgroundImage: "linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)", backgroundSize: "80px 80px" }}
                />
            </div>

            {/* HEADER */}
            <header className="relative z-30 w-full border-b border-white/[0.06] bg-[#060b14]/80 backdrop-blur-xl sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 h-[64px] flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-black text-xs shadow-lg shadow-blue-500/30">AF</div>
                        <span className="font-bold text-[15px] text-white">AgentFlow</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        {mode !== "compare" && (
                            <button onClick={() => setMode("compare")} className="text-sm text-slate-500 hover:text-slate-300 px-4 py-2 hover:bg-white/5 rounded-xl transition-all">
                                ← Back to Compare
                            </button>
                        )}
                        <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white px-4 py-2 rounded-xl hover:bg-white/5 transition-all">
                            Home
                        </Link>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-8 py-12 md:py-20 flex flex-col gap-12">

                {/* HERO */}
                <section className="text-center space-y-5 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold uppercase tracking-widest">
                        Choose Your Deployment Mode
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
                        Two Modes.<br />
                        <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Infinite Possibilities.</span>
                    </h1>
                    <p className="text-slate-400 text-base leading-relaxed max-w-xl mx-auto">
                        Select a mode below to try it instantly — no navigation required.
                    </p>
                </section>

                {/* MODE TABS */}
                {mode === "compare" && (
                    <section className="grid md:grid-cols-2 gap-5">
                        {/* Default Card */}
                        <div
                            className="relative bg-[#0d1424] border border-white/[0.06] rounded-3xl p-7 flex flex-col gap-6 overflow-hidden group hover:border-white/[0.14] transition-all duration-300 cursor-pointer"
                            onClick={() => setMode("default")}
                        >
                            <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-500/8 rounded-full blur-3xl group-hover:bg-blue-500/14 transition-all duration-500 pointer-events-none" />

                            <div>
                                <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                                    <Zap size={20} />
                                </div>
                                <h2 className="text-xl font-black mb-1.5">Analyst Fleet</h2>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    6 specialist AI agents that collaborate to deliver comprehensive startup research — market, competitors, strategy — in minutes.
                                </p>
                            </div>

                            <ul className="flex-1 space-y-2.5">
                                {defaultFeatures.map((f) => (
                                    <li key={f.text} className="flex items-center gap-2.5 text-sm text-slate-400">
                                        <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">{f.icon}</span>
                                        {f.text}
                                    </li>
                                ))}
                            </ul>

                            <div className="flex items-center gap-2 text-sm font-bold text-blue-400 group-hover:gap-3 transition-all">
                                Try Analyst Fleet
                                <ChevronRight size={16} />
                            </div>
                        </div>

                        {/* Custom Card */}
                        <div
                            className="relative bg-[#0d1424] border border-blue-500/20 rounded-3xl p-7 flex flex-col gap-6 overflow-hidden group hover:border-blue-500/40 transition-all duration-300 cursor-pointer"
                            onClick={() => setMode("custom")}
                        >
                            <div className="absolute -top-16 -right-16 w-48 h-48 bg-violet-500/8 rounded-full blur-3xl group-hover:bg-violet-500/14 transition-all duration-500 pointer-events-none" />
                            <div className="absolute top-5 right-5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30">Advanced</div>

                            <div>
                                <div className="w-11 h-11 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
                                    <MousePointer2 size={20} />
                                </div>
                                <h2 className="text-xl font-black mb-1.5">Custom Architect</h2>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Drag-and-drop visual builder to design your own agent workflows — any role, any chain, any logic.
                                </p>
                            </div>

                            <ul className="flex-1 space-y-2.5">
                                {customFeatures.map((f) => (
                                    <li key={f.text} className="flex items-center gap-2.5 text-sm text-slate-400">
                                        <span className="w-5 h-5 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0">{f.icon}</span>
                                        {f.text}
                                    </li>
                                ))}
                            </ul>

                            <div className="flex items-center gap-2 text-sm font-bold text-violet-400 group-hover:gap-3 transition-all">
                                Try Custom Architect
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </section>
                )}

                {/* DEFAULT MODE INLINE */}
                {mode === "default" && (
                    <section className="flex flex-col items-center gap-8">
                        <div className="text-center space-y-2">
                            <div className="flex items-center justify-center gap-2 text-blue-400 font-bold text-lg">
                                <Zap size={20} /> Analyst Fleet
                            </div>
                            <p className="text-slate-500 text-sm">6 Specialist agents · Real-time streaming · PDF report</p>
                        </div>

                        <div className="w-full max-w-xl bg-[#0d1424] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
                            <div className="h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60" />
                            <div className="p-5 space-y-4">
                                <textarea
                                    value={idea}
                                    onChange={(e) => setIdea(e.target.value)}
                                    placeholder="Describe your startup idea or market to analyze..."
                                    rows={4}
                                    className="w-full bg-transparent border-0 outline-none text-white placeholder:text-slate-700 resize-none text-[15px] leading-relaxed"
                                />
                                <div className="flex items-center gap-3 pt-2 border-t border-white/[0.05]">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Email for report (optional)"
                                        className="flex-1 bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-700 outline-none focus:border-blue-500/50 transition-all"
                                    />
                                    <button
                                        onClick={handleDefaultLaunch}
                                        disabled={!idea.trim() || loading}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
                                        Launch
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center">
                            {["AI-powered personal finance", "On-demand vet platform", "Hyperlocal jobs for Gen-Z"].map((ex) => (
                                <button key={ex} onClick={() => setIdea(ex)} className="text-xs px-3 py-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] text-slate-500 hover:text-slate-300 hover:border-white/15 transition-all">
                                    {ex}
                                </button>
                            ))}
                        </div>

                        <button onClick={() => setMode("compare")} className="text-sm text-slate-600 hover:text-slate-400 transition-colors">
                            ← Back to mode selection
                        </button>
                    </section>
                )}

                {/* CUSTOM MODE INLINE */}
                {mode === "custom" && (
                    <section className="flex flex-col gap-6">
                        <div className="text-center space-y-2">
                            <div className="flex items-center justify-center gap-2 text-violet-400 font-bold text-lg">
                                <MousePointer2 size={20} /> Custom Architect
                            </div>
                            <p className="text-slate-500 text-sm">Design your pipeline → Click a node to configure → Launch when ready</p>
                        </div>

                        <div className="flex items-start gap-2 px-4 py-3 bg-amber-500/5 border border-amber-500/15 rounded-2xl text-xs text-amber-500/80 max-w-2xl mx-auto">
                            <Info size={14} className="shrink-0 mt-0.5" />
                            <span>
                                <b>Step 1:</b> Click the <b>🚀 Startup Idea</b> node to enter your idea.&nbsp;
                                <b>Step 2:</b> Configure each agent node.&nbsp;
                                <b>Step 3:</b> Connect them in order.&nbsp;
                                <b>Step 4:</b> Click <b>Launch Graph</b>.
                            </span>
                        </div>

                        <CustomAgentBuilder onLaunch={handleCustomLaunch} />

                        <button onClick={() => setMode("compare")} className="text-sm text-slate-600 hover:text-slate-400 transition-colors text-center">
                            ← Back to mode selection
                        </button>
                    </section>
                )}

                {/* Comparison Table — always visible on compare */}
                {mode === "compare" && (
                    <section className="space-y-5">
                        <h2 className="text-xl font-black text-center text-white">Side-by-Side Comparison</h2>
                        <div className="bg-[#0d1424] border border-white/[0.06] rounded-2xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/[0.06]">
                                        <th className="text-left p-5 font-semibold text-slate-600 uppercase text-[11px] tracking-wider">Feature</th>
                                        <th className="text-center p-5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider"><span className="flex items-center justify-center gap-2"><Zap size={13} className="text-blue-400" /> Default</span></th>
                                        <th className="text-center p-5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider bg-blue-500/[0.03] border-l border-blue-500/10"><span className="flex items-center justify-center gap-2"><MousePointer2 size={13} className="text-violet-400" /> Custom</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        ["Setup Time", "< 30 seconds", "2–5 minutes"],
                                        ["Flexibility", "Fixed workflow", "Fully custom DAG"],
                                        ["Agent Count", "6 Specialist agents", "Unlimited"],
                                        ["Output Format", "PDF Report", "Raw agent outputs"],
                                        ["Best For", "Quick startup research", "Custom automation"],
                                    ].map(([label, v1, v2], i, arr) => (
                                        <tr key={label} className={`hover:bg-white/[0.02] transition-colors ${i < arr.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                                            <td className="p-5 text-slate-400 font-medium">{label}</td>
                                            <td className="p-5 text-center text-slate-300">{v1}</td>
                                            <td className="p-5 text-center font-semibold text-blue-400 bg-blue-500/[0.02] border-l border-blue-500/10">{v2}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </main>

            <footer className="relative z-10 border-t border-white/[0.05] py-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-black text-[10px]">AF</div>
                    <span className="text-slate-500 font-semibold text-sm">AgentFlow</span>
                </div>
                <p className="text-slate-700 text-xs">Powered by Groq · LLaMA 3.3 70B</p>
            </footer>
        </div>
    );
}
