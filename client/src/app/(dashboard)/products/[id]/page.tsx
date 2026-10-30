"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit3,
  Package,
  Layers,
  History,
  Sparkles,
  Barcode,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import StockBadge from "@/components/reuseable/stock-badge";
import { fetchApi } from "@/utils/api";
import { message, Modal, Input, InputNumber } from "antd";
import CustomSelect from "@/components/reuseable/custom-select";

interface ProductDetail {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: {
    _id: string;
    name: string;
  } | string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  reorderLevel: number;
  safetyStock: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  description?: string;
  unit?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface StockMovement {
  _id: string;
  type: "IN" | "OUT" | "ADJUSTMENT" | "SALE" | "RETURN";
  quantity: number;
  reason?: string;
  reference?: string;
  createdAt: string;
  performedBy?: {
    name?: string;
    email?: string;
  };
}

interface AIAdvice {
  product_id: string;
  product_name: string;
  current_stock: number;
  predicted_daily_demand: number;
  predicted_weekly_demand: number;
  days_until_stockout: number;
  risk_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  recommended_reorder_quantity: number;
  recommendation: string;
  confidence: number;
  is_ai_powered?: boolean;
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [aiAdvice, setAiAdvice] = useState<AIAdvice | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAi, setLoadingAi] = useState(false);

  // Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustType, setAdjustType] = useState<"IN" | "OUT" | "ADJUSTMENT">("IN");
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState("");
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const prodRes = await fetchApi<ProductDetail>(`/products/${productId}`);
      if (prodRes?.data) {
        setProduct(prodRes.data);
      }

