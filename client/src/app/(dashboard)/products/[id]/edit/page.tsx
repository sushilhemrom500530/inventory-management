"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Package,
  DollarSign,
  AlertTriangle,
  Calculator,
  ShieldCheck,
} from "lucide-react";
import { fetchApi } from "@/utils/api";
import { message } from "antd";

interface Category {
  _id: string;
  name: string;
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("piece");
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [initialQuantity, setInitialQuantity] = useState<number>(0);
  const [reorderLevel, setReorderLevel] = useState<number>(10);
  const [safetyStock, setSafetyStock] = useState<number>(5);
  const [adjustmentNote, setAdjustmentNote] = useState("");

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);

        const catRes = await fetchApi<Category[]>("/categories");
        if (catRes?.data) {
          setCategories(catRes.data);
        }

        const prodRes = await fetchApi<any>(`/products/${productId}`);
        if (prodRes?.data) {
          const p = prodRes.data;
          setName(p.name || "");
          setSku(p.sku || "");
          setBarcode(p.barcode || "");
          setCategoryId(
            typeof p.category === "object" ? p.category?._id : p.category || ""
          );
          setDescription(p.description || "");
          setUnit(p.unit || "piece");
          setCostPrice(p.costPrice || 0);
          setSellingPrice(p.sellingPrice || 0);
          setQuantity(p.quantity || 0);
          setInitialQuantity(p.quantity || 0);
          setReorderLevel(p.reorderLevel || 10);
          setSafetyStock(p.safetyStock || 5);
        }
      } catch (err: any) {
        message.error(err?.message || "Failed to load product data");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      initData();
    }
  }, [productId]);

  const profitPerUnit = sellingPrice - costPrice;
  const marginPercent =
    sellingPrice > 0 ? ((profitPerUnit / sellingPrice) * 100).toFixed(1) : "0.0";
  const markupPercent =
    costPrice > 0 ? ((profitPerUnit / costPrice) * 100).toFixed(1) : "0.0";
  const isStockModified = quantity !== initialQuantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      message.error("Product name is required");
      return;
    }
    if (!sku.trim()) {
      message.error("SKU is required");
      return;
    }
    if (costPrice < 0 || sellingPrice < 0) {
      message.error("Prices cannot be negative");
      return;
    }

    try {
      setSaving(true);

      await fetchApi(`/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim(),
          barcode: barcode.trim() || undefined,
          categoryId: categoryId || undefined,
          category: categoryId || undefined,
          description: description.trim() || undefined,
          unit,
          costPrice,
          sellingPrice,
          reorderLevel,
          safetyStock,
        }),
      });

      if (isStockModified) {
        const diff = quantity - initialQuantity;
        const type = diff > 0 ? "IN" : "OUT";
        await fetchApi("/stock-movements/adjust", {
          method: "POST",
          body: JSON.stringify({
            productId,
            type,
            quantity: Math.abs(diff),
            reason:
              adjustmentNote ||
              `Manual inventory correction from edit form (${initialQuantity} -> ${quantity})`,
          }),
        });
      }

      message.success("Product updated successfully!");
      router.push(`/products/${productId}`);
    } catch (err: any) {
      message.error(err?.message || "Failed to save product updates");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F42C0] border-t-transparent" />
          <p className="text-sm text-slate-500">Loading product editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href={`/products/${productId}`}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Product</h1>
            <p className="text-xs text-slate-500">Update item pricing, inventory levels, and catalog info</p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-[#0F42C0] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0F42C0]/20 transition hover:bg-[#0C369E] disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving Changes..." : "Save Changes"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 text-slate-900 font-bold text-base">
            <Package className="h-5 w-5 text-[#0F42C0]" />
            <span>Basic Product Details</span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0F42C0] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                SKU (Stock Keeping Unit) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0F42C0] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Barcode / UPC / EAN
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0F42C0] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#0F42C0] focus:outline-none"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Unit of Measure
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#0F42C0] focus:outline-none"
              >
                <option value="piece">Piece (pcs)</option>
                <option value="box">Box</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="meter">Meter (m)</option>
                <option value="pack">Pack</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0F42C0] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Pricing & Profit Margin Analysis */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 text-slate-900 font-bold text-base">
            <DollarSign className="h-5 w-5 text-[#0F42C0]" />
            <span>Pricing & Profit Margins</span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Cost Price ($) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#0F42C0] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Selling Price ($) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#0F42C0] focus:outline-none"
              />
            </div>
          </div>

          {/* Real-time Profit Calculation Card */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-3">
              <Calculator className="h-4 w-4 text-[#0F42C0]" />
              <span>Real-Time Margin Breakdown</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-white border border-slate-200 p-2.5">
                <p className="text-[11px] text-slate-500">Profit / Unit</p>
                <p className={`mt-0.5 text-base font-bold ${profitPerUnit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  ${profitPerUnit.toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg bg-white border border-slate-200 p-2.5">
                <p className="text-[11px] text-slate-500">Gross Margin</p>
                <p className="mt-0.5 text-base font-bold text-slate-900">{marginPercent}%</p>
              </div>
              <div className="rounded-lg bg-white border border-slate-200 p-2.5">
                <p className="text-[11px] text-slate-500">Markup</p>
                <p className="mt-0.5 text-base font-bold text-slate-900">{markupPercent}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Inventory Levels & Adjustment */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 text-slate-900 font-bold text-base">
            <ShieldCheck className="h-5 w-5 text-[#0F42C0]" />
            <span>Inventory Quantity & Safety Controls</span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Current Stock (Units)
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-bold text-sm text-slate-900 focus:bg-white focus:border-[#0F42C0] focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Initial: {initialQuantity} units
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Reorder Threshold
              </label>
              <input
                type="number"
                min="0"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#0F42C0] focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-400">Triggers Low Stock status</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Safety Stock Buffer
              </label>
              <input
                type="number"
                min="0"
                value={safetyStock}
                onChange={(e) => setSafetyStock(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#0F42C0] focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-400">Emergency reserve buffer</p>
            </div>

            {isStockModified && (
              <div className="sm:col-span-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="h-4 w-4" /> Stock quantity modified ({initialQuantity} → {quantity})
                </p>
                <p className="text-xs text-amber-700 mb-2">
                  This change will automatically be logged to the immutable Stock Movement audit trail.
                </p>
                <input
                  type="text"
                  placeholder="Optional audit reason (e.g. Broken packaging replacement, physical count reconciliation)"
                  value={adjustmentNote}
                  onChange={(e) => setAdjustmentNote(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href={`/products/${productId}`}
            className="rounded-xl border border-slate-200 bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#0F42C0] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0F42C0]/20 transition hover:bg-[#0C369E] disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving Changes..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
