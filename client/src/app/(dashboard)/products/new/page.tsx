"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Save,
  Wand2,
  Coins,
  Layers,
  Image as ImageIcon,
  UploadCloud,
  X,
  Plus,
  Trash2,
  Link2,
  CheckCircle2,
} from "lucide-react";
import { apiClient } from "@/utils/api";
import { message } from "antd";
import Cookies from "js-cookie";
import { useAuthService } from "@/hooks/auth";
import RestrictedAccess from "@/components/reuseable/restricted-access";
import { useUserRole } from "@/context/role-context";
import { CustomSelect, CustomInput } from "@/components/form";

interface FeatureImageItem {
  id: string;
  url: string;
  file?: File;
  isUrl?: boolean;
  name?: string;
  size?: number;
}

export default function AddProductPage() {
  const router = useRouter();
  const { user: currentUser } = useAuthService();
  const roleContext = useUserRole();
  const userRole = (roleContext?.role || currentUser?.role || "").toLowerCase();
  const isEmployee = roleContext?.isEmployee ?? (userRole === "employee");

  if (isEmployee) {
    return <RestrictedAccess featureName="Add New Product (Catalog Management)" />;
  }

  const [categories, setCategories] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form state - no hardcoded demo default values
  const [name, setName] = useState<string>("");
  const [sku, setSku] = useState<string>("");
  const [barcode, setBarcode] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [costPrice, setCostPrice] = useState<string>("");
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [lowStockThreshold, setLowStockThreshold] = useState<string>("");
  const [unit, setUnit] = useState<string>("pcs");

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

  // Fetch categories on mount (no auto-selected default)
  useEffect(() => {
    apiClient("/categories/get-all").then((res) => {
      if (res?.success) {
        setCategories(res.data || []);
      }
    });
  }, []);

  // Manual Auto-generate SKU helper
  const handleGenerateSKU = () => {
    const prefix = name ? name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "ITM") : "SKU";
    const rand = Math.floor(1000 + Math.random() * 9000);
    setSku(`${prefix}-${rand}`);
  };

  // Real-time Gross Margin calculation
  const cPrice = parseFloat(costPrice) || 0;
  const sPrice = parseFloat(sellingPrice) || 0;
  const grossProfit = Math.max(0, sPrice - cPrice);
  const marginPct = sPrice > 0 ? Math.round((grossProfit / sPrice) * 100) : 0;

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
    if (!sellingPrice.trim() || isNaN(sPrice)) {
      message.error("Selling price is required");
      return;
    }
    if (sPrice < 0 || cPrice < 0) {
      message.error("Pricing numbers cannot be negative");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("sku", sku.trim().toUpperCase());
      if (barcode.trim()) formData.append("barcode", barcode.trim());
      formData.append("category", category);
      if (description.trim()) formData.append("description", description.trim());
      formData.append("costPrice", cPrice.toString());
      formData.append("sellingPrice", sPrice.toString());
      formData.append("quantity", (parseInt(quantity) || 0).toString());
      formData.append("lowStockThreshold", (parseInt(lowStockThreshold) || 5).toString());
      formData.append("unit", unit);

      // Thumbnail Image (Single)
      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      } else if (thumbnailUrl.trim()) {
        formData.append("thumbnail", thumbnailUrl.trim());
      }

      // Features Images (Multiple)
      featureImages.forEach((item) => {
        if (item.file) {
          formData.append("featuredImages", item.file);
        } else if (item.isUrl && item.url.trim()) {
          formData.append("featuredImages", item.url.trim());
        }
      });

      const res = await apiClient("/products/create", {
        method: "POST",
        body: formData,
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
    <div className="space-y-6 pb-16">
      {/* Top back & title bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Create New Inventory Item
            </h2>
            <p className="text-xs text-slate-500">
              Add product specification, visual media, costing, initial quantities, and reorder alerts
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Info, Media & Pricing */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Basic Information */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package size={18} className="text-[#0F42C0]" />
              <span>General Information</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <CustomInput
                  type="text"
                  required
                  placeholder="e.g. Wireless Bluetooth Headset"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  <CustomInput
                    type="text"
                    required
                    placeholder="e.g. WIR-1049"
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Barcode / UPC (Optional)
                  </label>
                  <CustomInput
                    type="text"
                    placeholder="e.g. 8901234567890"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-[#0F42C0] cursor-pointer"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </CustomSelect>
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

          {/* Card 2: Visual Assets & Images (Thumbnail & Features Images) */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon size={18} className="text-[#0F42C0]" />
                <span>Product Media & Visual Assets</span>
              </h3>
              <span className="text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                Thumbnail & Features Images
              </span>
            </div>

            {/* Sub-Section 1: Thumbnail Image (Single) */}
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
                    id="thumbnail-upload-input"
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
                          {thumbnailFile?.name || "Uploaded thumbnail image"}
                        </p>
                        {thumbnailFile && (
                          <p className="text-[11px] text-slate-500">
                            Size: {formatFileSize(thumbnailFile.size)} • Type: {thumbnailFile.type}
                          </p>
                        )}
                        <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                          <CheckCircle2 size={12} /> Ready for publishing
                        </p>

                        <div className="flex items-center gap-2 pt-2">
                          <label
                            htmlFor="thumbnail-upload-input"
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
                      htmlFor="thumbnail-upload-input"
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

            {/* Sub-Section 2: Features Images (Multiple) */}
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
                    id="features-upload-input"
                  />

                  <label
                    htmlFor="features-upload-input"
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
                        Selected Features Gallery
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold">
                        {featureImages.length} image{featureImages.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="features-upload-input"
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
                            {item.size ? formatFileSize(item.size) : "External URL"}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Quick Add More Tile */}
                    <label
                      htmlFor="features-upload-input"
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

          {/* Card 3: Pricing & Margin Calculator */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Coins size={18} className="text-[#0F42C0]" />
              <span>Pricing & Financial Margins</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Cost Price ($) <span className="text-rose-500">*</span>
                </label>
                <CustomInput
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Selling Price ($) <span className="text-rose-500">*</span>
                </label>
                <CustomInput
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="font-mono"
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
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers size={18} className="text-[#0F42C0]" />
              <span>Stock & Thresholds</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Initial Quantity on Hand
                </label>
                <CustomInput
                  type="number"
                  min="0"
                  required
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Will create an initial Stock IN audit record
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Low Stock Threshold (Reorder Point)
                </label>
                <CustomInput
                  type="number"
                  min="1"
                  required
                  placeholder="5"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Triggers dashboard warnings when stock drops to or below this level
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Unit of Measurement
                </label>
                <CustomSelect
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-[#0F42C0] cursor-pointer"
                >
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="box">Box / Pack (box)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="meter">Meters (m)</option>
                  <option value="liter">Liters (L)</option>
                </CustomSelect>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
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
