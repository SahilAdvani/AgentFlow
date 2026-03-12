"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Dashboard from "@/app/components/Dashboard";
import AuthModal from "@/app/components/AuthModal";
import CustomAgentBuilder from "@/app/components/CustomAgentBuilder";
import { createClient } from "@/app/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { LogOut, History, UserCircle2, Zap, MousePointer2, X, Send, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Node, Edge } from "reactflow";

export default function Home() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#060b14] flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-400">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium">Loading AgentFlow...</span>
                </div>
            </div>
        }>
            <HomeContent />
        </Suspense>
    );
}

function HomeContent() {
    const [session, setSession] = useState<{ id: string; idea: string; modelType?: "default" | "custom"; customNodes?: any[]; customEdges?: any[] } | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [showDefaultPopup, setShowDefaultPopup] = useState(false);
    const [showCustomBuilder, setShowCustomBuilder] = useState(false);

    const searchParams = useSearchParams();
    const supabase = createClient();

    useEffect(() => {
        const mode = searchParams.get("mode");
        if (mode === "custom") setShowCustomBuilder(true);
        if (mode === "default") setShowDefaultPopup(true);

        const sessionId = searchParams.get("session_id");
        const redirectIdea = searchParams.get("idea");
        const redirectModelType = searchParams.get("modelType") as "default" | "custom" | null;
        if (sessionId && redirectIdea) {
            setSession({ id: sessionId, idea: redirectIdea, modelType: redirectModelType || "default" });
        }
    }, [searchParams]);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
        };
        checkUser();
        const { data: auth } = supabase.auth.onAuthStateChange((_, s) => setUser(s?.user || null));
        return () => auth.subscription.unsubscribe();
    }, []);

    const handleSignOut = async () => { await supabase.auth.signOut(); setUser(null); };

    const handleStartAnalysis = async (idea: string, email?: string, modelType: "default" | "custom" = "default", nodes?: Node[], edges?: Edge[]) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        const endpoint = modelType === "custom" ? "/analyze/custom" : "/analyze";
        const resp = await fetch(`${baseUrl}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idea, email, user_id: user?.id, nodes, edges }),
        });
        const data = await resp.json();
        setShowDefaultPopup(false);
        setShowCustomBuilder(false);
        setSession({ id: data.session_id, idea, modelType, customNodes: nodes, customEdges: edges });
    };

    const handleCustomLaunch = (ns: Node[], es: Edge[]) => {
        const inputNode = ns.find(n => n.id === "input");
        const idea = inputNode?.data?.instructions || "Custom Pipeline";
        handleStartAnalysis(idea, undefined, "custom", ns, es);
    };

    if (session) return <Dashboard session={session} onBack={() => setSession(null)} />;

    return (
        <div className="min-h-screen bg-[#060b14] text-white flex flex-col overflow-x-hidden">
            {/* Ambient Background */}
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
                <div className="absolute inset-0 opacity-[0.025]"
                    style={{ backgroundImage: "linear-gradient(rgba(99,102,241,0.4) 1px, transparent 1px),linear-gradient(90deg, rgba(99,102,241,0.4) 1px, transparent 1px)", backgroundSize: "80px 80px" }}
                />
            </div>

            {/* HEADER */}
            <header className="relative z-30 w-full border-b border-white/[0.06] bg-[#060b14]/80 backdrop-blur-xl sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 h-[64px] flex items-center justify-between">
                    <Link href="/" onClick={() => { setShowCustomBuilder(false); setShowDefaultPopup(false); }} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-black text-xs shadow-lg shadow-blue-500/30">AF</div>
                        <span className="font-bold text-[15px] text-white">AgentFlow</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-1">
                        <Link href="/explore" className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">Explore</Link>
                        <Link href="/history" className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">History</Link>
                    </nav>
                    <div className="flex items-center gap-3">
                        {user ? (
                            <>
                                <Link href="/history" className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/5 transition-all">
                                    <History size={15} /> Reports
                                </Link>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-xs font-bold shadow">
                                    {user.email?.[0].toUpperCase()}
                                </div>
                                <button onClick={handleSignOut} className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all" title="Sign Out">
                                    <LogOut size={16} />
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setIsAuthModalOpen(true)} className="flex items-center gap-2 text-sm font-semibold bg-white/8 hover:bg-white/12 border border-white/10 text-white px-4 py-2 rounded-xl transition-all hover:border-white/20">
                                <UserCircle2 size={15} /> Sign In
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* MAIN */}
            <main className="relative z-10 flex-1 flex flex-col">

                {!showCustomBuilder ? (
                    /* ---- LANDING HERO ---- */
                    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-20 text-center max-w-5xl mx-auto w-full gap-10">

                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold uppercase tracking-widest">
                                <Sparkles size={12} className="animate-pulse" />
                                Agentic AI Platform · v2.0
                            </div>
                            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[1.05]">
                                Build Your<br />
                                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-500 bg-clip-text text-transparent">
                                    Agent Workforce
                                </span>
                            </h1>
                            <p className="text-slate-400 text-base sm:text-xl max-w-xl mx-auto leading-relaxed">
                                Deploy a pre-configured analyst fleet or architect your own custom AI pipeline to research any startup idea.
                            </p>
                        </div>

                        {/* TWO BUTTONS */}
                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg mx-auto">
                            <button
                                onClick={() => setShowDefaultPopup(true)}
                                className="flex-1 group flex items-center justify-center gap-3 py-5 px-8 bg-[#0d1424] hover:bg-[#111827] border border-white/[0.08] hover:border-white/[0.16] rounded-2xl transition-all duration-200 shadow-xl text-left"
                            >
                                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                    <Zap size={20} />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-black text-white text-sm">Analyst Fleet</div>
                                    <div className="text-slate-500 text-xs mt-0.5">6 specialist agents · instant</div>
                                </div>
                                <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                            </button>

                            <button
                                onClick={() => setShowCustomBuilder(true)}
                                className="flex-1 group flex items-center justify-center gap-3 py-5 px-8 bg-gradient-to-br from-blue-600/20 to-violet-600/20 hover:from-blue-600/30 hover:to-violet-600/30 border border-blue-500/20 hover:border-blue-500/40 rounded-2xl transition-all duration-200 shadow-xl shadow-blue-500/5"
                            >
                                <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                                    <MousePointer2 size={20} />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-black text-white text-sm">Custom Architect</div>
                                    <div className="text-slate-500 text-xs mt-0.5">Build your own pipeline</div>
                                </div>
                                <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                            </button>
                        </div>

                        <Link href="/explore" className="text-xs text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1.5 group">
                            Not sure? Compare both modes
                            <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                ) : (
                    /* ---- CUSTOM BUILDER FULL VIEW ---- */
                    <div className="flex-1 flex flex-col px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-violet-400 font-black text-lg">
                                    <MousePointer2 size={18} /> Custom Architect
                                </div>
                                <p className="text-slate-500 text-xs mt-0.5">Design your pipeline · Click nodes to configure · Launch when ready</p>
                            </div>
                            <button
                                onClick={() => setShowCustomBuilder(false)}
                                className="flex items-center gap-2 text-slate-500 hover:text-white text-sm px-4 py-2 rounded-xl hover:bg-white/5 transition-all border border-white/5 hover:border-white/10"
                            >
                                ← Back
                            </button>
                        </div>
                        <div className="flex-1">
                            <CustomAgentBuilder onLaunch={handleCustomLaunch} />
                        </div>
                    </div>
                )}
            </main>

            {/* DEFAULT MODEL POPUP */}
            {showDefaultPopup && (
                <DefaultModelPopup
                    onClose={() => setShowDefaultPopup(false)}
                    onLaunch={(idea, email) => handleStartAnalysis(idea, email, "default")}
                />
            )}

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={() => setIsAuthModalOpen(false)} />
        </div>
    );
}

function DefaultModelPopup({ onClose, onLaunch }: { onClose: () => void; onLaunch: (idea: string, email?: string) => void }) {
    const [idea, setIdea] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!idea.trim()) return;
        setLoading(true);
        await onLaunch(idea, email || undefined);
    };

    const examples = ["AI tutoring platform for college students", "On-demand veterinarian service app", "Hyperlocal jobs board for Gen-Z"];

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div className="pointer-events-auto w-full max-w-lg bg-[#0d1424] border border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden">
                    {/* Accent line */}
                    <div className="h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

                    <div className="p-7 space-y-5">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                        <Zap size={16} />
                                    </div>
                                    <h2 className="font-black text-white text-lg">Analyst Fleet</h2>
                                </div>
                                <p className="text-slate-500 text-xs">6 specialist AI agents · Real-time streaming · PDF report</p>
                            </div>
                            <button onClick={onClose} className="text-slate-600 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Textarea */}
                        <div className="bg-[#060b14] border border-white/[0.06] rounded-2xl p-4">
                            <textarea
                                autoFocus
                                value={idea}
                                onChange={(e) => setIdea(e.target.value)}
                                placeholder="Describe your startup idea or market you want to research..."
                                rows={4}
                                className="w-full bg-transparent border-0 outline-none text-white placeholder:text-slate-700 resize-none text-[15px] leading-relaxed"
                                onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handleSubmit(); }}
                            />
                        </div>

                        {/* Email */}
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email for report (optional)"
                            className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-700 outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
                        />

                        {/* Examples */}
                        <div className="flex flex-wrap gap-2">
                            {examples.map((ex) => (
                                <button key={ex} onClick={() => setIdea(ex)} className="text-xs px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-slate-600 hover:text-slate-300 hover:border-white/[0.12] transition-all">
                                    {ex}
                                </button>
                            ))}
                        </div>

                        {/* CTA */}
                        <button
                            onClick={handleSubmit}
                            disabled={!idea.trim() || loading}
                            className="w-full flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={15} />}
                            {loading ? "Launching fleet..." : "Launch Analyst Fleet"}
                        </button>

                        <p className="text-center text-slate-700 text-[11px]">⌘ + Enter to launch · Powered by Groq LLaMA 3.3 70B</p>
                    </div>
                </div>
            </div>
        </>
    );
}
