"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { ArrowLeft, Clock, FileText } from "lucide-react";
import Link from "next/link";
import ReportViewer from "@/app/components/ReportViewer";

export default function HistoryPage() {
    const [user, setUser] = useState<User | null>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<any | null>(null);

    const supabase = createClient();

    useEffect(() => {
        const fetchHistory = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setLoading(false);
                return;
            }
            setUser(session.user);

            const { data, error } = await supabase
                .from("reports_history")
                .select("*")
                .order("created_at", { ascending: false });

            if (!error && data) {
                setReports(data);
            }
            setLoading(false);
        };

        fetchHistory();
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center text-white">Loading...</div>;
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-4">
                <FileText size={48} className="text-slate-600 mb-4" />
                <h1 className="text-2xl font-bold text-white">Authentication Required</h1>
                <p>You must be signed in to view your report history.</p>
                <Link href="/" className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors">
                    Return Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0b0e14] text-[#f8fafc]">
            <header className="w-full border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center gap-4">
                    <Link href="/" className="text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-xl font-bold text-white">My Generated Reports</h1>
                </div>
            </header>

            <main className="p-4 md:p-8 max-w-7xl mx-auto h-[calc(100vh-64px)] overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
                    {/* Sidebar / List */}
                    <div className="md:col-span-4 lg:col-span-3 glass rounded-2xl p-4 overflow-y-auto h-full border border-white/10">
                        {reports.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center space-y-3 p-4">
                                <Clock size={32} />
                                <p>No reports generated yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {reports.map((report) => (
                                    <button
                                        key={report.id}
                                        onClick={() => setSelectedReport(report)}
                                        className={`w-full text-left p-4 rounded-xl transition-all border ${
                                            selectedReport?.id === report.id 
                                                ? "bg-blue-600/20 border-blue-500/50 text-white" 
                                                : "bg-slate-800/50 hover:bg-slate-800 border-white/5 text-slate-300"
                                        }`}
                                    >
                                        <h3 className="font-semibold line-clamp-2">{report.idea}</h3>
                                        <p className="text-xs mt-2 opacity-60">
                                            {new Date(report.created_at).toLocaleDateString()}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Report Content Panel */}
                    <div className="md:col-span-8 lg:col-span-9 glass rounded-2xl p-6 h-full overflow-y-auto border border-white/10">
                        {selectedReport ? (
                            <ReportViewer data={selectedReport.report_json} idea={selectedReport.idea} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center space-y-4">
                                <FileText size={48} className="text-slate-700" />
                                <h2 className="text-xl">Select a report to view details</h2>
                                <p className="max-w-md">Your previously generated business plans and research data will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
