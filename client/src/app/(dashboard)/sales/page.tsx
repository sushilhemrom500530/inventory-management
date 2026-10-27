"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Receipt,
  Search,
  ShoppingCart,
  Download,
  Eye,
  Printer,
  Calendar,
  CreditCard,
  Banknote,
  Building,
  TrendingUp,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { fetchApi } from "@/utils/api";
import { message, Modal } from "antd";

interface SaleRecord {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerContact?: string;
  items: Array<{
    product: any;
    name?: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: "cash" | "card" | "bank_transfer";
  createdAt: string;
}

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");

  // Receipt Modal State
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const loadSales = async () => {
    try {
      setLoading(true);
      const res = await fetchApi<any>("/sales");
      if (res?.data) {
        const rawSales = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
        const safeSales: SaleRecord[] = rawSales.map((s: any) => ({
          ...s,
          subtotal: Number(s.subtotal ?? 0),
          tax: Number(s.tax ?? s.taxAmount ?? 0),
          discount: Number(s.discount ?? 0),
          total: Number(s.total ?? s.grandTotal ?? s.totalAmount ?? 0),
          items: (s.items || []).map((it: any) => ({
            ...it,
            name: it.name || it.productName || it.productNameSnapshot || "Product",
            price: Number(it.price ?? it.unitPrice ?? 0),
            subtotal: Number(it.subtotal ?? (Number(it.price ?? it.unitPrice ?? 0) * (it.quantity || 1))),
          })),
        }));
        setSales(safeSales);
      }
    } catch (err: any) {
      message.error(err?.message || "Failed to load sales history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  // Filter sales
  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customerContact && s.customerContact.includes(searchQuery));

    const matchesMethod = methodFilter === "all" || s.paymentMethod === methodFilter;

    return matchesSearch && matchesMethod;
  });

  // KPI Calculations
  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalOrders = sales.length;
  const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : "0.00";
  const cashSales = sales.filter((s) => s.paymentMethod === "cash").reduce((a, b) => a + b.total, 0);
  const cardSales = sales.filter((s) => s.paymentMethod === "card").reduce((a, b) => a + b.total, 0);

