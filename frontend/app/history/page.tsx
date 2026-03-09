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
    
    // Pagination & CRUD State
    const [currentPage, setCurrentPage] = useState(1);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editIdeaTitle, setEditIdeaTitle] = useState("");
    const ITEMS_PER_PAGE = 8;

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

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this report?")) return;

        const { error } = await supabase.from("reports_history").delete().eq("id", id);
        if (!error) {
            setReports((prev) => prev.filter((r) => r.id !== id));
            if (selectedReport?.id === id) setSelectedReport(null);
        } else {
            alert("Failed to delete report.");
        }
    };

    const handleEditSave = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!editIdeaTitle.trim()) return;

        const { error } = await supabase
            .from("reports_history")
            .update({ idea: editIdeaTitle })
            .eq("id", id);

        if (!error) {
            setReports((prev) => prev.map((r) => r.id === id ? { ...r, idea: editIdeaTitle } : r));
            if (selectedReport?.id === id) {
                setSelectedReport({ ...selectedReport, idea: editIdeaTitle });
            }
            setEditingId(null);
        } else {
            alert("Failed to update title.");
        }
    };

    // Calculate pagination slices
    const totalPages = Math.ceil(reports.length / ITEMS_PER_PAGE);
    const paginatedReports = reports.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

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
                    <div className="md:col-span-4 lg:col-span-3 glass rounded-2xl flex flex-col overflow-hidden border border-white/10 h-full">
                        <div className="p-4 border-b border-white/5 font-semibold text-slate-300">
                            Saved Reports ({reports.length})
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4">
                            {reports.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center space-y-3">
                                    <Clock size={32} />
                                    <p>No reports generated yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {paginatedReports.map((report) => (
                                        <div
                                            key={report.id}
                                            onClick={() => setSelectedReport(report)}
                                            className={`w-full text-left p-4 rounded-xl transition-all border cursor-pointer group ${
                                                selectedReport?.id === report.id 
                                                    ? "bg-blue-600/20 border-blue-500/50 text-white" 
                                                    : "bg-slate-800/50 hover:bg-slate-800 border-white/5 text-slate-300"
                                            }`}
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                {editingId === report.id ? (
                                                    <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                                                        <input 
                                                            type="text" 
                                                            value={editIdeaTitle}
                                                            onChange={(e) => setEditIdeaTitle(e.target.value)}
                                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white mb-2"
                                                            autoFocus
                                                        />
                                                        <div className="flex gap-2">
                                                            <button onClick={(e) => handleEditSave(e, report.id)} className="text-xs bg-emerald-600 px-2 py-1 rounded">Save</button>
                                                            <button onClick={() => setEditingId(null)} className="text-xs bg-slate-700 px-2 py-1 rounded">Cancel</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <h3 className="font-semibold line-clamp-2 flex-1">{report.idea}</h3>
                                                )}
                                                
                                                {editingId !== report.id && (
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setEditingId(report.id); setEditIdeaTitle(report.idea); }}
                                                            className="text-xs text-blue-400 hover:text-blue-300 px-1"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            onClick={(e) => handleDelete(e, report.id)}
                                                            className="text-xs text-red-400 hover:text-red-300 px-1"
                                                        >
                                                            Del
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs mt-2 opacity-60">
                                                {new Date(report.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-white/5 flex items-center justify-between bg-slate-900/50">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-xs bg-slate-800 rounded disabled:opacity-50 text-slate-300"
                                >
                                    Prev
                                </button>
                                <span className="text-xs text-slate-400">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 text-xs bg-slate-800 rounded disabled:opacity-50 text-slate-300"
                                >
                                    Next
                                </button>
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
