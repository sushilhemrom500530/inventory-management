"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { useAuthService } from "@/hooks/auth";
import RestrictedAccess from "@/components/reuseable/restricted-access";
import { useUserRole } from "@/context/role-context";
import { CustomSelect, CustomInput } from "@/components/form";

interface Category {
  _id: string;
  name: string;
}

interface EditProductFormValues {
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  description: string;
  unit: string;
  costPrice: number | string;
  sellingPrice: number | string;
  quantity: number | string;
  reorderLevel: number | string;
  safetyStock: number | string;
  adjustmentNote: string;
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();

  const { user: currentUser } = useAuthService();
  const roleContext = useUserRole();
  const userRole = (roleContext?.role || currentUser?.role || "").toLowerCase();
  const isEmployee = roleContext?.isEmployee ?? (userRole === "employee");

  if (isEmployee) {
    return <RestrictedAccess featureName="Edit Product Details" />;
  }

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialQuantity, setInitialQuantity] = useState<number>(0);

  // React Hook Form for Product Update
  const {
    register,
    handleSubmit: handleFormSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting: saving },
  } = useForm<EditProductFormValues>({
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      categoryId: "",
      description: "",
      unit: "piece",
      costPrice: 0,
      sellingPrice: 0,
      quantity: 0,
      reorderLevel: 10,
      safetyStock: 5,
      adjustmentNote: "",
    },
    mode: "onBlur",
  });

  // Watched values for dynamic real-time profit & margin calculations
  const costPrice = Number(watch("costPrice")) || 0;
  const sellingPrice = Number(watch("sellingPrice")) || 0;
  const quantity = Number(watch("quantity")) || 0;
  const categoryId = watch("categoryId");
  const unit = watch("unit");

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
          reset({
            name: p.name || "",
            sku: p.sku || "",
            barcode: p.barcode || "",
            categoryId:
              typeof p.category === "object" ? p.category?._id : p.category || "",
            description: p.description || "",
            unit: p.unit || "piece",
            costPrice: p.costPrice ?? 0,
            sellingPrice: p.sellingPrice ?? 0,
            quantity: p.quantity ?? 0,
            reorderLevel: p.reorderLevel ?? p.lowStockThreshold ?? 10,
            safetyStock: p.safetyStock ?? 5,
            adjustmentNote: "",
          });
          setInitialQuantity(p.quantity ?? 0);
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
  }, [productId, reset]);

  const profitPerUnit = sellingPrice - costPrice;
  const marginPercent =
    sellingPrice > 0 ? ((profitPerUnit / sellingPrice) * 100).toFixed(1) : "0.0";
  const markupPercent =
    costPrice > 0 ? ((profitPerUnit / costPrice) * 100).toFixed(1) : "0.0";
  const isStockModified = quantity !== initialQuantity;

  const onSubmit = async (values: EditProductFormValues) => {
    const parsedCost = Number(values.costPrice) || 0;
    const parsedSelling = Number(values.sellingPrice) || 0;
    const parsedQty = Number(values.quantity) || 0;
    const parsedReorder = Number(values.reorderLevel) || 0;
    const parsedSafety = Number(values.safetyStock) || 0;

    if (parsedCost < 0 || parsedSelling < 0) {
      message.error("Prices cannot be negative");
      return;
    }

    try {
      await fetchApi(`/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: values.name.trim(),
          sku: values.sku.trim(),
          barcode: values.barcode.trim() || undefined,
          categoryId: values.categoryId || undefined,
          category: values.categoryId || undefined,
          description: values.description.trim() || undefined,
          unit: values.unit,
          costPrice: parsedCost,
          sellingPrice: parsedSelling,
          reorderLevel: parsedReorder,
          lowStockThreshold: parsedReorder,
          safetyStock: parsedSafety,
        }),
      });

      if (isStockModified) {
        const diff = parsedQty - initialQuantity;
        const type = diff > 0 ? "IN" : "OUT";
        await fetchApi("/stock-movements/adjust", {
          method: "POST",
          body: JSON.stringify({
            productId,
            type,
            quantity: Math.abs(diff),
            reason:
              values.adjustmentNote ||
              `Manual inventory correction from edit form (${initialQuantity} -> ${parsedQty})`,
          }),
        });
      }

      message.success("Product updated successfully!");
      router.push(`/products/${productId}`);
    } catch (err: any) {
      message.error(err?.message || "Failed to save product updates");
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
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Product</h1>
            <p className="text-xs text-slate-500">Update item pricing, inventory levels, and catalog info</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFormSubmit(onSubmit)}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-[#0F42C0] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0F42C0]/20 transition hover:bg-[#0C369E] disabled:opacity-50 cursor-pointer"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving Changes..." : "Save Changes"}
        </button>
      </div>

      <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 text-slate-900 font-bold text-base">
            <Package className="h-5 w-5 text-[#0F42C0]" />
            <span>Basic Product Details</span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <CustomInput
                type="text"
                placeholder="Product name"
                {...register("name", {
                  required: "Product name is required",
                  minLength: { value: 2, message: "Name must be at least 2 characters" },
                })}
                error={errors.name}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                SKU (Stock Keeping Unit) <span className="text-rose-500">*</span>
              </label>
              <CustomInput
                type="text"
                placeholder="SKU"
                className="font-mono uppercase"
                {...register("sku", {
                  required: "SKU is required",
                  minLength: { value: 2, message: "SKU must be at least 2 characters" },
                })}
                error={errors.sku}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Barcode / UPC / EAN
              </label>
              <CustomInput
                type="text"
                placeholder="Barcode / UPC / EAN"
                className="font-mono"
                {...register("barcode")}
                error={errors.barcode}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 cursor-pointer">
                Category
              </label>
              <CustomSelect
                value={categoryId}
                onChange={(e) => setValue("categoryId", e.target.value, { shouldValidate: true })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#0F42C0] focus:outline-none cursor-pointer"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </CustomSelect>
              {errors.categoryId && (
                <p className="text-[11px] text-rose-500 font-medium mt-1">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 cursor-pointer">
                Unit of Measure
              </label>
              <CustomSelect
                value={unit}
                onChange={(e) => setValue("unit", e.target.value, { shouldValidate: true })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#0F42C0] focus:outline-none cursor-pointer"
              >
                <option value="piece">Piece (pcs)</option>
                <option value="box">Box</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="meter">Meter (m)</option>
                <option value="pack">Pack</option>
              </CustomSelect>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Product description and specifications..."
                {...register("description")}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0F42C0] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Pricing & Profit Margin Analysis */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 text-slate-900 font-bold text-base">
            <DollarSign className="h-5 w-5 text-[#0F42C0]" />
            <span>Pricing & Profit Margins</span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Cost Price ($) <span className="text-rose-500">*</span>
              </label>
              <CustomInput
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="font-mono"
                {...register("costPrice", {
                  required: "Cost price is required",
                  validate: (v) => Number(v) >= 0 || "Prices cannot be negative",
                })}
                error={errors.costPrice}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Selling Price ($) <span className="text-rose-500">*</span>
              </label>
              <CustomInput
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="font-mono"
                {...register("sellingPrice", {
                  required: "Selling price is required",
                  validate: (v) => Number(v) >= 0 || "Prices cannot be negative",
                })}
                error={errors.sellingPrice}
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
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 text-slate-900 font-bold text-base">
            <ShieldCheck className="h-5 w-5 text-[#0F42C0]" />
            <span>Inventory Quantity & Safety Controls</span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Current Stock (Units)
              </label>
              <CustomInput
                type="number"
                min="0"
                placeholder="0"
                className="font-mono font-bold"
                {...register("quantity", {
                  validate: (v) => Number(v) >= 0 || "Quantity cannot be negative",
                })}
                error={errors.quantity}
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Initial: {initialQuantity} units
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Reorder Threshold
              </label>
              <CustomInput
                type="number"
                min="0"
                placeholder="10"
                className="font-mono"
                {...register("reorderLevel", {
                  validate: (v) => Number(v) >= 0 || "Reorder level cannot be negative",
                })}
                error={errors.reorderLevel}
              />
              <p className="mt-1 text-[11px] text-slate-400">Triggers Low Stock status</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Safety Stock Buffer
              </label>
              <CustomInput
                type="number"
                min="0"
                placeholder="5"
                className="font-mono"
                {...register("safetyStock", {
                  validate: (v) => Number(v) >= 0 || "Safety stock cannot be negative",
                })}
                error={errors.safetyStock}
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
                <CustomInput
                  type="text"
                  placeholder="Optional audit reason (e.g. Broken packaging replacement, physical count reconciliation)"
                  className="bg-white text-xs border-amber-300 focus:border-amber-500"
                  {...register("adjustmentNote")}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href={`/products/${productId}`}
            className="rounded-xl border border-slate-200 bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#0F42C0] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0F42C0]/20 transition hover:bg-[#0C369E] disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving Changes..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
