"use client";

import { Check, Download, Mail, ExternalLink } from "lucide-react";

export default function ReportViewer({ data, idea }: { data: any, idea: string }) {
    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 max-h-[350px]">
                <Section title="Executive Summary" content={data.executive_summary} />
                <Section title="Startup Strategy" content={data.strategy} />
                <Section title="Market Outlook" content={data.market_analysis} />
            </div>

            <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
                <button
                    className="flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg"
                    onClick={() => {
                        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
                        window.open(`${baseUrl}/download/${idea}`, '_blank');
                    }}
                >
                    <Download size={14} />
                    Download PDF
                </button>
                <button
                    className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all"
                    onClick={() => alert("Report sent to email!")}
                >
                    <Mail size={14} />
                    Send Email
                </button>
            </div>
        </div>
    );
}

function Section({ title, content }: { title: string, content: string }) {
    return (
        <div className="space-y-1">
            <h4 className="text-[10px] uppercase font-bold text-blue-400 flex items-center gap-1">
                <Check size={10} />
                {title}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
                {content}
            </p>
        </div>
    );
}
