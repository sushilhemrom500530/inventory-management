"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Save,
  Wand2,
  Coins,
  Layers,
} from "lucide-react";
import { apiClient } from "@/utils/api";
import { message } from "antd";
import Cookies from "js-cookie";
import { useAuthService } from "@/hooks/auth";
import RestrictedAccess from "@/components/reuseable/restricted-access";

export default function AddProductPage() {
  const router = useRouter();
  const { user: currentUser } = useAuthService();
  const userRole = (currentUser?.role || Cookies.get("role") || "").toLowerCase();
  const isEmployee = userRole === "employee";

  if (isEmployee) {
    return <RestrictedAccess featureName="Add New Product (Catalog Management)" />;
  }

  const [categories, setCategories] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form state
  const [name, setName] = useState<string>("Wireless Bluetooth Headset");
  const [sku, setSku] = useState<string>("");
  const [barcode, setBarcode] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [costPrice, setCostPrice] = useState<string>("25.00");
  const [sellingPrice, setSellingPrice] = useState<string>("49.99");
  const [quantity, setQuantity] = useState<string>("30");
  const [lowStockThreshold, setLowStockThreshold] = useState<string>("10");
  const [unit, setUnit] = useState<string>("pcs");

  // Fetch categories on mount
  useEffect(() => {
    apiClient("/categories/get-all").then((res) => {
      if (res?.success) {
        setCategories(res.data || []);
        if (res.data?.length > 0) {
          setCategory(res.data[0]._id);
        }
      }
    });
  }, []);

  // Auto-generate SKU helper
  const handleGenerateSKU = () => {
    const prefix = name ? name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "ITM") : "SKU";
    const rand = Math.floor(1000 + Math.random() * 9000);
    setSku(`${prefix}-${rand}`);
  };

  useEffect(() => {
    if (!sku) handleGenerateSKU();
  }, [name]);

  // Real-time Gross Margin calculation
  const cPrice = parseFloat(costPrice) || 0;
  const sPrice = parseFloat(sellingPrice) || 0;
  const grossProfit = Math.max(0, sPrice - cPrice);
  const marginPct = sPrice > 0 ? Math.round((grossProfit / sPrice) * 100) : 0;

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
    if (!category) {
      message.error("Please select a category");
      return;
    }
    if (sPrice < 0 || cPrice < 0) {
      message.error("Pricing numbers cannot be negative");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient("/products/create", {
        method: "POST",
        data: {
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          barcode: barcode.trim(),
          category,
          description: description.trim(),
          costPrice: cPrice,
          sellingPrice: sPrice,
          quantity: parseInt(quantity) || 0,
          lowStockThreshold: parseInt(lowStockThreshold) || 5,
          unit,
        },
      });

      if (res?.success) {
        message.success("Product created and published to inventory!");
        router.push("/products");
      }
    } catch (error: any) {
      message.error(error.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Top back & title bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Create New Inventory Item
            </h2>
            <p className="text-xs text-slate-500">
              Add product specification, costing, initial quantities, and reorder alerts
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Info & Pricing */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Basic Information */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package size={18} className="text-[#0F42C0]" />
              <span>General Information</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wireless Bluetooth Headset"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0F42C0]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-700 font-semibold">
                      SKU Code <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateSKU}
                      className="text-[11px] font-semibold text-[#0F42C0] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Wand2 size={12} />
                      <span>Auto Generate</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WIR-1049"
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0F42C0]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Barcode / UPC (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8901234567890"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0F42C0]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-[#0F42C0] cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Description & Specifications
                </label>
                <textarea
                  rows={3}
                  placeholder="Material specs, manufacturer notes, storage requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0F42C0]"
                />
              </div>
            </div>
          </div>

          {/* Card: Pricing & Margin Calculator */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Coins size={18} className="text-[#0F42C0]" />
              <span>Pricing & Financial Margins</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Cost Price ($) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-[#0F42C0]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Selling Price ($) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-[#0F42C0]"
                />
              </div>
            </div>

            {/* Live Profit Margin Badge */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">Live Calculated Gross Margin:</span>
              <div className="flex items-center gap-3">
                <span className="text-slate-700">
                  Profit: <strong className="font-mono text-slate-900">${grossProfit.toFixed(2)}</strong>
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold ${
                    marginPct >= 30
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {marginPct}% Margin
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Inventory Stock & Thresholds */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers size={18} className="text-[#0F42C0]" />
              <span>Stock & Thresholds</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Initial Quantity on Hand
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-[#0F42C0]"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Will create an initial Stock IN audit record
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Low Stock Threshold (Reorder Point)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-[#0F42C0]"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Triggers dashboard warnings when stock drops to or below this level
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Unit of Measurement
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-[#0F42C0] cursor-pointer"
                >
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="box">Box / Pack (box)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="meter">Meters (m)</option>
                  <option value="liter">Liters (L)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#0F42C0] hover:bg-[#0C369E] text-white text-xs font-bold transition-all shadow-md shadow-[#0F42C0]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save size={16} />
              <span>{submitting ? "Saving Product..." : "Save & Publish Product"}</span>
            </button>

            <Link
              href="/products"
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold text-center block transition-colors cursor-pointer"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
