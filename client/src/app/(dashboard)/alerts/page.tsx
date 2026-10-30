"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ShieldAlert,
  Package,
  Layers,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  TrendingDown,
  Sparkles,
  Eye,
} from "lucide-react";
import { fetchApi } from "@/utils/api";
import { StockBadge } from "@/components/reuseable/stock-badge";
import { message, Modal, InputNumber, Input } from "antd";
import Cookies from "js-cookie";
import { useAuthService } from "@/hooks/auth";
import { useUserRole } from "@/context/role-context";

interface AlertProduct {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  quantity: number;
  lowStockThreshold: number;
  reorderLevel?: number;
  costPrice: number;
  sellingPrice: number;
  status: "low_stock" | "out_of_stock";
  deficit: number;
  urgency: "CRITICAL_OUT_OF_STOCK" | "LOW_STOCK_WARNING";
  category?: {
    _id: string;
    name: string;
  };
}

interface AlertsResponse {
  totalAlerts: number;
  criticalCount: number;
  lowStockCount: number;
  data: AlertProduct[];
}

export default function StockAlertsPage() {
  const { user: currentUser } = useAuthService();
  const roleContext = useUserRole();
  const userRole = (roleContext?.role || currentUser?.role || (typeof window !== "undefined" ? Cookies.get("role") : "") || "").toLowerCase();
  const isEmployee = roleContext?.isEmployee ?? (userRole === "employee");

  const [alertsData, setAlertsData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"ALL" | "CRITICAL" | "LOW">("ALL");

  // Restock Modal State
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AlertProduct | null>(null);
  const [restockQty, setRestockQty] = useState<number>(20);
  const [restockNote, setRestockNote] = useState("");
  const [submittingRestock, setSubmittingRestock] = useState(false);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetchApi<AlertsResponse>("/analytics/low-stock-alerts");
      if (res?.data) {
        setAlertsData(res.data);
      }
    } catch (err: any) {
      message.error(err?.message || "Failed to load stock alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const openRestockModal = (product: AlertProduct) => {
    setSelectedProduct(product);
    // Prepopulate with deficit or default 25 units
    setRestockQty(product.deficit > 0 ? product.deficit + 10 : 25);
    setRestockNote(`Emergency restock PO to resolve ${product.urgency}`);
    setRestockModalOpen(true);
  };

  const handleRestockSubmit = async () => {
    if (!selectedProduct || restockQty <= 0) {
      message.error("Please enter a valid restock quantity");
      return;
    }

    try {
      setSubmittingRestock(true);
      await fetchApi("/stock-movements/adjust", {
        method: "POST",
        body: JSON.stringify({
          productId: selectedProduct._id,
          type: "IN",
          quantity: restockQty,
          reason: restockNote || `Restocked via Stock Alert Center`,
        }),
      });

      message.success(`Restocked ${restockQty} units of ${selectedProduct.name}`);
      setRestockModalOpen(false);
      loadAlerts();
    } catch (err: any) {
      message.error(err?.message || "Failed to record restock");
    } finally {
      setSubmittingRestock(false);
    }
  };

  const productsList = alertsData?.data || [];
  const filteredProducts = productsList.filter((item) => {
    if (filterTab === "CRITICAL") return item.urgency === "CRITICAL_OUT_OF_STOCK";
    if (filterTab === "LOW") return item.urgency === "LOW_STOCK_WARNING";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stock Health & Alerts</h1>
            {alertsData && alertsData.totalAlerts > 0 && (
              <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
                {alertsData.totalAlerts} Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Real-time replenishment monitoring for out-of-stock and low-stock items
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/ai-advisor"
            className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-[#0F42C0] transition hover:bg-blue-100 shadow-sm cursor-pointer"
          >
            <Sparkles className="h-4 w-4" /> View AI Reorder Advisor
          </Link>
          <button
            onClick={loadAlerts}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 shadow-sm cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#0F42C0]" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Overview Widgets */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Attention Needed</span>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {alertsData?.totalAlerts ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-400">Items below replenishment point</p>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-xs font-semibold">Critical (Zero Stock)</span>
            <ShieldAlert className="h-5 w-5 text-rose-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-rose-600">
            {alertsData?.criticalCount ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-500">Immediate stockout causing lost sales</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-semibold">Low Stock Warning</span>
            <TrendingDown className="h-5 w-5 text-amber-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {alertsData?.lowStockCount ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-500">Below safety reorder threshold</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setFilterTab("ALL")}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
            filterTab === "ALL"
              ? "bg-[#0F42C0] text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          }`}
        >
          All Alerts ({alertsData?.totalAlerts ?? 0})
        </button>
        <button
          onClick={() => setFilterTab("CRITICAL")}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
            filterTab === "CRITICAL"
              ? "bg-rose-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          }`}
        >
          Critical Stockouts ({alertsData?.criticalCount ?? 0})
        </button>
        <button
          onClick={() => setFilterTab("LOW")}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
            filterTab === "LOW"
              ? "bg-amber-500 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          }`}
        >
          Low Stock Warning ({alertsData?.lowStockCount ?? 0})
        </button>
      </div>

      {/* Alerts Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F42C0] border-t-transparent" />
              <p className="text-xs text-slate-500">Auditing warehouse stock levels...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 mb-3" />
            <h3 className="text-base font-bold text-slate-900">All Stock Levels Healthy!</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              No products are currently out of stock or below their configured safety thresholds.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3.5 pl-6 font-semibold">Product Name</th>
                  <th className="py-3.5 font-semibold">SKU</th>
                  <th className="py-3.5 font-semibold">Category</th>
                  <th className="py-3.5 text-center font-semibold">Current Stock</th>
                  <th className="py-3.5 text-center font-semibold">Reorder Point</th>
                  <th className="py-3.5 text-center font-semibold">Deficit</th>
                  <th className="py-3.5 font-semibold">Urgency</th>
                  <th className="py-3.5 pr-6 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isCritical = p.quantity === 0;
                  const threshold = p.lowStockThreshold || p.reorderLevel || 10;
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 pl-6">
                        <Link
                          href={`/products/${p._id}`}
                          className="font-bold text-slate-900 hover:text-[#0F42C0] transition cursor-pointer"
                        >
                          {p.name}
                        </Link>
                      </td>

                      <td className="py-3.5 font-mono text-slate-500">{p.sku}</td>

                      <td className="py-3.5 text-slate-600">
                        {p.category?.name || "General"}
                      </td>

                      <td className="py-3.5 text-center">
                        <span
                          className={`font-mono text-sm font-black ${
                            isCritical ? "text-rose-600" : "text-amber-600"
                          }`}
                        >
                          {p.quantity}
                        </span>
                      </td>

                      <td className="py-3.5 text-center font-mono text-slate-500">
                        {threshold}
                      </td>

                      <td className="py-3.5 text-center">
                        <span className="font-mono font-semibold text-rose-600">
                          +{Math.max(0, threshold - p.quantity)} needed
                        </span>
                      </td>

                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[11px] font-bold border ${
                            isCritical
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {isCritical ? (
                            <ShieldAlert className="h-3 w-3" />
                          ) : (
                            <AlertTriangle className="h-3 w-3" />
                          )}
                          {isCritical ? "OUT OF STOCK" : "LOW STOCK"}
                        </span>
                      </td>

                      <td className="py-3.5 pr-6 text-right">
                        {isEmployee ? (
                          <Link
                            href={`/products/${p._id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#0F42C0] hover:border-[#0F42C0] transition shadow-sm cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" /> View SKU
                          </Link>
                        ) : (
                          <button
                            onClick={() => openRestockModal(p)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F42C0] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-[#0F42C0]/20 hover:bg-[#0C369E] transition cursor-pointer"
                          >
                            <PlusCircle className="h-3.5 w-3.5" /> Restock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Restock Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <PlusCircle className="h-5 w-5 text-[#0F42C0]" />
            <span>Restock Inventory — {selectedProduct?.name}</span>
          </div>
        }
        open={restockModalOpen}
        onCancel={() => setRestockModalOpen(false)}
        onOk={handleRestockSubmit}
        confirmLoading={submittingRestock}
        okText="Confirm Restock (+)"
        cancelText="Cancel"
        okButtonProps={{ className: "bg-[#0F42C0] hover:bg-[#0C369E]" }}
      >
        {selectedProduct && (
          <div className="space-y-4 pt-4 text-sm text-slate-700">
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Current Warehouse Stock:</span>
                <span className="font-bold text-slate-900">{selectedProduct.quantity} units</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Target Safety Threshold:</span>
                <span className="font-bold text-amber-600">
                  {selectedProduct.lowStockThreshold || selectedProduct.reorderLevel || 10} units
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Restock Units to Receive
              </label>
              <InputNumber
                min={1}
                value={restockQty}
                onChange={(val) => setRestockQty(val || 1)}
                className="w-full"
              />
              <p className="mt-1 text-xs text-slate-500">
                New stock level will be:{" "}
                <span className="font-bold text-emerald-600">
                  {selectedProduct.quantity + restockQty} units
                </span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Receipt / Purchase Order Note
              </label>
              <Input.TextArea
                rows={2}
                value={restockNote}
                onChange={(e) => setRestockNote(e.target.value)}
                placeholder="e.g. Supplier PO-1293 receipt"
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
