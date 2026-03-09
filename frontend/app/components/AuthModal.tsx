"use client";

import { useState } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { X, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: { isOpen: boolean, onClose: () => void, onAuthSuccess: (user: any) => void }) {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const supabase = createClient();

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/`,
            },
        });

        if (error) {
            toast.error(error.message);
        } else {
            setIsSent(true);
            toast.success("Magic link sent! Check your email.");
        }
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-bold text-white mb-2">Sign In to Save History</h2>
                <p className="text-slate-400 text-sm mb-6">
                    Authenticate to keep a permanent record of your AI-generated startup research reports.
                </p>

                {isSent ? (
                    <div className="flex flex-col items-center justify-center p-6 bg-slate-800/50 border border-slate-700 rounded-xl space-y-4 text-center">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="text-emerald-400" size={24} />
                        </div>
                        <div>
                            <p className="text-white font-medium">Check your inbox</p>
                            <p className="text-slate-400 text-sm mt-1">We sent a secure magic link to {email}.</p>
                        </div>
                        <button
                            onClick={() => setIsSent(false)}
                            className="text-blue-400 text-sm hover:underline mt-2"
                        >
                            Try another email
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="founder@startup.com"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !email}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isLoading ? "Sending..." : "Send Magic Link"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
