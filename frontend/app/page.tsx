"use client";

import { useState, useEffect } from "react";
import Dashboard from "@/app/components/Dashboard";
import AuthModal from "@/app/components/AuthModal";
import CustomAgentBuilder from "@/app/components/CustomAgentBuilder";
import { createClient } from "@/app/lib/supabase/client";
import { LogOut, History, UserCircle2 } from "lucide-react";
import Link from "next/link";

export default function Home() {
    const [session, setSession] = useState<{ id: string; idea: string; modelType?: "default" | "custom" } | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [globalModelType, setGlobalModelType] = useState<"default" | "custom">("default");
    
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
        };
        checkUser();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event: string, session: any) => {
                setUser(session?.user || null);
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const handleStartAnalysis = async (idea: string, email?: string, modelType: "default" | "custom" = "default", nodes?: any[], edges?: any[]) => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
            const endpoint = modelType === "custom" ? "/analyze/custom" : "/analyze";
            const resp = await fetch(`${baseUrl}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idea, email, user_id: user?.id, nodes, edges }),
            });
            const data = await resp.json();
            
            // Note: the backend stream also changes for custom, so we need to pass modelType to Dashboard if we want to stream from the custom route. 
            // We can embed it in the session object.
            setSession({ id: data.session_id, idea, modelType });
        } catch (err) {
            console.error("Failed to start analysis", err);
        }
    };

    const handleCustomLaunch = (nodes: any[], edges: any[]) => {
        // Extract the main idea from the Input node
        const inputNode = nodes.find(n => n.id === 'input');
        const idea = inputNode ? inputNode.data.instructions : "Custom Agent Pipeline";
        handleStartAnalysis(idea, undefined, "custom", nodes, edges);
    };

    return (
        <div className="min-h-screen bg-[#0b0e14] text-[#f8fafc] flex flex-col">
            {/* Header Navigation */}
            <header className="w-full border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg">
                            AF
                        </div>
                        <span className="font-semibold text-white tracking-wide">AgentFlow</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <Link href="/history" className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5">
                                    <History size={16} />
                                    <span className="hidden sm:inline">My Reports</span>
                                </Link>
                                <div className="h-4 w-px bg-white/10 mx-1"></div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-slate-400 hidden sm:inline">{user.email}</span>
                                    <button
                                        onClick={handleSignOut}
                                        className="text-slate-400 hover:text-red-400 transition-colors"
                                        title="Sign Out"
                                    >
                                        <LogOut size={18} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <Link
                                href="/auth"
                                className="text-sm font-medium bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                            >
                                <UserCircle2 size={16} />
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {!session ? (
                    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8">
                        <div className="space-y-4">
                            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
                                AI Startup Command Center
                            </h1>
                            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
                                Deploy a team of AI agents to research your startup idea, analyze markets, and identify competitors in real-time.
                            </p>
                        </div>

                    <div className="flex gap-4 p-1 bg-[#0f172a] rounded-xl border border-slate-800 max-w-sm mx-auto mb-8">
                        <button
                            onClick={() => setGlobalModelType("default")}
                            className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${
                                globalModelType === "default" 
                                    ? "bg-slate-800 text-white shadow-md" 
                                    : "text-slate-400 hover:text-slate-300 hover:bg-white/5"
                            }`}
                        >
                            Default Model
                        </button>
                        <button
                            onClick={() => setGlobalModelType("custom")}
                            className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${
                                globalModelType === "custom" 
                                    ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md" 
                                    : "text-slate-400 hover:text-slate-300 hover:bg-white/5"
                            }`}
                        >
                            Custom Builder
                        </button>
                    </div>

                    {globalModelType === "default" ? (
                        <StartupInput 
                            onStart={handleStartAnalysis} 
                        />
                    ) : (
                        <div className="w-full max-w-6xl mx-auto space-y-4">
                            <CustomAgentBuilder onLaunch={handleCustomLaunch} />
                        </div>
                    )}
                </div>
            ) : (
                <Dashboard session={session} onBack={() => setSession(null)} />
            )}
            </main>
        </div>
    );
}

function StartupInput({ 
    onStart, 
}: { 
    onStart: (idea: string, email?: string, modelType?: "default" | "custom") => void,
}) {
    const [idea, setIdea] = useState("");
    const [email, setEmail] = useState("");

    return (
        <div className="glass p-8 rounded-2xl w-full max-w-xl space-y-6 shadow-2xl border border-white/10 mx-auto">
            <div className="space-y-2 text-left">
                <label className="text-sm font-medium text-slate-400">Startup Idea / Goal</label>
                <textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="e.g. A platform for AI-powered personalized study plans for college students..."
                    className="w-full h-32 bg-[#0f172a] border border-slate-800 rounded-xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
            </div>

            <div className="space-y-2 text-left">
                <label className="text-sm font-medium text-slate-400">Email for Report (Optional)</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-[#0f172a] border border-slate-800 rounded-xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
            </div>

            <button
                onClick={() => onStart(idea, email, "default")}
                disabled={!idea}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Launch Agent Fleet
            </button>
        </div>
    );
}
