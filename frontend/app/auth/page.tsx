"use client";

import { useState } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Mail, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

type AuthTab = "signin" | "signup";

export default function AuthPage() {
    const [tab, setTab] = useState<AuthTab>("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [magicLinkSent, setMagicLinkSent] = useState(false);
    const [authMode, setAuthMode] = useState<"password" | "magic">("password");

    const supabase = createClient();
    const router = useRouter();

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) toast.error(error.message);
    };

    const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Welcome back!");
            router.push("/");
        }
        setIsLoading(false);
    };

    const handleEmailPasswordSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Check your email to confirm your account!");
        }
        setIsLoading(false);
    };

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            toast.error(error.message);
        } else {
            setMagicLinkSent(true);
            toast.success("Magic link sent! Check your email.");
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background gradient effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Back to home */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm"
                >
                    <ArrowLeft size={16} />
                    Back to Home
                </Link>

                {/* Logo */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 text-sm">
                        AF
                    </div>
                    <span className="text-xl font-bold text-white tracking-wide">AgentFlow</span>
                </div>

                {/* Auth Card */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <h1 className="text-2xl font-bold text-white mb-1">
                        {tab === "signin" ? "Welcome back" : "Create an account"}
                    </h1>
                    <p className="text-slate-400 text-sm mb-6">
                        {tab === "signin"
                            ? "Sign in to access your research reports."
                            : "Start generating AI-powered startup analysis."}
                    </p>

                    {/* Tabs */}
                    <div className="flex bg-slate-800/60 rounded-lg p-1 mb-6">
                        <button
                            onClick={() => { setTab("signin"); setMagicLinkSent(false); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${tab === "signin"
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-slate-400 hover:text-slate-300"
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => { setTab("signup"); setMagicLinkSent(false); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${tab === "signup"
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-slate-400 hover:text-slate-300"
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Google OAuth */}
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-xl transition-all shadow-sm mb-4"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs text-slate-500 uppercase tracking-wider">or</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Magic Link Sent State */}
                    {magicLinkSent ? (
                        <div className="flex flex-col items-center justify-center p-6 bg-slate-800/50 border border-slate-700 rounded-xl space-y-4 text-center">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="text-emerald-400" size={24} />
                            </div>
                            <div>
                                <p className="text-white font-medium">Check your inbox</p>
                                <p className="text-slate-400 text-sm mt-1">We sent a magic link to {email}.</p>
                            </div>
                            <button
                                onClick={() => setMagicLinkSent(false)}
                                className="text-blue-400 text-sm hover:underline mt-2"
                            >
                                Try again
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Auth Mode Toggle (Sign In only) */}
                            {tab === "signin" && (
                                <div className="flex gap-2 mb-4">
                                    <button
                                        onClick={() => setAuthMode("password")}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${authMode === "password"
                                                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                                                : "text-slate-500 hover:text-slate-400 border border-transparent"
                                            }`}
                                    >
                                        Password
                                    </button>
                                    <button
                                        onClick={() => setAuthMode("magic")}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${authMode === "magic"
                                                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                                                : "text-slate-500 hover:text-slate-400 border border-transparent"
                                            }`}
                                    >
                                        Magic Link
                                    </button>
                                </div>
                            )}

                            <form
                                onSubmit={
                                    tab === "signup"
                                        ? handleEmailPasswordSignUp
                                        : authMode === "magic"
                                            ? handleMagicLink
                                            : handleEmailPasswordSignIn
                                }
                                className="space-y-4"
                            >
                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="founder@startup.com"
                                            className="w-full bg-slate-800/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all text-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password (only for password mode or sign up) */}
                                {(tab === "signup" || (tab === "signin" && authMode === "password")) && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-400">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full bg-slate-800/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all text-sm"
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading || !email}
                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                                >
                                    {isLoading
                                        ? "Processing..."
                                        : tab === "signup"
                                            ? "Create Account"
                                            : authMode === "magic"
                                                ? "Send Magic Link"
                                                : "Sign In"}
                                </button>
                            </form>
                        </>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-600 mt-6">
                    By continuing, you agree to AgentFlow&apos;s Terms of Service.
                </p>
            </div>
        </div>
    );
}
