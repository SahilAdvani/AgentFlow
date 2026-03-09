import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/styles/global.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "AI Startup Research Command Center",
    description: "Multi-agent AI dashboard for startup research",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <div className="min-h-screen bg-[#0b0e14] text-[#f8fafc]">
                    {children}
                    <ToastContainer theme="dark" position="bottom-right" />
                </div>
            </body>
        </html>
    );
}
