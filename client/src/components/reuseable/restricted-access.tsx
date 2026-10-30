"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ShoppingCart, LayoutDashboard, ArrowLeft, Package } from "lucide-react";

interface RestrictedAccessProps {
  title?: string;
  description?: string;
  featureName?: string;
}

export default function RestrictedAccess({
  title = "Management Authorization Required",
  description,
  featureName = "This feature",
}: RestrictedAccessProps) {
  const defaultDesc =
    description ||
    `${featureName} is restricted to Store Managers and Administrators. As an Employee, your access is focused on Point of Sale (POS) checkout, product inventory lookup, and order recording.`;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <ShieldAlert size={32} />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
            Role Restricted • Employee
          </span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            {defaultDesc}
          </p>
        </div>

        <div className="pt-2 space-y-2">
          <Link
            href="/sales/checkout"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F42C0] text-white text-xs font-semibold hover:bg-[#0C369E] shadow-sm transition-all cursor-pointer"
          >
            <ShoppingCart size={15} />
            <span>Open POS Terminal</span>
          </Link>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <LayoutDashboard size={14} />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Package size={14} />
              <span>Products</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
