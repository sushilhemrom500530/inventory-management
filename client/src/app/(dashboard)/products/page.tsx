"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Download,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  Sliders,
  ShoppingCart,
} from "lucide-react";
import { apiClient } from "@/utils/api";
import StockBadge from "@/components/reuseable/stock-badge";
import { Modal, message } from "antd";
import Cookies from "js-cookie";
import { useAuthService } from "@/hooks/auth";
import { useUserRole } from "@/context/role-context";

export default function ProductsListPage() {
  const { user: currentUser } = useAuthService();
  const roleContext = useUserRole();
  const userRole = (roleContext?.role || currentUser?.role || (typeof window !== "undefined" ? Cookies.get("role") : "") || "").toLowerCase();
  const isEmployee = roleContext?.isEmployee ?? (userRole === "employee");

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("-createdAt");
  const [page, setPage] = useState<number>(1);
  const [meta, setMeta] = useState<any>({ totalResult: 0, totalPage: 1 });

  // Quick Adjustment Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustType, setAdjustType] = useState<"IN" | "OUT" | "ADJUSTMENT">("IN");
  const [adjustQuantity, setAdjustQuantity] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>("");
  const [adjusting, setAdjusting] = useState<boolean>(false);

  // Fetch Categories for dropdown filter
  useEffect(() => {
    apiClient("/categories/get-all").then((res) => {
      if (res?.success) setCategories(res.data || []);
    });
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("searchTerm", searchTerm);
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedStatus) params.append("status", selectedStatus);
      params.append("sort", sortBy);
      params.append("page", String(page));
      params.append("limit", "10");

      const res = await apiClient(`/products/get-all?${params.toString()}`);
      if (res?.success) {
        setProducts(res.data || []);
        if (res.meta) setMeta(res.meta);
      }
    } catch (error) {
      console.error("Products fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, selectedStatus, sortBy, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle Quick Stock Adjustment
  const handleRecordAdjustment = async () => {
    if (!selectedProduct) return;
    if (adjustQuantity <= 0) {
      message.error("Quantity must be greater than zero");
      return;
    }
    if (!adjustReason) {
      message.error("Please provide a reason for stock audit logging");
      return;
    }

    setAdjusting(true);
    try {
      const res = await apiClient("/stock-movement/adjust", {
        method: "POST",
        data: {
          product: selectedProduct._id,
          type: adjustType,
          quantity: Number(adjustQuantity),
          reason: adjustReason,
        },
      });

      if (res?.success) {
        message.success("Stock level updated and logged to audit trail");
        setAdjustModalOpen(false);
        setAdjustReason("");
        setAdjustQuantity(1);
        fetchProducts();
      }
    } catch (error: any) {
      message.error(error.message || "Failed to adjust stock");
    } finally {
      setAdjusting(false);
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = (product: any) => {
    Modal.confirm({
      title: "Confirm Deletion",
      content: `Are you sure you want to delete product "${product.name}"? This will hide it from the active inventory catalog.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const res = await apiClient(`/products/${product._id}`, {
            method: "DELETE",
          });
          if (res?.success) {
            message.success("Product deleted successfully");
            fetchProducts();
          }
        } catch (error: any) {
          message.error(error.message || "Failed to delete product");
        }
      },
    });
  };

  // CSV Export
  const handleExportCSV = () => {
    if (products.length === 0) {
      message.warning("No products to export");
      return;
    }
    const headers = ["Name", "SKU", "Category", "Quantity", "Cost Price", "Selling Price", "Status"];
    const rows = products.map((p) => [
      `"${p.name}"`,
      p.sku,
      `"${p.category?.name || "Uncategorized"}"`,
      p.quantity,
      p.costPrice,
      p.sellingPrice,
      p.status,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stockwise_products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Product Catalog</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0F42C0] border border-blue-200">
              {meta.totalResult} Items
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage SKU listings, physical quantities, pricing margins, and threshold alerts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {isEmployee ? (
            <Link
              href="/sales/checkout"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F42C0] hover:bg-[#0C369E] text-white text-xs font-bold shadow-md shadow-[#0F42C0]/20 transition-all cursor-pointer"
            >
              <ShoppingCart size={16} />
              <span>POS Terminal</span>
            </Link>
          ) : (
            <Link
              href="/products/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F42C0] hover:bg-[#0C369E] text-white text-xs font-bold shadow-md shadow-[#0F42C0]/20 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Product</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-2xl bg-white border border-slate-200">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SKU or name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0F42C0]"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#0F42C0] cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#0F42C0] cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#0F42C0] cursor-pointer"
          >
            <option value="-createdAt">Newest First</option>
            <option value="quantity">Stock: Low to High</option>
            <option value="-quantity">Stock: High to Low</option>
            <option value="sellingPrice">Price: Low to High</option>
            <option value="-sellingPrice">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw size={24} className="animate-spin text-[#0F42C0]" />
            <span className="text-xs font-semibold">Loading product catalog...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Package size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No products match your filter.</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or add a new product.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Product Details</th>
                  <th className="py-3 px-5">SKU</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Stock Level</th>
                  <th className="py-3 px-5">Cost</th>
                  <th className="py-3 px-5">Price</th>
                  <th className="py-3 px-5">Margin</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => {
                  const margin =
                    product.sellingPrice > 0
                      ? (((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100).toFixed(1)
                      : "0.0";

                  return (
                    <tr key={product._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5">
                        <Link
                          href={`/products/${product._id}`}
                          className="font-bold text-slate-900 hover:text-[#0F42C0] transition-colors cursor-pointer"
                        >
                          {product.name}
                        </Link>
                        {product.barcode && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            UPC: {product.barcode}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-5 font-mono text-slate-700 font-medium">
                        {product.sku}
                      </td>

                      <td className="py-3.5 px-5 text-slate-600 font-medium">
                        {product.category?.name || "General"}
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="font-mono text-sm font-bold text-slate-900">
                          {product.quantity}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">units</span>
                      </td>

                      <td className="py-3.5 px-5 font-mono text-slate-600">
                        ${product.costPrice?.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                        ${product.sellingPrice?.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-5 font-semibold text-emerald-600 font-mono">
                        {margin}%
                      </td>

                      <td className="py-3.5 px-5">
                        <StockBadge status={product.status} quantity={product.quantity} />
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/products/${product._id}`}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#0F42C0] hover:border-[#0F42C0] transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </Link>

                          {!isEmployee && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setAdjustModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#0F42C0] hover:border-[#0F42C0] transition-colors cursor-pointer"
                                title="Quick Adjust Stock"
                              >
                                <Sliders size={14} />
                              </button>

                              <Link
                                href={`/products/${product._id}/edit`}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#0F42C0] hover:border-[#0F42C0] transition-colors cursor-pointer"
                                title="Edit Product"
                              >
                                <Edit2 size={14} />
                              </Link>

                              <button
                                onClick={() => handleDeleteProduct(product)}
                                className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {meta.totalPage > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, meta.totalResult)} of {meta.totalResult} results
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 font-bold text-slate-900">
                Page {page} of {meta.totalPage}
              </span>
              <button
                disabled={page >= meta.totalPage}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stock Adjustment Modal */}
      <Modal
        title={
          <div className="text-slate-900 font-bold">
            Record Stock Adjustment — {selectedProduct?.name}
          </div>
        }
        open={adjustModalOpen}
        onCancel={() => setAdjustModalOpen(false)}
        onOk={handleRecordAdjustment}
        confirmLoading={adjusting}
        okText="Confirm & Log"
        cancelText="Cancel"
        okButtonProps={{ className: "bg-[#0F42C0] hover:bg-[#0C369E]" }}
      >
        {selectedProduct && (
          <div className="space-y-4 pt-4 text-xs text-slate-700">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500">Current Stock:</span>
                <span className="ml-1.5 font-bold text-slate-900">{selectedProduct.quantity} units</span>
              </div>
              <div>
                <span className="text-slate-500">Reorder Threshold:</span>
                <span className="ml-1.5 font-bold text-amber-600">{selectedProduct.lowStockThreshold || 5} units</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Adjustment Type
              </label>
              <select
                value={adjustType}
                onChange={(e: any) => setAdjustType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0F42C0] cursor-pointer"
              >
                <option value="IN">Stock In (Shipment Received / Restock +)</option>
                <option value="OUT">Stock Out (Damaged / Return -)</option>
                <option value="ADJUSTMENT">Count Adjustment (Reconciliation)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Quantity Units
              </label>
              <input
                type="number"
                min="1"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0F42C0]"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Reason / Audit Note
              </label>
              <input
                type="text"
                placeholder="e.g., Weekly supplier restock delivery or Broken packaging scrap"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0F42C0]"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
