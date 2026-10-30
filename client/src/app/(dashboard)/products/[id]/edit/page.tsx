"use client";

import React, { useEffect, useState, useRef, use } from "react";
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
  Image as ImageIcon,
  UploadCloud,
  X,
  Plus,
  Trash2,
  Link2,
  CheckCircle2,
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

interface FeatureImageItem {
  id: string;
  url: string;
  file?: File;
  isUrl?: boolean;
  name?: string;
  size?: number;
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

  // Thumbnail (Single Image) state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [thumbnailTab, setThumbnailTab] = useState<"upload" | "url">("upload");
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  // Features Images (Multiple Images) state
  const [featureImages, setFeatureImages] = useState<FeatureImageItem[]>([]);
  const [featureUrlInput, setFeatureUrlInput] = useState<string>("");
  const [featureTab, setFeatureTab] = useState<"upload" | "url">("upload");
  const featuresInputRef = useRef<HTMLInputElement | null>(null);

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

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
        URL.revokeObjectURL(thumbnailPreview);
      }
      featureImages.forEach((item) => {
        if (item.url && item.url.startsWith("blob:")) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, []);

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

          // Populate existing thumbnail
          if (p.thumbnail) {
            setThumbnailPreview(p.thumbnail);
            setThumbnailUrl(p.thumbnail);
          }

          // Populate existing features images
          const rawFeatured = Array.isArray(p.featuredImages) && p.featuredImages.length > 0
            ? p.featuredImages
            : Array.isArray(p.images) && p.images.length > 1
            ? p.images.filter((img: string) => img !== p.thumbnail)
            : [];

          if (rawFeatured.length > 0) {
            setFeatureImages(
              rawFeatured.map((url: string, index: number) => ({
                id: `existing-${index}-${Date.now()}`,
                url,
                isUrl: true,
                name: url.split("/").pop()?.split("?")[0] || `Feature Image ${index + 1}`,
              }))
            );
          }
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

  // Format bytes helper
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Thumbnail file change handler
  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      message.error("Please upload a valid image file (JPG, PNG, WebP, etc.)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      message.error("Thumbnail image cannot exceed 10MB");
      return;
    }

    if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailPreview);
    }

    const objectUrl = URL.createObjectURL(file);
    setThumbnailFile(file);
    setThumbnailPreview(objectUrl);
    setThumbnailUrl("");
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

  const handleRemoveThumbnail = () => {
    if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    setThumbnailFile(null);
    setThumbnailPreview("");
    setThumbnailUrl("");
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

  const handleThumbnailUrlChange = (val: string) => {
    setThumbnailUrl(val);
    if (val.trim()) {
      if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
        URL.revokeObjectURL(thumbnailPreview);
      }
      setThumbnailFile(null);
      setThumbnailPreview(val.trim());
    } else {
      setThumbnailPreview("");
    }
  };

  // Features images change handler (Multiple)
  const handleFeatureFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: FeatureImageItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        message.warning(`"${file.name}" is not an image file`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        message.warning(`"${file.name}" exceeds 10MB limit`);
        continue;
      }

      const objectUrl = URL.createObjectURL(file);
      newItems.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        url: objectUrl,
        file,
        isUrl: false,
        name: file.name,
        size: file.size,
      });
    }

    if (newItems.length > 0) {
      setFeatureImages((prev) => [...prev, ...newItems]);
      message.success(`Added ${newItems.length} feature image${newItems.length > 1 ? "s" : ""}`);
    }

    if (featuresInputRef.current) featuresInputRef.current.value = "";
  };

  const handleAddFeatureUrl = () => {
    const trimmed = featureUrlInput.trim();
    if (!trimmed) {
      message.warning("Please enter a valid image URL");
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      message.error("Please enter a valid HTTP/HTTPS image URL");
      return;
    }

    setFeatureImages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        url: trimmed,
        isUrl: true,
        name: trimmed.split("/").pop()?.split("?")[0] || "Online Image",
      },
    ]);
    setFeatureUrlInput("");
    message.success("Feature image URL added");
  };

  const handleRemoveFeatureImage = (id: string) => {
    setFeatureImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.url && target.url.startsWith("blob:")) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleClearAllFeatures = () => {
    featureImages.forEach((item) => {
      if (item.url && item.url.startsWith("blob:")) {
        URL.revokeObjectURL(item.url);
      }
    });
    setFeatureImages([]);
  };

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
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("sku", values.sku.trim().toUpperCase());
      if (values.barcode?.trim()) formData.append("barcode", values.barcode.trim());
      if (values.categoryId) {
        formData.append("categoryId", values.categoryId);
        formData.append("category", values.categoryId);
      }
      if (values.description?.trim()) formData.append("description", values.description.trim());
      formData.append("unit", values.unit);
      formData.append("costPrice", parsedCost.toString());
      formData.append("sellingPrice", parsedSelling.toString());
      formData.append("quantity", parsedQty.toString());
      formData.append("reorderLevel", parsedReorder.toString());
      formData.append("lowStockThreshold", parsedReorder.toString());
      formData.append("safetyStock", parsedSafety.toString());
      if (values.adjustmentNote?.trim()) {
        formData.append("adjustmentNote", values.adjustmentNote.trim());
      }

      // Thumbnail Image (Single)
      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      } else if (thumbnailPreview) {
        formData.append("thumbnail", thumbnailPreview);
      } else {
        formData.append("thumbnail", "");
      }

      // Features Images (Multiple)
      featureImages.forEach((item) => {
        if (item.file) {
          formData.append("featuredImages", item.file);
        } else if (item.url && item.url.trim()) {
          formData.append("featuredImages", item.url.trim());
        }
      });

      const res = await fetchApi(`/products/${productId}`, {
        method: "PATCH",
        body: formData,
      });

      if (res?.success) {
        message.success("Product updated successfully!");
        router.push(`/products/${productId}`);
      }
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
            <p className="text-xs text-slate-500">Update item pricing, visual assets, inventory levels, and catalog info</p>
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

        {/* Section 2: Visual Assets & Images (Thumbnail & Features Images) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <ImageIcon className="h-5 w-5 text-[#0F42C0]" />
              <span>Product Media & Visual Assets</span>
            </div>
            <span className="text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
              Thumbnail & Features Images
            </span>
          </div>

          {/* Sub-Section: Thumbnail Image (Single) */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-900">
                    Thumbnail Image
                  </label>
                  <span className="text-[10px] font-semibold text-[#0F42C0] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    Single Image / Main Cover
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Primary showcase cover used across catalogue lists, search results, and POS cards.
                </p>
              </div>

              {/* Mode Tabs (Upload vs URL) */}
              <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setThumbnailTab("upload")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    thumbnailTab === "upload"
                      ? "bg-white text-slate-900"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setThumbnailTab("url")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    thumbnailTab === "url"
                      ? "bg-white text-slate-900"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Image URL
                </button>
              </div>
            </div>

            {thumbnailTab === "upload" ? (
              <div>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailSelect}
                  className="hidden"
                  id="edit-thumbnail-upload-input"
                />

                {thumbnailPreview ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-white border border-slate-200 rounded-xl">
                    <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0 group">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                        Cover
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 text-left w-full space-y-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {thumbnailFile?.name || "Product cover thumbnail"}
                      </p>
                      {thumbnailFile && (
                        <p className="text-[11px] text-slate-500">
                          Size: {formatFileSize(thumbnailFile.size)} • Type: {thumbnailFile.type}
                        </p>
                      )}
                      <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                        <CheckCircle2 size={12} /> Active cover image
                      </p>

                      <div className="flex items-center gap-2 pt-2">
                        <label
                          htmlFor="edit-thumbnail-upload-input"
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Change Image
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveThumbnail}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="edit-thumbnail-upload-input"
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-[#0F42C0] bg-white hover:bg-blue-50/20 rounded-xl cursor-pointer transition-all text-center group"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center text-[#0F42C0] transition-colors mb-2">
                      <UploadCloud size={24} />
                    </div>
                    <p className="text-xs font-bold text-slate-800 mb-0.5">
                      Click to upload product thumbnail
                    </p>
                    <p className="text-[11px] text-slate-500">
                      SVG, PNG, JPG or WebP (Single image, max 10MB)
                    </p>
                  </label>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <CustomInput
                    type="url"
                    placeholder="https://example.com/images/product-thumbnail.jpg"
                    value={thumbnailUrl}
                    onChange={(e) => handleThumbnailUrlChange(e.target.value)}
                    leftIcon={<Link2 size={14} />}
                    className="bg-white text-xs"
                    wrapperClassName="flex-1"
                  />
                  {thumbnailUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveThumbnail}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {thumbnailPreview && (
                  <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                        onError={() => message.error("Could not load image from provided URL")}
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {thumbnailUrl}
                      </p>
                      <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium mt-0.5">
                        <CheckCircle2 size={12} /> Image URL connected
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sub-Section: Features Images (Multiple) */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-900">
                    Features Images
                  </label>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    Multiple Images / Product Gallery
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Showcase key product angles, specifications, packaging, and in-use feature photos.
                </p>
              </div>

              {/* Mode Tabs (Upload vs URL) */}
              <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setFeatureTab("upload")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    featureTab === "upload"
                      ? "bg-white text-slate-900"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Upload Files
                </button>
                <button
                  type="button"
                  onClick={() => setFeatureTab("url")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    featureTab === "url"
                      ? "bg-white text-slate-900"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Add by URL
                </button>
              </div>
            </div>

            {/* Mode 1: Multiple Files Upload */}
            {featureTab === "upload" && (
              <div>
                <input
                  ref={featuresInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFeatureFilesSelect}
                  className="hidden"
                  id="edit-features-upload-input"
                />

                <label
                  htmlFor="edit-features-upload-input"
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-[#0F42C0] bg-white hover:bg-blue-50/20 rounded-xl cursor-pointer transition-all text-center group"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center text-indigo-600 transition-colors mb-2">
                    <UploadCloud size={24} />
                  </div>
                  <p className="text-xs font-bold text-slate-800 mb-0.5">
                    Click to browse or drop multiple feature images
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Select multiple images at once (PNG, JPG, WebP up to 10MB each)
                  </p>
                </label>
              </div>
            )}

            {/* Mode 2: Add by URL */}
            {featureTab === "url" && (
              <div className="flex gap-2">
                <CustomInput
                  type="url"
                  placeholder="https://example.com/images/feature-angle-1.jpg"
                  value={featureUrlInput}
                  onChange={(e) => setFeatureUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddFeatureUrl();
                    }
                  }}
                  leftIcon={<Link2 size={14} />}
                  className="bg-white text-xs"
                  wrapperClassName="flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddFeatureUrl}
                  className="px-4 py-2.5 bg-[#0F42C0] hover:bg-[#0C369E] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Add Image</span>
                </button>
              </div>
            )}

            {/* Features Gallery Preview Grid */}
            {featureImages.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      Product Features Gallery
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold">
                      {featureImages.length} image{featureImages.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="edit-features-upload-input"
                      className="text-[11px] font-semibold text-[#0F42C0] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} />
                      <span>Add More Files</span>
                    </label>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleClearAllFeatures}
                      className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {featureImages.map((item, idx) => (
                    <div
                      key={item.id}
                      className="relative group bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col transition-all hover:border-slate-300"
                    >
                      <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                        <img
                          src={item.url}
                          alt={item.name || `Feature ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-1.5 py-0.5 rounded font-bold">
                          #{idx + 1}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeatureImage(item.id)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 hover:bg-rose-500 hover:text-white text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                          title="Remove feature image"
                        >
                          <X size={13} />
                        </button>
                      </div>
                      <div className="p-2 text-left">
                        <p className="text-[11px] font-medium text-slate-800 truncate" title={item.name}>
                          {item.name || `Feature Image ${idx + 1}`}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {item.size ? formatFileSize(item.size) : "Saved Asset"}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Quick Add More Tile */}
                  <label
                    htmlFor="edit-features-upload-input"
                    className="border-2 border-dashed border-slate-200 hover:border-[#0F42C0] hover:bg-blue-50/20 rounded-xl aspect-square flex flex-col items-center justify-center text-slate-400 hover:text-[#0F42C0] cursor-pointer transition-all"
                  >
                    <Plus size={22} />
                    <span className="text-[11px] font-semibold mt-1">Add More</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Pricing & Profit Margin Analysis */}
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

        {/* Section 4: Inventory Levels & Adjustment */}
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
