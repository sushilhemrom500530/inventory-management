"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Package,
  Layers,
  DollarSign,
  RefreshCw,
  Clock,
  ArrowRight,
  PlusCircle,
  HelpCircle,
  Cpu,
} from "lucide-react";
import { fetchApi } from "@/utils/api";
import { message, Modal, InputNumber, Input } from "antd";
import { useAuthService } from "@/hooks/auth";
import RestrictedAccess from "@/components/reuseable/restricted-access";
import { useUserRole } from "@/context/role-context";

interface ProductForecast {
  productId: string;
  name: string;
  sku: string;
  categoryName: string;
  currentStock: number;
  lowStockThreshold: number;
  costPrice: number;
  sellingPrice: number;
  unitsSold30Days: number;
  averageDailySales: number;
  estimatedDaysRemaining: string | number;
  suggestedReorderQuantity: number;
  estimatedReorderCost: number;
  stockHealthStatus: "CRITICAL" | "LOW" | "HEALTHY" | "OUT_OF_STOCK" | "STAGNANT";
  aiRecommendation: string;
  isAiGenerated: boolean;
}

interface ForecastResponse {
  provenance: {
    engine: string;
    pythonServiceUrl: string;
    dataTimeframe: string;
    lastRefreshed: string;
  };
  summary: {
    atRiskInventoryValue: number;
    projectedStockoutsNext7Days: number;
    totalSuggestedReorderCapital: number;
    totalMonitoredProducts: number;
  };
  forecasts: ProductForecast[];
}

