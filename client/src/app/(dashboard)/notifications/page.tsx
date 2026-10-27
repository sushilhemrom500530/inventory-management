"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  ShieldAlert,
  ShoppingBag,
  RefreshCw,
  Package,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { apiClient } from "@/utils/api";
import { message } from "antd";

interface NotificationItem {
  _id: string;
  title: string;
  body: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    productId?: string;
    productName?: string;
    sku?: string;
    quantity?: number;
    status?: string;
    invoiceNumber?: string;
  };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"ALL" | "UNREAD" | "ALERTS" | "SALES">("ALL");
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient("/notification/get-all?limit=50", { method: "GET" });
      if (res?.success && res.data) {
        const items = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.results)
          ? res.data.results
          : [];
        setNotifications(items);
      }
    } catch (_e) {
      message.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient(`/notification/mark-as-read?id=${id}`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isRead: true } : item))
      );
      message.success("Marked as read");
    } catch (_e) {
      message.error("Failed to update notification");
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await apiClient("/notification/mark-as-read?id=all", { method: "PATCH" });
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      message.success("All notifications marked as read");
    } catch (_e) {
      message.error("Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  };

  // Filtered notifications list
  const filteredNotifications = notifications.filter((item) => {
    if (filterTab === "UNREAD") return !item.isRead;
    if (filterTab === "ALERTS") {
      return (
        item.type === "update" ||
        item.title.toLowerCase().includes("stock") ||
        item.title.toLowerCase().includes("alert") ||
        item.title.toLowerCase().includes("out of stock")
      );
    }
    if (filterTab === "SALES") {
      return (
        item.type === "payment" ||
        item.type === "order" ||
        item.title.toLowerCase().includes("sale") ||
        item.title.toLowerCase().includes("invoice")
      );
    }
    return true;
  });

  const unreadTotal = notifications.filter((n) => !n.isRead).length;

  const getNotificationIcon = (item: NotificationItem) => {
    const isOut =
      item.metadata?.status === "out_of_stock" ||
      item.title.toLowerCase().includes("out of stock");
    const isLow =
      item.metadata?.status === "low_stock" ||
      item.title.toLowerCase().includes("low stock");
    const isSale =
      item.title.toLowerCase().includes("sale") ||
      item.type === "order" ||
      item.type === "payment";

    if (isOut) {
      return (
        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
          <ShieldAlert size={20} />
        </div>
      );
    }
    if (isLow) {
      return (
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
          <AlertTriangle size={20} />
        </div>
      );
    }
    if (isSale) {
      return (
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
          <ShoppingBag size={20} />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0F42C0] flex items-center justify-center border border-blue-100 shrink-0">
        <Bell size={20} />
      </div>
    );
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0F42C0] flex items-center justify-center border border-blue-100">
                <Bell size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">Notification Center</h1>
                  {unreadTotal > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0F42C0] text-white">
                      {unreadTotal} unread
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time stock alerts, inventory movement, and store audit logs
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchNotifications}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                title="Refresh notifications"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>

              {unreadTotal > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={markingAll}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0F42C0] text-white text-xs font-semibold hover:bg-[#0C369E] shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  <CheckCheck size={14} />
                  <span>Mark All Read</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterTab("ALL")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterTab === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("UNREAD")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterTab === "UNREAD"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Unread ({unreadTotal})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("ALERTS")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterTab === "ALERTS"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Stock Alerts
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("SALES")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterTab === "SALES"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Sales Activity
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {loading && notifications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <RefreshCw size={28} className="animate-spin text-[#0F42C0] mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-100">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-900">All caught up!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {filterTab === "UNREAD"
                  ? "You have zero unread notifications. New inventory and sales events will appear here."
                  : "No notifications match this filter tab."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item._id}
                className={`bg-white rounded-2xl border p-5 shadow-sm transition-all flex flex-col sm:flex-row items-start justify-between gap-4 ${
                  !item.isRead
                    ? "border-blue-200 bg-blue-50/20"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-4">
                  {getNotificationIcon(item)}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#0F42C0]" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                      {item.body}
                    </p>

                    {/* Metadata chips */}
                    {item.metadata && (
                      <div className="flex items-center gap-2 pt-1.5 flex-wrap">
                        {item.metadata.sku && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            SKU: {item.metadata.sku}
                          </span>
                        )}
                        {typeof item.metadata.quantity === "number" && (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              item.metadata.quantity <= 0
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            Stock: {item.metadata.quantity} units
                          </span>
                        )}
                        {item.metadata.invoiceNumber && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {item.metadata.invoiceNumber}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                      <Clock size={12} />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {item.metadata?.productId && (
                    <Link
                      href={`/alerts`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Package size={13} />
                      <span>Restock</span>
                    </Link>
                  )}

                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(item._id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                      title="Mark as read"
                    >
                      <CheckCircle2 size={13} className="text-[#0F42C0]" />
                      <span>Mark Read</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
