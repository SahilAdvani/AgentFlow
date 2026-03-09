"use client";

import { useState } from "react";
import Dashboard from "@/app/components/Dashboard";

export default function Home() {
    const [session, setSession] = useState<{ id: string; idea: string } | null>(null);

    const handleStartAnalysis = async (idea: string, email?: string) => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
            const resp = await fetch(`${baseUrl}/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idea, email }),
            });
            const data = await resp.json();
            setSession({ id: data.session_id, idea });
        } catch (err) {
            console.error("Failed to start analysis", err);
        }
    };

    return (
        <main className="p-4 md:p-8 max-w-7xl mx-auto">
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

                    <StartupInput onStart={handleStartAnalysis} />
                </div>
            ) : (
                <Dashboard session={session} onBack={() => setSession(null)} />
            )}
        </main>
    );
}

function StartupInput({ onStart }: { onStart: (idea: string, email?: string) => void }) {
    const [idea, setIdea] = useState("");
    const [email, setEmail] = useState("");

    return (
        <div className="glass p-8 rounded-2xl w-full max-w-xl space-y-6 shadow-2xl border border-white/10">
            <div className="space-y-2 text-left">
                <label className="text-sm font-medium text-slate-400">Startup Idea</label>
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
                onClick={() => onStart(idea, email)}
                disabled={!idea}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Launch Agent Fleet
            </button>
        </div>
    );
}
