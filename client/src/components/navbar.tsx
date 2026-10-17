"use client";

import React from "react";
import Link from "next/link";
import { Layers, ArrowRight, LayoutDashboard, ShoppingCart } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F42C0] text-white shadow-sm shadow-[#0F42C0]/20">
            <Layers className="h-5 w-5" />
          </div>
          <span className="text-lg font-black tracking-tight text-slate-900">
            STOCKWISE
          </span>
        </Link>

        {/* Quick Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-[#0F42C0] transition">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link href="/products" className="hover:text-[#0F42C0] transition">
            Products & Inventory
          </Link>
          <Link href="/sales/checkout" className="flex items-center gap-1.5 hover:text-[#0F42C0] transition">
            <ShoppingCart className="h-4 w-4" /> POS Terminal
          </Link>
          <Link href="/ai-advisor" className="hover:text-[#0F42C0] transition">
            AI Demand Forecast
          </Link>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl bg-[#0F42C0] px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-[#0F42C0]/20 hover:bg-[#0C369E] transition"
          >
            Dashboard <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}