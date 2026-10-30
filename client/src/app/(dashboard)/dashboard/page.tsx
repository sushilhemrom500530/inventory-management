"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  Coins,
  ShoppingCart,
  Plus,
  Sparkles,
  ArrowRight,
  Eye,
  RefreshCw,
  Printer,
  CheckCircle2,
} from "lucide-react";
import { apiClient } from "@/utils/api";
import StockBadge from "@/components/reuseable/stock-badge";
import { Modal } from "antd";
import Cookies from "js-cookie";
import { useAuthService } from "@/hooks/auth";
import { useUserRole } from "@/context/role-context";

export default function DashboardPage() {
  const { user: currentUser } = useAuthService();
  const roleContext = useUserRole();
  const userRole = (roleContext?.role || currentUser?.role || (typeof window !== "undefined" ? Cookies.get("role") : "") || "").toLowerCase();
  const isEmployee = roleContext?.isEmployee ?? (userRole === "employee");

  const [days, setDays] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [selectedSale, setSelectedSale] = useState<any>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, salesRes] = await Promise.all([
        apiClient(`/dashboard/summary?days=${days}`),
        apiClient(`/sales/recent?limit=5`),
      ]);

      if (overviewRes?.success) {
        setData(overviewRes.data);
      }
      if (salesRes?.success) {
        setRecentSales(salesRes.data || []);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const kpis = data?.kpis || {
    totalProducts: 0,
    totalUnits: 0,
    totalInventoryValue: 0,
    totalRetailValue: 0,
    periodRevenue: 0,
    periodSalesCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    inStockCount: 0,
  };

  const salesTrends = data?.salesTrends || [];
  const maxRevenue = Math.max(...salesTrends.map((s: any) => s.revenue), 100);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Inventory & Sales Command Center
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time stock levels, liquidity valuation, and velocity analytics
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date range toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setDays(7)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${days === 7 ? "bg-[#0F42C0] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDays(30)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${days === 30 ? "bg-[#0F42C0] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setDays(90)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${days === 90 ? "bg-[#0F42C0] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
            >
              90 Days
            </button>
          </div>

          <button
            onClick={() => fetchDashboardData()}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-[#0F42C0] hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-[#0F42C0]" : ""} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Card 1: Total Revenue */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Period Revenue
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0F42C0]">
              <Coins size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900">
              ${kpis.periodRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-emerald-600">
                {kpis.periodSalesCount} Orders
              </span>
              <span>in last {days} days</span>
            </div>
          </div>
        </div>

        {/* Card 2: Inventory Value */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Inventory Cost Basis
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Package size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900">
              ${kpis.totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                {kpis.totalUnits.toLocaleString()} units
              </span>
              <span>across {kpis.totalProducts} SKUs</span>
            </div>
          </div>
        </div>

        {/* Card 3: Healthy In-Stock */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              In-Stock SKUs
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-extrabold text-emerald-600">
              {kpis.inStockCount}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span>Retail Value:</span>
              <span className="font-semibold text-slate-700">
                ${kpis.totalRetailValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Critical Attention Needed */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Stock Warnings
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-extrabold text-amber-800">
              {kpis.lowStockCount + kpis.outOfStockCount}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-amber-800">
              <span className="font-semibold text-rose-600">
                {kpis.outOfStockCount} Out of Stock
              </span>
              <span>•</span>
              <span className="font-semibold text-amber-700">
                {kpis.lowStockCount} Low
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Quick Action Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Velocity Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Revenue Velocity & Sales Volume
              </h3>
              <p className="text-xs text-slate-500">
                Daily recorded transaction totals for past {days} days
              </p>
            </div>
            {isEmployee ? (
              <Link
                href="/sales"
                className="text-xs font-semibold text-[#0F42C0] hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                <span>View Sales History</span>
                <ArrowRight size={13} />
              </Link>
            ) : (
              <Link
                href="/reports"
                className="text-xs font-semibold text-[#0F42C0] hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                <span>View Financial Ledger</span>
                <ArrowRight size={13} />
              </Link>
            )}
          </div>

          {/* SVG Bar Visualizer */}
          {salesTrends.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <p className="text-sm font-medium">No sales recorded during this timeframe.</p>
              <Link
                href="/sales/checkout"
                className="mt-3 px-4 py-2 rounded-xl bg-[#0F42C0] text-white text-xs font-semibold hover:bg-[#0C369E] transition-colors"
              >
                Create First Sale
              </Link>
            </div>
          ) : (
            <div className="pt-6">
              <div className="h-56 flex items-end gap-1.5 sm:gap-2">
                {salesTrends.map((point: any, idx: number) => {
                  const barHeight = Math.max(8, Math.round((point.revenue / maxRevenue) * 100));
                  return (
                    <div
                      key={idx}
                      className="group relative flex-1 flex flex-col items-center h-full justify-end cursor-pointer"
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-12 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                        <div className="bg-slate-900 text-white text-[10px] font-semibold rounded-lg px-2 py-1 shadow-lg whitespace-nowrap">
                          <span>${point.revenue.toFixed(2)}</span>
                          <span className="text-slate-400 ml-1">({point.orders} sales)</span>
                        </div>
                      </div>

                      {/* Bar */}
                      <div
                        style={{ height: `${barHeight}%` }}
                        className="w-full rounded-t-md bg-[#0F42C0] transition-all group-hover:bg-[#0C369E]"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 pt-3 border-t border-slate-100 font-mono">
                <span>{salesTrends[0]?.date}</span>
                <span>{salesTrends[Math.floor(salesTrends.length / 2)]?.date}</span>
                <span>{salesTrends[salesTrends.length - 1]?.date}</span>
              </div>
            </div>
          )}
        </div>

        {/* AI Quick Actions & System Shortcuts */}
        <div className="space-y-6">
          {/* Feature Callout: Cashier POS for Employee, AI Advisor for Admin/Manager */}
          {isEmployee ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F42C0] text-white">
                  <ShoppingCart size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Cashier POS Terminal</h4>
                  <p className="text-[11px] text-slate-500">Retail Barcode & Instant Checkout</p>
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Process customer orders quickly with real-time stock deductions, auto-calculated tax, item discounts, and instant receipt generation.
              </p>

              <div className="mt-4 pt-3 border-t border-blue-200/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Ready to serve
                </span>
                <Link
                  href="/sales/checkout"
                  className="px-3 py-1.5 rounded-lg bg-[#0F42C0] text-white text-xs font-semibold hover:bg-[#0C369E] transition-all flex items-center gap-1 shadow-sm"
                >
                  <span>Open POS</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F42C0] text-white">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">AI Stock Advisor</h4>
                  <p className="text-[11px] text-slate-500">Python FastAPI Demand Intelligence</p>
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Demand velocity algorithms estimate days until stockout and recommend purchase quantities before stock is depleted.
              </p>

              <div className="mt-4 pt-3 border-t border-blue-200/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  {kpis.lowStockCount + kpis.outOfStockCount > 0
                    ? `${kpis.lowStockCount + kpis.outOfStockCount} items need attention`
                    : "All inventory healthy"}
                </span>
                <Link
                  href="/ai-advisor"
                  className="px-3 py-1.5 rounded-lg bg-[#0F42C0] text-white text-xs font-semibold hover:bg-[#0C369E] transition-all flex items-center gap-1 shadow-sm"
                >
                  <span>Open Advisor</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          )}

          {/* Quick Shortcuts */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Quick Operations
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/sales/checkout"
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all text-center group cursor-pointer"
              >
                <ShoppingCart size={20} className="text-[#0F42C0] mb-1.5" />
                <span className="text-xs font-bold text-slate-900 group-hover:text-[#0F42C0]">
                  Record Sale
                </span>
                <span className="text-[10px] text-slate-500">POS Checkout</span>
              </Link>

              {isEmployee ? (
                <Link
                  href="/products"
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all text-center group cursor-pointer"
                >
                  <Package size={20} className="text-[#0F42C0] mb-1.5" />
                  <span className="text-xs font-bold text-slate-900 group-hover:text-[#0F42C0]">
                    View Catalog
                  </span>
                  <span className="text-[10px] text-slate-500">Inventory</span>
                </Link>
              ) : (
                <Link
                  href="/products/new"
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all text-center group cursor-pointer"
                >
                  <Plus size={20} className="text-[#0F42C0] mb-1.5" />
                  <span className="text-xs font-bold text-slate-900 group-hover:text-[#0F42C0]">
                    Add Product
                  </span>
                  <span className="text-[10px] text-slate-500">Create SKU</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sales Ledger Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
            <p className="text-xs text-slate-500">
              Real-time checkout records processed through Point of Sale
            </p>
          </div>
          <Link
            href="/sales"
            className="text-xs font-semibold text-[#0F42C0] hover:underline flex items-center gap-1"
          >
            <span>View All Sales</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {recentSales.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No recent transactions found. Complete a sale to see transaction activity.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Invoice #</th>
                  <th className="py-3 px-5">Customer</th>
                  <th className="py-3 px-5">Items</th>
                  <th className="py-3 px-5">Method</th>
                  <th className="py-3 px-5">Total</th>
                  <th className="py-3 px-5">Timestamp</th>
                  <th className="py-3 px-5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSales.map((sale: any) => (
                  <tr key={sale._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-5 font-mono font-bold text-slate-900">
                      <Link href={`/sales/${sale._id}`} className="hover:text-[#0F42C0]">
                        {sale.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-5 font-semibold text-slate-900">
                      {sale.customerName || "Walk-in Customer"}
                    </td>
                    <td className="py-3 px-5 text-slate-600">
                      {sale.items?.length || 0} items
                    </td>
                    <td className="py-3 px-5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {sale.paymentMethod || "cash"}
                      </span>
                    </td>
                    <td className="py-3 px-5 font-mono font-bold text-slate-900">
                      ${sale.total?.toFixed(2) || "0.00"}
                    </td>
                    <td className="py-3 px-5 text-slate-500">
                      {new Date(sale.createdAt).toLocaleDateString()} at{" "}
                      {new Date(sale.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#0F42C0] hover:border-[#0F42C0] transition-colors cursor-pointer"
                        title="View Receipt"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      <Modal
        open={Boolean(selectedSale)}
        onCancel={() => setSelectedSale(null)}
        footer={null}
        width={420}
        centered
      >
        {selectedSale && (
          <div className="p-2 text-slate-900">
            {/* Receipt Header */}
            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                STOCKWISE
              </h2>
              <p className="text-xs text-slate-500">Smart Retail & Inventory Management</p>
              <div className="mt-2 text-[11px] font-mono text-slate-600">
                <span>Invoice: {selectedSale.invoiceNumber}</span>
                <br />
                <span>{new Date(selectedSale.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Customer & Cashier */}
            <div className="py-3 border-b border-dashed border-slate-300 text-xs text-slate-700 space-y-1">
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-semibold text-slate-900">{selectedSale.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="font-semibold uppercase text-slate-900">{selectedSale.paymentMethod}</span>
              </div>
            </div>

            {/* Items */}
            <div className="py-3 border-b border-dashed border-slate-300">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200">
                    <th className="text-left pb-1 font-medium">Item</th>
                    <th className="text-center pb-1 font-medium">Qty</th>
                    <th className="text-right pb-1 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedSale.items?.map((it: any, i: number) => (
                    <tr key={i} className="text-slate-800">
                      <td className="py-1 max-w-[150px] truncate">{it.name || "Product"}</td>
                      <td className="py-1 text-center font-mono">{it.quantity}</td>
                      <td className="py-1 text-right font-mono font-semibold">
                        ${(it.subtotal || it.price * it.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Totals */}
            <div className="py-3 space-y-1 text-xs border-b border-dashed border-slate-300">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>${selectedSale.subtotal?.toFixed(2)}</span>
              </div>
              {selectedSale.tax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax ({selectedSale.taxRate || 0}%)</span>
                  <span>${selectedSale.tax?.toFixed(2)}</span>
                </div>
              )}
              {selectedSale.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-${selectedSale.discount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1">
                <span>Grand Total</span>
                <span>${selectedSale.total?.toFixed(2)}</span>
              </div>
            </div>

            <p className="mt-4 text-center text-[11px] text-slate-400">
              Thank you for shopping with us!
            </p>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F42C0] text-white text-xs font-semibold hover:bg-[#0C369E] transition-colors cursor-pointer"
              >
                <Printer size={14} />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