      try {
        const movRes = await fetchApi<StockMovement[]>(`/stock-movements/product/${productId}`);
        if (movRes?.data) {
          setMovements(movRes.data);
        }
      } catch (err) {
        console.warn("Stock movements error:", err);
      }
    } catch (err: any) {
      message.error(err?.message || "Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  const loadAiAdvice = async () => {
    try {
      setLoadingAi(true);
      const res = await fetchApi<AIAdvice>("/ai/stock-advice", {
        method: "POST",
        body: JSON.stringify({ productId, lookbackDays: 30 }),
      });
      if (res?.data) {
        setAiAdvice(res.data);
      }
    } catch (err: any) {
      console.warn("Failed to load AI advice:", err);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    if (productId) {
      loadData();
      loadAiAdvice();
    }
  }, [productId]);

  const handleAdjustStock = async () => {
    if (!adjustQty || adjustQty <= 0) {
      message.error("Please enter a valid quantity greater than 0");
      return;
    }

    try {
      setSubmittingAdjust(true);
      await fetchApi("/stock-movements/adjust", {
        method: "POST",
        body: JSON.stringify({
          productId,
          type: adjustType,
          quantity: adjustQty,
          reason: adjustReason || `Manual inventory ${adjustType.toLowerCase()}`,
        }),
      });

      message.success("Stock level updated and recorded in audit ledger!");
      setAdjustModalOpen(false);
      setAdjustReason("");
      loadData();
      loadAiAdvice();
    } catch (err: any) {
      message.error(err?.message || "Failed to adjust stock");
    } finally {
      setSubmittingAdjust(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: "Delete Product",
      content: `Are you sure you want to delete "${product?.name}"?`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await fetchApi(`/products/${productId}`, { method: "DELETE" });
          message.success("Product deleted successfully");
          router.push("/products");
        } catch (err: any) {
          message.error(err?.message || "Failed to delete product");
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F42C0] border-t-transparent" />
          <p className="text-sm text-slate-500">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
        <Package className="mx-auto h-12 w-12 text-slate-300 mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>
        <p className="mt-1 text-sm text-slate-500">The requested product could not be located or has been deleted.</p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0F42C0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0C369E] cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>
      </div>
    );
  }

  const categoryName = typeof product.category === "object" ? product.category?.name : "General";
  const profitMargin =
    product.sellingPrice > 0
      ? (((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100).toFixed(1)
      : "0.0";
  const totalStockValue = (product.quantity * product.costPrice).toFixed(2);
  const potentialRevenue = (product.quantity * product.sellingPrice).toFixed(2);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <Link
            href="/products"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{product.name}</h1>
              <StockBadge status={product.status} quantity={product.quantity} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono text-slate-700 font-medium">SKU: {product.sku}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                {categoryName}
              </span>
              {product.barcode && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Barcode className="h-3.5 w-3.5 text-slate-400" />
                    {product.barcode}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setAdjustModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4 text-[#0F42C0]" /> Adjust Stock
          </button>
          <Link
            href={`/products/${productId}/edit`}
            className="flex items-center gap-2 rounded-xl bg-[#0F42C0] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#0F42C0]/20 transition hover:bg-[#0C369E] cursor-pointer"
          >
            <Edit3 className="h-4 w-4" /> Edit Product
          </Link>
          <button
            onClick={handleDelete}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 cursor-pointer"
            title="Delete Product"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Current Stock</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {product.quantity}{" "}
            <span className="text-xs font-normal text-slate-500">{product.unit || "units"}</span>
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Reorder threshold: {product.reorderLevel} units</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Unit Cost Price</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">${product.costPrice.toFixed(2)}</p>
          <p className="mt-1 text-[11px] text-slate-400">Wholesale cost basis</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Unit Selling Price</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">${product.sellingPrice.toFixed(2)}</p>
          <p className="mt-1 text-[11px] text-emerald-600 font-semibold">{profitMargin}% Margin</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Total Stock Value</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">${totalStockValue}</p>
          <p className="mt-1 text-[11px] text-slate-400">Inventory cost valuation</p>
        </div>

        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-1">
          <p className="text-xs font-medium text-slate-500">Potential Revenue</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">${potentialRevenue}</p>
          <p className="mt-1 text-[11px] text-slate-400">Upon full liquidation</p>
        </div>
      </div>

      {/* Main Grid: AI Advisor on Left, Details & Stock Ledger on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: AI Advisor & Demand Forecast Card */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0F42C0]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Demand Advisor</h3>
                  <p className="text-[11px] text-slate-500">FastAPI ML velocity model</p>
                </div>
              </div>
              <button
                onClick={loadAiAdvice}
                disabled={loadingAi}
                className="text-slate-400 hover:text-slate-700 transition cursor-pointer"
                title="Refresh Forecast"
              >
                <RefreshCw className={`h-4 w-4 ${loadingAi ? "animate-spin text-[#0F42C0]" : ""}`} />
              </button>
            </div>

            {loadingAi ? (
              <div className="py-8 text-center">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#0F42C0] border-t-transparent" />
                <p className="mt-2 text-xs text-slate-500">Calculating stock velocity...</p>
              </div>
            ) : aiAdvice ? (
              <div className="mt-4 space-y-4">
                {/* Risk Level Badge */}
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-xs font-medium text-slate-600">Stockout Risk</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      aiAdvice.risk_level === "CRITICAL"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : aiAdvice.risk_level === "HIGH"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : aiAdvice.risk_level === "MEDIUM"
                        ? "bg-blue-50 text-[#0F42C0] border border-blue-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {aiAdvice.risk_level === "CRITICAL" && <ShieldAlert className="h-3 w-3" />}
                    {aiAdvice.risk_level}
                  </span>
                </div>

                {/* Key Predictions */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] text-slate-500">Days to Stockout</p>
                    <p className="mt-0.5 text-lg font-bold text-slate-900">
                      {aiAdvice.days_until_stockout === 999
                        ? "No Risk"
                        : `${aiAdvice.days_until_stockout} days`}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] text-slate-500">Weekly Run Rate</p>
                    <p className="mt-0.5 text-lg font-bold text-slate-900">
                      {aiAdvice.predicted_weekly_demand} units
                    </p>
                  </div>
                </div>

                {/* Recommended Reorder */}
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3.5">
                  <p className="text-xs font-bold text-[#0F42C0]">Recommended Reorder</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">
                      {aiAdvice.recommended_reorder_quantity}
                    </span>
                    <span className="text-xs text-slate-600">units to maintain safety buffer</span>
                  </div>
                </div>

                {/* AI Natural Language Recommendation */}
                <div className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 border border-slate-200">
                  <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#0F42C0]" /> Executive Summary
                  </p>
                  {aiAdvice.recommendation}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Confidence: {(aiAdvice.confidence * 100).toFixed(0)}%</span>
                  <span>Model: {aiAdvice.is_ai_powered ? "FastAPI ML Service" : "Internal Heuristic"}</span>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-400 text-center py-4">
                No AI forecast data available yet.
              </p>
            )}
          </div>

          {/* Product Specifications Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Inventory Specifications</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Reorder Threshold</span>
                <span className="font-semibold text-slate-900">{product.reorderLevel} units</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Safety Buffer</span>
                <span className="font-semibold text-slate-900">{product.safetyStock} units</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Unit of Measure</span>
                <span className="font-semibold text-slate-900">{product.unit || "Piece (pcs)"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Created At</span>
                <span className="font-semibold text-slate-900">
                  {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "—"}
                </span>
              </div>
              {product.description && (
                <div className="pt-2">
                  <p className="text-slate-500 mb-1">Product Description</p>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Stock Movement Ledger (Audit Trail) */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0F42C0]">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Stock Movement Ledger</h3>
                  <p className="text-[11px] text-slate-500">Immutable transactional inventory audit history</p>
                </div>
              </div>
              <button
                onClick={() => setAdjustModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F42C0] hover:underline cursor-pointer"
              >
                + Record Adjustment
              </button>
            </div>

            {movements.length === 0 ? (
              <div className="py-12 text-center">
                <History className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No stock movements recorded yet.</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Transactions like purchases, sales, and adjustments will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3 font-semibold">Type</th>
                      <th className="py-3 px-3 font-semibold">Quantity</th>
                      <th className="py-3 px-3 font-semibold">Reason / Reference</th>
                      <th className="py-3 px-3 font-semibold">Date & Time</th>
                      <th className="py-3 px-3 font-semibold">Operator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {movements.map((mov) => {
                      const isPositive = mov.type === "IN" || mov.type === "RETURN";
                      return (
                        <tr key={mov._id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-bold text-[11px] ${
                                mov.type === "IN"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : mov.type === "OUT" || mov.type === "SALE"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-blue-50 text-[#0F42C0] border border-blue-200"
                              }`}
                            >
                              {isPositive ? (
                                <ArrowUpRight className="h-3 w-3" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3" />
                              )}
                              {mov.type}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            {isPositive ? `+${mov.quantity}` : `-${mov.quantity}`}
                          </td>
                          <td className="py-3 px-3 text-slate-700 max-w-[200px] truncate">
                            {mov.reason || mov.reference || "Regular operation"}
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {new Date(mov.createdAt).toLocaleString(undefined, {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {mov.performedBy?.name || "System"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stock Adjustment Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <RefreshCw className="h-5 w-5 text-[#0F42C0]" />
            <span>Record Stock Adjustment — {product.name}</span>
          </div>
        }
        open={adjustModalOpen}
        onCancel={() => setAdjustModalOpen(false)}
        onOk={handleAdjustStock}
        confirmLoading={submittingAdjust}
        okText="Confirm & Record"
        cancelText="Cancel"
        okButtonProps={{ className: "bg-[#0F42C0] hover:bg-[#0C369E]" }}
      >
        <div className="space-y-4 pt-4 text-xs text-slate-700">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-600 mb-1">Adjustment Type</label>
            <CustomSelect
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value)}
              onValueChange={(val) => setAdjustType(val)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0F42C0] cursor-pointer"
              options={[
                { value: "IN", label: "Stock In / Restock (+)" },
                { value: "OUT", label: "Stock Out / Scrap (-)" },
                { value: "ADJUSTMENT", label: "Physical Count Reconciliation" },
              ]}
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-600 mb-1">Quantity</label>
            <InputNumber
              min={1}
              value={adjustQty}
              onChange={(val) => setAdjustQty(val || 1)}
              className="w-full"
            />
            <p className="mt-1 text-slate-400">
              Current warehouse inventory: <span className="font-bold text-slate-900">{product.quantity}</span> units
            </p>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-600 mb-1">Reason / Notes</label>
            <Input.TextArea
              rows={3}
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. Supplier delivery PO-9842 or Monthly inventory count adjustment"
              className="bg-white border-slate-200 text-slate-900 placeholder-slate-400"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
