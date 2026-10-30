import React from "react";
import Link from "next/link";
import {
  Layers,
  ArrowRight,
  Sparkles,
  ShoppingCart,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Package,
  Zap,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative min-h-[85vh] flex flex-col items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-4xl text-center space-y-8">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-[#0F42C0]">
          <Sparkles className="h-3.5 w-3.5" />
          <span>StockWise 2.0 — Powered by Python FastAPI ML Forecasting</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]">
          Smart Inventory & POS <br />
          <span className="text-[#0F42C0]">Engineered for Velocity</span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-600 leading-relaxed">
          Manage omnichannel stock across warehouses, prevent stockouts with predictive machine learning,
          and ring up customer purchases in milliseconds with atomic concurrency guards.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-2xl bg-[#0F42C0] px-7 py-3.5 text-sm font-bold text-white shadow-sm shadow-[#0F42C0]/25 transition hover:bg-[#0C369E] cursor-pointer"
          >
            Launch Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/sales/checkout"
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50 cursor-pointer"
          >
            <ShoppingCart className="h-4 w-4 text-[#0F42C0]" /> Open POS Register
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3 text-left">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0F42C0] mb-3">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Atomic Concurrency</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Safe inventory decrementing ensures zero overselling, even during peak flash sales.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0F42C0] mb-3">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">FastAPI Demand ML</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Python microservice forecasts 7-day velocity and suggests optimal purchase order quantities.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0F42C0] mb-3">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Immutable Audit Trail</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Every shipment, sale, return, and count adjustment is recorded with user attribution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}