export default function AiAdvisorPage() {
  const { user: currentUser, loading: authLoading } = useAuthService();
  const roleContext = useUserRole();
  const userRole = (roleContext?.role || currentUser?.role || "").toLowerCase();
  const isEmployee = roleContext?.isEmployee ?? (userRole === "employee");

  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Quick Restock Modal
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [selectedForecast, setSelectedForecast] = useState<ProductForecast | null>(null);
  const [restockQty, setRestockQty] = useState<number>(20);
  const [restockNote, setRestockNote] = useState("");
  const [submittingRestock, setSubmittingRestock] = useState(false);

  const loadForecast = async () => {
    if (isEmployee) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetchApi<ForecastResponse>("/ai/forecast");
      if (res?.data) {
        setData(res.data);
      }
    } catch (err: any) {
      message.error(err?.message || "Failed to load AI stock predictions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (isEmployee) {
        setLoading(false);
      } else {
        loadForecast();
      }
    }
  }, [authLoading, isEmployee]);

  if (!authLoading && isEmployee) {
    return <RestrictedAccess featureName="AI Stock Advisor" />;
  }

  const openRestockModal = (forecast: ProductForecast) => {
    setSelectedForecast(forecast);
    setRestockQty(forecast.suggestedReorderQuantity || 20);
    setRestockNote(
      `AI-recommended replenishment based on 30-day velocity (${forecast.averageDailySales} units/day)`
    );
    setRestockModalOpen(true);
  };

  const handleRestock = async () => {
    if (!selectedForecast || restockQty <= 0) {
      message.error("Please enter a valid restock quantity");
      return;
    }

    try {
      setSubmittingRestock(true);
      await fetchApi("/stock-movements/adjust", {
        method: "POST",
        body: JSON.stringify({
          productId: selectedForecast.productId,
          type: "IN",
          quantity: restockQty,
          reason: restockNote || `AI Advisor restock recommendation`,
        }),
      });

      message.success(`Restocked ${restockQty} units of ${selectedForecast.name}`);
      setRestockModalOpen(false);
      loadForecast();
    } catch (err: any) {
      message.error(err?.message || "Failed to record restock");
    } finally {
      setSubmittingRestock(false);
    }
  };

  const forecasts = data?.forecasts || [];

  const filteredForecasts = forecasts.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoryName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "ALL") return true;
    if (activeTab === "RISK")
      return item.stockHealthStatus === "OUT_OF_STOCK" || item.stockHealthStatus === "CRITICAL";
    if (activeTab === "LOW") return item.stockHealthStatus === "LOW";
    if (activeTab === "STAGNANT") return item.stockHealthStatus === "STAGNANT";
    if (activeTab === "HEALTHY") return item.stockHealthStatus === "HEALTHY";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0F42C0] text-white shadow-md shadow-[#0F42C0]/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">AI Stock Advisor</h1>
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                <Cpu className="h-3 w-3" /> FastAPI ML Engine
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Predictive demand forecasting, velocity analysis, and automated purchase recommendations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadForecast}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#0F42C0]" : ""}`} /> Refresh Predictions
          </button>
        </div>
      </div>

      {/* AI Key Metrics Bar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Projected 7-Day Stockouts</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-600">
            {data?.summary.projectedStockoutsNext7Days ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Products at risk of lost revenue</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">At-Risk Inventory Value</span>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            ${data?.summary.atRiskInventoryValue.toFixed(2) ?? "0.00"}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Critical items current valuation</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Suggested Reorder Capital</span>
            <TrendingUp className="h-4 w-4 text-[#0F42C0]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            ${data?.summary.totalSuggestedReorderCapital.toFixed(2) ?? "0.00"}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">To maintain 30-day buffer</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Monitored Catalog</span>
            <Package className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {data?.summary.totalMonitoredProducts ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Active SKUs tracked by AI</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === "ALL" ? "bg-[#0F42C0] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            All Products ({forecasts.length})
          </button>
          <button
            onClick={() => setActiveTab("RISK")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === "RISK" ? "bg-rose-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            Critical / Stockout
          </button>
          <button
            onClick={() => setActiveTab("LOW")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === "LOW" ? "bg-amber-500 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            Low Stock
          </button>
          <button
            onClick={() => setActiveTab("STAGNANT")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === "STAGNANT" ? "bg-purple-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            Slow-Moving
          </button>
          <button
            onClick={() => setActiveTab("HEALTHY")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === "HEALTHY" ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            Healthy
          </button>
        </div>

        <input
          type="text"
          placeholder="Filter SKU or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-60 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0F42C0] focus:outline-none transition"
        />
      </div>

      {/* AI Recommendations List */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F42C0] border-t-transparent" />
            <p className="text-sm text-slate-500">Executing machine learning forecast models...</p>
          </div>
        </div>
      ) : filteredForecasts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Items in this Category</h3>
          <p className="mt-1 text-xs text-slate-500">All monitored inventory is currently within target parameters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredForecasts.map((item) => {
            const isOutOfStock = item.stockHealthStatus === "OUT_OF_STOCK";
            const isCritical = item.stockHealthStatus === "CRITICAL";
            const isLow = item.stockHealthStatus === "LOW";
            const isStagnant = item.stockHealthStatus === "STAGNANT";

            return (
              <div
                key={item.productId}
                className={`rounded-2xl border p-5 transition shadow-sm ${
                  isOutOfStock
                    ? "border-rose-200 bg-rose-50/20"
                    : isCritical
                    ? "border-amber-200 bg-amber-50/20"
                    : "border-slate-200 bg-white hover:border-[#0F42C0]"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left: Product & Status */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/products/${item.productId}`}
                        className="text-base font-bold text-slate-900 hover:text-[#0F42C0] transition"
                      >
                        {item.name}
                      </Link>

                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                          isOutOfStock
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : isCritical
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : isLow
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : isStagnant
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {item.stockHealthStatus.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono">{item.sku}</span>
                      <span>•</span>
                      <span>{item.categoryName}</span>
                      <span>•</span>
                      <span>Unit Cost: ${item.costPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Middle: Velocity & Run-rate Metrics */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl bg-slate-50 p-3 border border-slate-200">
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-500">Current Stock</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-900">{item.currentStock} units</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-500">Daily Sales</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-700">{item.averageDailySales} / day</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-500">Days Remaining</p>
                      <p
                        className={`mt-0.5 text-sm font-bold ${
                          isOutOfStock
                            ? "text-rose-600"
                            : isCritical
                            ? "text-amber-600"
                            : "text-slate-900"
                        }`}
                      >
                        {item.estimatedDaysRemaining}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-500">Suggested Order</p>
                      <p className="mt-0.5 text-sm font-bold text-emerald-600">
                        {item.suggestedReorderQuantity > 0
                          ? `+${item.suggestedReorderQuantity} units`
                          : "0 units"}
                      </p>
                    </div>
                  </div>

                  {/* Right: Action */}
                  <div className="flex items-center gap-2">
                    {item.suggestedReorderQuantity > 0 && (
                      <button
                        onClick={() => openRestockModal(item)}
                        className="flex items-center gap-1.5 rounded-xl bg-[#0F42C0] px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-[#0F42C0]/20 transition hover:bg-[#0C369E]"
                      >
                        <PlusCircle className="h-3.5 w-3.5" /> Reorder ({item.suggestedReorderQuantity})
                      </button>
                    )}
                    <Link
                      href={`/products/${item.productId}`}
                      className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition shadow-sm"
                      title="Inspect Product"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* AI Explanation Banner */}
                <div className="mt-3.5 flex items-start gap-2.5 rounded-xl bg-blue-50/70 p-3 text-xs leading-relaxed text-slate-700 border border-blue-100">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#0F42C0]" />
                  <span>{item.aiRecommendation}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Restock Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <Sparkles className="h-5 w-5 text-[#0F42C0]" />
            <span>Apply AI Reorder Recommendation</span>
          </div>
        }
        open={restockModalOpen}
        onCancel={() => setRestockModalOpen(false)}
        onOk={handleRestock}
        confirmLoading={submittingRestock}
        okText="Confirm & Receive Stock"
        cancelText="Cancel"
        okButtonProps={{ className: "bg-[#0F42C0] hover:bg-[#0C369E]" }}
      >
        {selectedForecast && (
          <div className="space-y-4 pt-4 text-sm text-slate-700">
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs">
              <p className="font-bold text-slate-900 text-sm mb-1">{selectedForecast.name}</p>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Current Warehouse Stock:</span>
                <span className="font-semibold text-slate-900">{selectedForecast.currentStock} units</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">30-Day Sales Velocity:</span>
                <span className="font-semibold text-slate-700">{selectedForecast.averageDailySales} units/day</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Estimated Reorder Cost:</span>
                <span className="font-bold text-emerald-600">
                  ${(restockQty * selectedForecast.costPrice).toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Quantity to Restock
              </label>
              <InputNumber
                min={1}
                value={restockQty}
                onChange={(val) => setRestockQty(val || 1)}
                className="w-full"
              />
              <p className="mt-1 text-xs text-slate-500">
                New inventory level will be:{" "}
                <span className="font-bold text-emerald-600">
                  {selectedForecast.currentStock + restockQty} units
                </span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Audit Notes / PO Reference
              </label>
              <Input.TextArea
                rows={2}
                value={restockNote}
                onChange={(e) => setRestockNote(e.target.value)}
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