  const exportCSV = () => {
    if (sales.length === 0) {
      message.warning("No sales to export");
      return;
    }
    const headers = ["Invoice Number", "Date", "Customer", "Items Count", "Subtotal", "Tax", "Discount", "Total", "Payment Method"];
    const rows = sales.map((s) => [
      s.invoiceNumber,
      new Date(s.createdAt).toISOString(),
      `"${s.customerName}"`,
      s.items?.length || 0,
      s.subtotal.toFixed(2),
      s.tax.toFixed(2),
      s.discount.toFixed(2),
      s.total.toFixed(2),
      s.paymentMethod,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stockwise_sales_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales & Transactions</h1>
          <p className="text-xs text-slate-500">
            Real-time transaction ledger, receipts, and revenue audit log
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 shadow-sm"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <Link
            href="/sales/checkout"
            className="flex items-center gap-2 rounded-xl bg-[#0F42C0] px-5 py-2.5 text-xs font-semibold text-white shadow-sm shadow-[#0F42C0]/20 transition hover:bg-[#0C369E]"
          >
            <ShoppingCart className="h-4 w-4" /> New Sale (POS)
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Revenue</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">${totalRevenue.toFixed(2)}</p>
          <p className="mt-1 text-[11px] text-slate-400">Gross sales to date</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Transactions</span>
            <Receipt className="h-4 w-4 text-[#0F42C0]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalOrders}</p>
          <p className="mt-1 text-[11px] text-slate-400">Completed invoices</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Average Order</span>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">${avgOrderValue}</p>
          <p className="mt-1 text-[11px] text-slate-400">Per transaction</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Payment Ratio</span>
            <CreditCard className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm font-bold text-emerald-600">${cashSales.toFixed(0)}</span>
            <span className="text-[11px] text-slate-400">Cash /</span>
            <span className="text-sm font-bold text-sky-600">${cardSales.toFixed(0)}</span>
            <span className="text-[11px] text-slate-400">Card</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Volume distribution</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice number (#INV-...) or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0F42C0] focus:outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-[#0F42C0] focus:outline-none transition"
          >
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash Only</option>
            <option value="card">Credit / Debit Card</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>
      </div>

      {/* Sales Transactions Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F42C0] border-t-transparent" />
              <p className="text-xs text-slate-500">Loading sales records...</p>
            </div>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-900">No Sales Found</h3>
            <p className="mt-1 text-xs text-slate-500">
              {searchQuery ? "Try refining your search keyword" : "Start ringing up orders with the POS terminal."}
            </p>
            <Link
              href="/sales/checkout"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0F42C0] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0C369E] shadow-sm"
            >
              <ShoppingCart className="h-4 w-4" /> Open POS Terminal
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3.5 pl-6 font-semibold">Invoice #</th>
                  <th className="py-3.5 font-semibold">Date & Time</th>
                  <th className="py-3.5 font-semibold">Customer</th>
                  <th className="py-3.5 font-semibold">Items</th>
                  <th className="py-3.5 font-semibold">Method</th>
                  <th className="py-3.5 text-right font-semibold">Total Amount</th>
                  <th className="py-3.5 pr-6 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 pl-6">
                      <Link
                        href={`/sales/${sale._id}`}
                        className="font-mono font-bold text-[#0F42C0] hover:underline transition"
                      >
                        {sale.invoiceNumber}
                      </Link>
                    </td>

                    <td className="py-3.5 text-slate-500">
                      {new Date(sale.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>

                    <td className="py-3.5">
                      <p className="font-semibold text-slate-900">{sale.customerName}</p>
                      {sale.customerContact && (
                        <p className="font-mono text-[10px] text-slate-500">{sale.customerContact}</p>
                      )}
                    </td>

                    <td className="py-3.5 text-slate-600">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {sale.items?.length || 0} items
                      </span>
                    </td>

                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase border ${
                          sale.paymentMethod === "cash"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : sale.paymentMethod === "card"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-purple-50 text-purple-700 border-purple-200"
                        }`}
                      >
                        {sale.paymentMethod === "cash" && <Banknote className="h-3 w-3" />}
                        {sale.paymentMethod === "card" && <CreditCard className="h-3 w-3" />}
                        {sale.paymentMethod === "bank_transfer" && <Building className="h-3 w-3" />}
                        {sale.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3.5 text-right font-mono font-bold text-slate-900">
                      ${sale.total.toFixed(2)}
                    </td>

                    <td className="py-3.5 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedSale(sale);
                            setReceiptOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                          title="Print Receipt"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/sales/${sale._id}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#0F42C0] transition"
                          title="View Invoice"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      <Modal
        title={null}
        open={receiptOpen}
        onCancel={() => setReceiptOpen(false)}
        footer={null}
        width={420}
        centered
      >
        {selectedSale && (
          <div className="p-2 text-slate-800">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h2 className="text-xl font-black tracking-tight text-slate-900">STOCKWISE</h2>
              <p className="text-[11px] text-slate-500">Inventory & POS Management</p>
              <p className="mt-1 font-mono text-xs font-semibold text-slate-700">
                Invoice: {selectedSale.invoiceNumber}
              </p>
              <p className="text-[10px] text-slate-500">
                {new Date(selectedSale.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="py-2.5 text-xs text-slate-600 border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-semibold text-slate-900">{selectedSale.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="font-semibold uppercase text-slate-900">{selectedSale.paymentMethod}</span>
              </div>
            </div>

            <div className="py-3 border-b border-dashed border-slate-300">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-200">
                    <th className="text-left pb-1 font-medium">Item</th>
                    <th className="text-center pb-1 font-medium">Qty</th>
                    <th className="text-right pb-1 font-medium">Price</th>
                    <th className="text-right pb-1 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedSale.items.map((item, idx) => (
                    <tr key={idx} className="text-slate-700">
                      <td className="py-1 font-medium max-w-[120px] truncate">
                        {item.name || item.product?.name || "Product"}
                      </td>
                      <td className="py-1 text-center">{item.quantity}</td>
                      <td className="py-1 text-right">${item.price.toFixed(2)}</td>
                      <td className="py-1 text-right font-semibold">
                        ${(item.subtotal || item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="py-2.5 space-y-1 text-xs border-b border-dashed border-slate-300">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>${selectedSale.subtotal.toFixed(2)}</span>
              </div>
              {selectedSale.tax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax</span>
                  <span>${selectedSale.tax.toFixed(2)}</span>
                </div>
              )}
              {selectedSale.discount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Discount</span>
                  <span>-${selectedSale.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1">
                <span>Total</span>
                <span>${selectedSale.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl bg-[#0F42C0] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0C369E]"
              >
                <Printer className="h-4 w-4" /> Print Document
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
