"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Receipt,
  Calendar,
  User,
  CreditCard,
  Banknote,
  Building,
  CheckCircle2,
  Package,
} from "lucide-react";
import { fetchApi } from "@/utils/api";
import { message } from "antd";

interface SaleDetail {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerContact?: string;
  items: Array<{
    product: any;
    name?: string;
    sku?: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  subtotal: number;
  tax: number;
  taxRate?: number;
  discount: number;
  total: number;
  paymentMethod: "cash" | "card" | "bank_transfer";
  createdAt: string;
  cashier?: {
    name?: string;
    email?: string;
  };
}

export default function SaleInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const saleId = resolvedParams.id;

  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSale = async () => {
      try {
        setLoading(true);
        const res = await fetchApi<any>(`/sales/${saleId}`);
        if (res?.data) {
          const raw = res.data;
          const safeSale: SaleDetail = {
            ...raw,
            subtotal: Number(raw.subtotal ?? 0),
            tax: Number(raw.tax ?? raw.taxAmount ?? 0),
            discount: Number(raw.discount ?? 0),
            total: Number(raw.total ?? raw.grandTotal ?? raw.totalAmount ?? 0),
            items: (raw.items || []).map((it: any) => ({
              ...it,
              name: it.name || it.productName || it.productNameSnapshot || "Product",
              price: Number(it.price ?? it.unitPrice ?? 0),
              subtotal: Number(it.subtotal ?? (Number(it.price ?? it.unitPrice ?? 0) * (it.quantity || 1))),
            })),
          };
          setSale(safeSale);
        }
      } catch (err: any) {
        message.error(err?.message || "Failed to load invoice details");
      } finally {
        setLoading(false);
      }
    };

    if (saleId) {
      loadSale();
    }
  }, [saleId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F42C0] border-t-transparent" />
          <p className="text-sm text-slate-500">Loading invoice document...</p>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <Receipt className="mx-auto h-12 w-12 text-slate-300 mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Invoice Not Found</h2>
        <p className="mt-1 text-sm text-slate-500">The requested invoice could not be retrieved.</p>
        <Link
          href="/sales"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0F42C0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0C369E] shadow-sm cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Sales
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Action Bar (Hidden during print) */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/sales"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 shadow-sm cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Invoice #{sale.invoiceNumber}
            </h1>
            <p className="text-xs text-slate-500">Transaction details and itemized receipt</p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-[#0F42C0] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#0F42C0]/20 transition hover:bg-[#0C369E] cursor-pointer"
        >
          <Printer className="h-4 w-4" /> Print Invoice
        </button>
      </div>

      {/* Invoice Document Box */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-900 shadow-sm print:border-none print:p-0">
        {/* Top Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F42C0] text-white shadow-sm">
                <Receipt className="h-5 w-5" />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">
                STOCKWISE
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Smart Inventory Management & Retail Solutions
            </p>
            <p className="text-xs text-slate-400">
              Tax ID: SW-2026-BD | support@stockwise.io
            </p>
          </div>

          <div className="sm:text-right">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" /> PAID & COMPLETED
            </span>
            <p className="mt-2 font-mono text-base font-bold text-slate-900">
              {sale.invoiceNumber}
            </p>
            <p className="text-xs text-slate-500">
              Date: {new Date(sale.createdAt).toLocaleDateString()} at{" "}
              {new Date(sale.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Customer & Cashier Section */}
        <div className="grid grid-cols-2 gap-6 border-b border-slate-200 py-6 text-xs">
          <div>
            <p className="font-semibold uppercase tracking-wider text-slate-500">
              Billed To
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">{sale.customerName}</p>
            {sale.customerContact ? (
              <p className="text-slate-500">{sale.customerContact}</p>
            ) : (
              <p className="text-slate-400">Walk-in Retail Customer</p>
            )}
          </div>

          <div className="sm:text-right">
            <p className="font-semibold uppercase tracking-wider text-slate-500">
              Payment Details
            </p>
            <p className="mt-1 font-semibold uppercase text-slate-900">
              Method: {sale.paymentMethod}
            </p>
            {sale.cashier && (
              <p className="text-slate-500">
                Cashier: {sale.cashier.name || sale.cashier.email}
              </p>
            )}
          </div>
        </div>

        {/* Itemized Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 font-semibold">Item & SKU</th>
                <th className="pb-3 text-center font-semibold">Unit Price</th>
                <th className="pb-3 text-center font-semibold">Quantity</th>
                <th className="pb-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sale.items.map((item, index) => {
                const name = item.name || item.product?.name || `Product #${index + 1}`;
                const sku = item.sku || item.product?.sku || "SKU-N/A";
                const lineTotal = item.subtotal || item.price * item.quantity;
                return (
                  <tr key={index}>
                    <td className="py-3">
                      <p className="font-semibold text-slate-900">{name}</p>
                      <p className="font-mono text-[10px] text-slate-400">{sku}</p>
                    </td>
                    <td className="py-3 text-center font-mono text-slate-700">${item.price.toFixed(2)}</td>
                    <td className="py-3 text-center font-mono font-bold text-slate-900">{item.quantity}</td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900">
                      ${lineTotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="border-t border-slate-200 pt-4">
          <div className="ml-auto max-w-xs space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-mono text-slate-900 font-semibold">${sale.subtotal.toFixed(2)}</span>
            </div>

            {sale.tax > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax {sale.taxRate ? `(${sale.taxRate}%)` : ""}</span>
                <span className="font-mono text-slate-900 font-semibold">${sale.tax.toFixed(2)}</span>
              </div>
            )}

            {sale.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span className="font-mono font-semibold">-${sale.discount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
              <span>Grand Total</span>
              <span className="font-mono text-xl font-black text-slate-900">
                ${sale.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          <p>This is a computer-generated tax invoice. Thank you for your business!</p>
          <p className="mt-1">For warranty or return inquiries, please present this invoice within 14 days.</p>
        </div>
      </div>
    </div>
  );
}
