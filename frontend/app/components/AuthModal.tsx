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

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/`,
            },
        });

        if (error) {
            toast.error(error.message);
            setIsLoading(false);
        }
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
                    <>
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

                        <div className="mt-6 flex items-center justify-between">
                            <span className="w-1/5 border-b border-slate-700 lg:w-1/4"></span>
                            <span className="text-xs text-center text-slate-500 uppercase">or continue with</span>
                            <span className="w-1/5 border-b border-slate-700 lg:w-1/4"></span>
                        </div>

                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-white hover:bg-slate-100 text-slate-900 font-medium rounded-lg shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Google
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
