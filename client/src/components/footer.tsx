import React from "react";
import Link from "next/link";
import { Layers } from "lucide-react";

export default function Footer() {
    return (
        <footer
            suppressHydrationWarning
            className="border-t border-slate-200 bg-white py-12 text-slate-600"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0F42C0] text-white shadow-sm">
                            <Layers className="h-4 w-4" />
                        </div>
                        <span className="text-base font-black tracking-tight text-slate-900">
                            STOCKWISE
                        </span>
                        <span className="text-xs text-slate-400 ml-2">Smart Inventory & POS System</span>
                    </div>

                    <div className="flex items-center gap-6 text-xs font-semibold text-slate-500">
                        <Link href="/dashboard" className="hover:text-[#0F42C0] transition cursor-pointer">
                            Dashboard
                        </Link>
                        <Link href="/products" className="hover:text-[#0F42C0] transition cursor-pointer">
                            Products
                        </Link>
                        <Link href="/sales/checkout" className="hover:text-[#0F42C0] transition cursor-pointer">
                            POS Terminal
                        </Link>
                        <Link href="/ai-advisor" className="hover:text-[#0F42C0] transition cursor-pointer">
                            AI Forecast
                        </Link>
                        <Link href="/reports" className="hover:text-[#0F42C0] transition cursor-pointer">
                            Analytics
                        </Link>
                    </div>
                </div>

                <div className="mt-8 border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                    <p>© 2026 StockWise Inc. All rights reserved.</p>
                    <p className="flex items-center gap-1 text-[11px]">
                        Engineered with Next.js, Node.js REST API & Python ML Microservice
                    </p>
                </div>
            </div>
        </footer>
    );
}