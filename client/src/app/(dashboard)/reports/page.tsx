"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  Calendar,
  Download,
  Printer,
  PieChart,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { fetchApi } from "@/utils/api";
import { message } from "antd";
import { useAuthService } from "@/hooks/auth";
import RestrictedAccess from "@/components/reuseable/restricted-access";
import { useUserRole } from "@/context/role-context";

interface AnalyticsOverview {
  kpis: {
    totalProducts: number;
    totalUnits: number;
    totalInventoryValue: number;
    totalRetailValue: number;
    potentialProfit: number;
    periodRevenue: number;
    periodSalesCount: number;
    inStockCount: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  salesTrends: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  categoryBreakdown: Array<{
    _id: string;
    name: string;
    productCount: number;
    totalStock: number;
    inventoryValue: number;
  }>;
}

export default function ReportsPage() {
  const { user: currentUser, loading: authLoading } = useAuthService();
  const roleContext = useUserRole();
  const userRole = (roleContext?.role || currentUser?.role || "").toLowerCase();
  const isEmployee = roleContext?.isEmployee ?? (userRole === "employee");

  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<number>(30);

  const loadReport = async () => {
    if (isEmployee) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetchApi<AnalyticsOverview>(`/analytics/summary?days=${period}`);
      if (res?.data) {
        setData(res.data);
      }
    } catch (err: any) {
      message.error(err?.message || "Failed to load analytics report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (isEmployee) {
        setLoading(false);
      } else {
        loadReport();
      }
    }
  }, [period, authLoading, isEmployee]);

  if (!authLoading && isEmployee) {
    return <RestrictedAccess featureName="Executive Reports & Financial Analytics" />;
  }

  const kpis = data?.kpis;
  const salesTrends = data?.salesTrends || [];
  const maxRevenue = Math.max(...salesTrends.map((s) => s.revenue), 100);

  const grossMargin =
    kpis && kpis.totalRetailValue > 0
      ? (((kpis.totalRetailValue - kpis.totalInventoryValue) / kpis.totalRetailValue) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Business Intelligence & Reports</h1>
          <p className="text-xs text-slate-500">
            Comprehensive financial reporting, sales velocity patterns, and inventory valuation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(parseInt(e.target.value))}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-[#0F42C0] focus:outline-none shadow-sm transition"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl bg-[#0F42C0] px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-[#0F42C0]/20 transition hover:bg-[#0C369E]"
          >
            <Printer className="h-4 w-4" /> Print Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F42C0] border-t-transparent" />
            <p className="text-sm text-slate-500">Aggregating transactional records...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Key Financial KPIs */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium">Period Revenue</span>
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                ${kpis?.periodRevenue.toFixed(2) ?? "0.00"}
              </p>
              <p className="mt-1 text-xs text-slate-400">{kpis?.periodSalesCount ?? 0} transactions recorded</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium">Inventory Cost Basis</span>
                <Package className="h-5 w-5 text-[#0F42C0]" />
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                ${kpis?.totalInventoryValue.toFixed(2) ?? "0.00"}
              </p>
              <p className="mt-1 text-xs text-slate-400">Across {kpis?.totalUnits ?? 0} total units in stock</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium">Retail Valuation</span>
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                ${kpis?.totalRetailValue.toFixed(2) ?? "0.00"}
              </p>
              <p className="mt-1 text-xs text-emerald-600 font-semibold">{grossMargin}% projected margin</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium">Unrealized Gross Profit</span>
                <ArrowUpRight className="h-5 w-5 text-purple-600" />
              </div>
              <p className="mt-2 text-3xl font-bold text-purple-700">
                ${kpis?.potentialProfit.toFixed(2) ?? "0.00"}
              </p>
              <p className="mt-1 text-xs text-slate-400">Upon 100% catalog liquidation</p>
            </div>
          </div>

          {/* Sales Revenue Trend Visualization */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0F42C0]">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Daily Revenue Trend</h3>
                  <p className="text-[11px] text-slate-500">Recorded revenue distribution over selected timeframe</p>
                </div>
              </div>
            </div>

            {salesTrends.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                No revenue recorded in this period.
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <div className="grid grid-cols-7 sm:grid-cols-14 md:grid-cols-28 gap-1.5 items-end h-44 pt-6">
                  {salesTrends.map((st, i) => {
                    const heightPercent = Math.max(8, Math.round((st.revenue / maxRevenue) * 100));
                    return (
                      <div
                        key={i}
                        className="group relative flex flex-col items-center h-full justify-end"
                      >
                        {/* Hover Tooltip */}
                        <div className="absolute -top-10 hidden group-hover:flex flex-col items-center rounded-lg bg-slate-900 px-2 py-1 text-[10px] text-white whitespace-nowrap shadow-xl z-20 border border-slate-800 pointer-events-none">
                          <span className="font-bold">${st.revenue.toFixed(2)}</span>
                          <span className="text-slate-300">{st.date} ({st.orders} orders)</span>
                        </div>

                        {/* Bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full rounded-t bg-[#0F42C0] transition-all hover:bg-[#0C369E]"
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-2 font-mono">
                  <span>{salesTrends[0]?.date}</span>
                  <span>{salesTrends[Math.floor(salesTrends.length / 2)]?.date}</span>
                  <span>{salesTrends[salesTrends.length - 1]?.date}</span>
                </div>
              </div>
            )}
          </div>

          {/* Category Valuation & Stock Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
                <Layers className="h-5 w-5 text-[#0F42C0]" />
                <h3 className="text-sm font-semibold text-slate-900">Category Valuation Breakdown</h3>
              </div>

              <div className="mt-4 space-y-3">
                {data?.categoryBreakdown.map((cat) => {
                  const percentOfTotal =
                    kpis && kpis.totalInventoryValue > 0
                      ? ((cat.inventoryValue / kpis.totalInventoryValue) * 100).toFixed(1)
                      : "0";

                  return (
                    <div key={cat._id} className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="font-semibold text-slate-900">{cat.name}</span>
                        <span className="font-mono font-bold text-slate-900">${cat.inventoryValue.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          style={{ width: `${percentOfTotal}%` }}
                          className="h-full bg-[#0F42C0] rounded-full"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
                        <span>{cat.productCount} SKUs ({cat.totalStock} units)</span>
                        <span>{percentOfTotal}% of total inventory</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inventory Health Ratio */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
                <PieChart className="h-5 w-5 text-[#0F42C0]" />
                <h3 className="text-sm font-semibold text-slate-900">Catalog Stock Health Distribution</h3>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4 border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-800">In Stock & Healthy</p>
                      <p className="text-[11px] text-emerald-600">Adequate inventory buffer</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-emerald-700 font-mono">
                    {kpis?.inStockCount ?? 0}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-amber-50 p-4 border border-amber-200">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-amber-600" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800">Low Stock Warning</p>
                      <p className="text-[11px] text-amber-600">At or below reorder threshold</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-amber-700 font-mono">
                    {kpis?.lowStockCount ?? 0}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-rose-50 p-4 border border-rose-200">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="h-6 w-6 text-rose-600" />
                    <div>
                      <p className="text-xs font-semibold text-rose-800">Out of Stock</p>
                      <p className="text-[11px] text-rose-600">Depleted inventory</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-rose-700 font-mono">
                    {kpis?.outOfStockCount ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
