"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  ArrowRight,
  FolderOpen,
} from "lucide-react";
import { fetchApi } from "@/utils/api";
import { message, Modal, Input } from "antd";
import Cookies from "js-cookie";
import { useAuthService } from "@/hooks/auth";
import { useUserRole } from "@/context/role-context";

interface Category {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  productCount?: number;
  createdAt?: string;
}

export default function CategoriesPage() {
  const { user: currentUser } = useAuthService();
  const roleContext = useUserRole();
  const userRole = (roleContext?.role || currentUser?.role || (typeof window !== "undefined" ? Cookies.get("role") : "") || "").toLowerCase();
  const isEmployee = roleContext?.isEmployee ?? (userRole === "employee");

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await fetchApi<Category[]>("/categories");
      if (res?.data) {
        setCategories(res.data);
      }
    } catch (err: any) {
      message.error(err?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setCatName("");
    setCatDesc("");
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || "");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!catName.trim()) {
      message.error("Category name is required");
      return;
    }

    try {
      setSubmitting(true);
      if (editingCategory) {
        await fetchApi(`/categories/${editingCategory._id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: catName.trim(),
            description: catDesc.trim() || undefined,
          }),
        });
        message.success("Category updated successfully");
      } else {
        await fetchApi("/categories", {
          method: "POST",
          body: JSON.stringify({
            name: catName.trim(),
            description: catDesc.trim() || undefined,
          }),
        });
        message.success("Category created successfully");
      }

      setModalOpen(false);
      loadCategories();
    } catch (err: any) {
      message.error(err?.message || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (cat: Category) => {
    Modal.confirm({
      title: "Delete Category",
      content: `Are you sure you want to delete the category "${cat.name}"? Products assigned to this category will need reassignment.`,
      okText: "Delete Category",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await fetchApi(`/categories/${cat._id}`, { method: "DELETE" });
          message.success("Category removed successfully");
          loadCategories();
        } catch (err: any) {
          message.error(err?.message || "Failed to delete category");
        }
      },
    });
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalProducts = categories.reduce((acc, c) => acc + (c.productCount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Categories Management</h1>
          <p className="text-xs text-slate-500">
            Organize inventory items into structured taxonomy and logical classification
          </p>
        </div>

        {!isEmployee && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-[#0F42C0] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0F42C0]/20 transition hover:bg-[#0C369E] cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Category
          </button>
        )}
      </div>

      {/* KPI Overview & Search Filter */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Total Categories</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{categories.length}</p>
          <p className="mt-1 text-[11px] text-slate-400">Active product classifications</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Cataloged Products</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalProducts}</p>
          <p className="mt-1 text-[11px] text-slate-400">Items assigned across groups</p>
        </div>

        <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search category name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0F42C0] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F42C0] border-t-transparent" />
            <p className="text-sm text-slate-500">Loading categories catalog...</p>
          </div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h2 className="text-lg font-bold text-slate-900">No Categories Found</h2>
          <p className="mt-1 text-xs text-slate-500">
            {searchQuery ? "Try refining your search keyword" : "Get started by creating your first category."}
          </p>
          {!searchQuery && !isEmployee && (
            <button
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0F42C0] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0C369E] cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Create Category
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((cat) => (
            <div
              key={cat._id}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#0F42C0]/50 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0F42C0]">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-[#0F42C0] transition">
                        {cat.name}
                      </h3>
                      <p className="font-mono text-[11px] text-slate-400">
                        {cat.slug || cat.name.toLowerCase().replace(/\s+/g, "-")}
                      </p>
                    </div>
                  </div>

                  {!isEmployee && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600 line-clamp-2">
                  {cat.description || "No description provided for this inventory classification."}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Package className="h-3.5 w-3.5 text-[#0F42C0]" />
                  {cat.productCount ?? 0} {cat.productCount === 1 ? "Product" : "Products"}
                </span>

                <Link
                  href={`/products?category=${cat._id}`}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#0F42C0] hover:underline cursor-pointer"
                >
                  View Items <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Category Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <Layers className="h-5 w-5 text-[#0F42C0]" />
            <span>{editingCategory ? "Edit Category" : "Create New Category"}</span>
          </div>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        confirmLoading={submitting}
        okText={editingCategory ? "Save Changes" : "Create Category"}
        cancelText="Cancel"
        okButtonProps={{ className: "bg-[#0F42C0] hover:bg-[#0C369E]" }}
      >
        <div className="space-y-4 pt-4 text-xs text-slate-700">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <Input
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Peripherals, Audio Devices, Storage"
              className="bg-white border-slate-200 text-slate-900 placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Description (Optional)
            </label>
            <Input.TextArea
              rows={3}
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              placeholder="Brief description of products belonging to this category"
              className="bg-white border-slate-200 text-slate-900 placeholder-slate-400"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
