"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Building,
  Printer,
  CheckCircle2,
  Package,
  Layers,
  Receipt,
  User,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { fetchApi } from "@/utils/api";
import { StockBadge } from "@/components/reuseable/stock-badge";
import { message, Modal } from "antd";

interface Product {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  category?: {
    _id: string;
    name: string;
  } | string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CompletedSale {
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

export default function PosCheckoutPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerContact, setCustomerContact] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "bank_transfer">("cash");
  const [taxRate, setTaxRate] = useState<number>(5); // 5% default
  const [discount, setDiscount] = useState<number>(0);
  const [cashTendered, setCashTendered] = useState<number>(0);

  // Checkout modal
  const [submitting, setSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        fetchApi<any>("/products"),
        fetchApi<any>("/categories"),
      ]);

      const rawProds = Array.isArray(prodRes?.data)
        ? prodRes.data
        : Array.isArray(prodRes?.data?.data)
        ? prodRes.data.data
        : [];

      const rawCats = Array.isArray(catRes?.data)
        ? catRes.data
        : Array.isArray(catRes?.data?.data)
        ? catRes.data.data
        : [];

      const safeProds: Product[] = rawProds.map((p: any) => ({
        ...p,
        sellingPrice: Number(p.sellingPrice ?? p.price ?? 0),
        costPrice: Number(p.costPrice ?? 0),
        quantity: Number(p.quantity ?? 0),
        status: p.status || (p.quantity <= 0 ? "out_of_stock" : "in_stock"),
      }));

      setProducts(safeProds);
      setCategories(rawCats);
    } catch (err: any) {
      message.error(err?.message || "Failed to load inventory for POS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Add product to cart
  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      message.warning(`"${product.name}" is out of stock`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          message.warning(`Cannot exceed available warehouse stock (${product.quantity})`);
          return prev;
        }
        return prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  // Modify Cart quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product._id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.quantity) {
              message.warning(`Max warehouse stock reached (${item.product.quantity})`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product._id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Calculations
  const subtotal = cart.reduce(
    (acc, item) =>
      acc + Number(item.product?.sellingPrice ?? (item.product as any)?.price ?? 0) * (item.quantity ?? 1),
    0
  );
  const taxAmount = (subtotal * (taxRate ?? 0)) / 100;
  const grandTotal = Math.max(0, subtotal + taxAmount - (discount ?? 0));
  const changeDue = paymentMethod === "cash" ? Math.max(0, (cashTendered ?? 0) - grandTotal) : 0;

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));

    const catId = typeof p.category === "object" ? p.category?._id : p.category;
    const matchesCat = selectedCategory === "all" || catId === selectedCategory;

    return matchesSearch && matchesCat;
  });

  // Handle Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      message.error("Cart is empty. Add products to continue.");
      return;
    }

    if (paymentMethod === "cash" && cashTendered > 0 && cashTendered < grandTotal) {
      message.error("Tendered cash is less than the grand total.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        items: cart.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
        })),
        taxRate,
        discount,
        paymentMethod,
        customerName: customerName.trim() || "Walk-in Customer",
        customerContact: customerContact.trim() || undefined,
      };

      const res = await fetchApi<CompletedSale>("/sales/checkout", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res?.data) {
        const rawSale = res.data as any;
        const normalized: CompletedSale = {
          _id: rawSale._id,
          invoiceNumber: rawSale.invoiceNumber,
          customerName: rawSale.customerName || "Walk-in Customer",
          customerContact: rawSale.customerContact || "",
          subtotal: Number(rawSale.subtotal ?? 0),
          tax: Number(rawSale.tax ?? rawSale.taxAmount ?? 0),
          discount: Number(rawSale.discount ?? 0),
          total: Number(rawSale.total ?? rawSale.grandTotal ?? rawSale.totalAmount ?? 0),
          paymentMethod: rawSale.paymentMethod || "cash",
          createdAt: rawSale.createdAt || new Date().toISOString(),
          items: (rawSale.items || []).map((it: any) => {
            const itemPrice = Number(it.price ?? it.unitPrice ?? 0);
            const itemQty = Number(it.quantity || 1);
            return {
              product: it.product,
              name: it.name || it.productName || it.productNameSnapshot || "Product",
              quantity: itemQty,
              price: itemPrice,
              subtotal: Number(it.subtotal ?? itemPrice * itemQty),
            };
          }),
        };

        setCompletedSale(normalized);
        setReceiptModalOpen(true);
        message.success("Sale completed successfully!");

        // Refresh inventory in background
        loadData();
        clearCart();
        setCashTendered(0);
      }
    } catch (err: any) {
      message.error(err?.message || "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  const startNewSale = () => {
    setCart([]);
    setCustomerName("Walk-in Customer");
    setCustomerContact("");
    setDiscount(0);
    setCashTendered(0);
    setCompletedSale(null);
    setReceiptModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F42C0] text-white shadow-md shadow-[#0F42C0]/20">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">POS Terminal — Record Sale</h1>
            <p className="text-xs text-slate-500">Point of sale checkout with live inventory guard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/sales"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm"
          >
            <Receipt className="h-4 w-4" /> Sales History
          </Link>
          <button
            onClick={loadData}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-sm"
            title="Refresh Inventory"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#0F42C0]" : ""}`} />
          </button>
        </div>
      </div>

      {/* POS Grid: Catalog (Left 65%) vs Cart / Register (Right 35%) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Product Selection */}
        <div className="space-y-4 lg:col-span-7 xl:col-span-8">
          {/* Search & Category Pills */}
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Scan barcode, search product name, or enter SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0F42C0] focus:outline-none transition"
              />
            </div>

            {/* Categories Filter Horizontal Scroll */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  selectedCategory === "all"
                    ? "bg-[#0F42C0] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                All Products ({products.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c._id}
                  onClick={() => setSelectedCategory(c._id)}
                  className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    selectedCategory === c._id
                      ? "bg-[#0F42C0] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F42C0] border-t-transparent" />
                <p className="text-xs text-slate-500">Loading catalog items...</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <Package className="mx-auto h-10 w-10 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-900">No products match your filter</p>
              <p className="mt-1 text-xs text-slate-500">Check spelling or clear active category filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((p) => {
                const cartEntry = cart.find((i) => i.product._id === p._id);
                const inCartQty = cartEntry?.quantity || 0;
                const isOutOfStock = p.quantity <= 0;
                const isMaxInCart = inCartQty >= p.quantity;

                return (
                  <div
                    key={p._id}
                    onClick={() => !isOutOfStock && !isMaxInCart && addToCart(p)}
                    className={`relative flex flex-col justify-between rounded-xl border p-3.5 transition select-none ${
                      isOutOfStock
                        ? "border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed"
                        : isMaxInCart
                        ? "border-blue-400 bg-blue-50/50 cursor-default"
                        : "border-slate-200 bg-white hover:border-[#0F42C0] hover:shadow-md cursor-pointer"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-mono text-[10px] text-slate-500 truncate max-w-[90px]">
                          {p.sku}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                            p.quantity > 5
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : p.quantity > 0
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {p.quantity} left
                        </span>
                      </div>

                      <h4 className="mt-1.5 text-xs font-semibold text-slate-900 line-clamp-2 leading-snug">
                        {p.name}
                      </h4>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                      <span className="text-sm font-bold text-slate-900">
                        ${Number(p.sellingPrice ?? (p as any).price ?? 0).toFixed(2)}
                      </span>

                      {inCartQty > 0 ? (
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0F42C0] text-xs font-bold text-white shadow-sm">
                          {inCartQty}
                        </span>
                      ) : (
                        <button
                          disabled={isOutOfStock}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-[#0F42C0] hover:text-white transition"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Register & Cart */}
        <div className="space-y-4 lg:col-span-5 xl:col-span-4">
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {/* Cart Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-[#0F42C0]" />
                <h3 className="text-sm font-bold text-slate-900">Active Order</h3>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#0F42C0] border border-blue-100">
                  {cart.reduce((a, b) => a + b.quantity, 0)} items
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs font-medium text-rose-600 hover:text-rose-700 transition"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="my-3 max-h-[300px] space-y-2 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-12 text-center">
                  <ShoppingCart className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Cart is empty</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Click items on the left catalog to add to sale.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product._id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5"
                  >
                    <div className="max-w-[150px]">
                      <p className="text-xs font-semibold text-slate-900 truncate">{item.product.name}</p>
                      <p className="font-mono text-[10px] text-slate-500">
                        ${Number(item.product.sellingPrice ?? (item.product as any).price ?? 0).toFixed(2)} / unit
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-sm">
                        <button
                          onClick={() => updateQuantity(item.product._id, -1)}
                          className="px-2 py-1 text-slate-500 hover:text-slate-900 transition"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product._id, 1)}
                          className="px-2 py-1 text-slate-500 hover:text-slate-900 transition"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="w-14 text-right font-mono text-xs font-bold text-slate-900">
                        ${(Number(item.product.sellingPrice ?? (item.product as any).price ?? 0) * item.quantity).toFixed(2)}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.product._id)}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Customer Details */}
            <div className="border-t border-slate-200 pt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in Customer"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0F42C0] focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Phone / Contact
                  </label>
                  <input
                    type="text"
                    value={customerContact}
                    onChange={(e) => setCustomerContact(e.target.value)}
                    placeholder="Optional phone"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0F42C0] focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="border-t border-slate-200 pt-3">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition ${
                    paymentMethod === "cash"
                      ? "border-[#0F42C0] bg-blue-50 text-[#0F42C0] font-bold shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Banknote className="h-3.5 w-3.5 text-emerald-600" /> Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition ${
                    paymentMethod === "card"
                      ? "border-[#0F42C0] bg-blue-50 text-[#0F42C0] font-bold shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5 text-blue-600" /> Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank_transfer")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition ${
                    paymentMethod === "bank_transfer"
                      ? "border-[#0F42C0] bg-blue-50 text-[#0F42C0] font-bold shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Building className="h-3.5 w-3.5 text-purple-600" /> Bank / Pay
                </button>
              </div>

              {/* Cash Tendered Input */}
              {paymentMethod === "cash" && (
                <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Tendered Cash ($)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={cashTendered || ""}
                      onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                      placeholder={grandTotal.toFixed(2)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-900 focus:border-[#0F42C0] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Change Due</label>
                    <p className="py-1 text-xs font-bold text-emerald-600 font-mono">
                      ${changeDue.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Calculations & Grand Total */}
            <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono text-slate-900 font-semibold">${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1">Tax ({taxRate}%)</span>
                <span className="font-mono text-slate-900 font-semibold">${taxAmount.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Discount ($)</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={discount || ""}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-20 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-right font-mono text-xs text-slate-900 focus:bg-white focus:border-[#0F42C0] focus:outline-none"
                />
              </div>

              <div className="flex items-baseline justify-between border-t border-slate-200 pt-2">
                <span className="text-sm font-bold text-slate-900">Grand Total</span>
                <span className="font-mono text-2xl font-black text-slate-900">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Complete Sale Button */}
            <button
              onClick={handleCheckout}
              disabled={submitting || cart.length === 0}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F42C0] py-3 text-sm font-bold text-white shadow-sm shadow-[#0F42C0]/20 transition hover:bg-[#0C369E] disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting ? "Processing Transaction..." : `Charge $${grandTotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <Modal
        title={null}
        open={receiptModalOpen}
        onCancel={() => setReceiptModalOpen(false)}
        footer={null}
        width={420}
        centered
      >
        {completedSale && (
          <div className="p-2 text-slate-800">
            {/* Header */}
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h2 className="text-xl font-black tracking-tight text-slate-900">STOCKWISE</h2>
              <p className="text-[11px] text-slate-500">Smart Retail & Inventory Management</p>
              <p className="mt-1 font-mono text-xs font-semibold text-slate-700">
                Invoice: {completedSale.invoiceNumber}
              </p>
              <p className="text-[10px] text-slate-500">
                {new Date(completedSale.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Customer & Info */}
            <div className="py-2.5 text-xs text-slate-600 border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-semibold text-slate-900">{completedSale.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="font-semibold uppercase text-slate-900">{completedSale.paymentMethod}</span>
              </div>
            </div>

            {/* Items */}
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
                  {(completedSale.items || []).map((item, idx) => {
                    const priceVal = Number(item.price ?? (item as any).unitPrice ?? 0);
                    const qtyVal = Number(item.quantity || 1);
                    const subtotalVal = Number(item.subtotal ?? priceVal * qtyVal);
                    return (
                      <tr key={idx} className="text-slate-700">
                        <td className="py-1 font-medium max-w-[120px] truncate">
                          {item.name || item.product?.name || "Product"}
                        </td>
                        <td className="py-1 text-center">{qtyVal}</td>
                        <td className="py-1 text-right">${priceVal.toFixed(2)}</td>
                        <td className="py-1 text-right font-semibold">
                          ${subtotalVal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="py-2.5 space-y-1 text-xs border-b border-dashed border-slate-300">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>${Number(completedSale.subtotal ?? 0).toFixed(2)}</span>
              </div>
              {Number(completedSale.tax ?? (completedSale as any).taxAmount ?? 0) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax</span>
                  <span>${Number(completedSale.tax ?? (completedSale as any).taxAmount ?? 0).toFixed(2)}</span>
                </div>
              )}
              {Number(completedSale.discount ?? 0) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Discount</span>
                  <span>-${Number(completedSale.discount ?? 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1">
                <span>Total Paid</span>
                <span>${Number(completedSale.total ?? (completedSale as any).grandTotal ?? (completedSale as any).totalAmount ?? 0).toFixed(2)}</span>
              </div>
            </div>

            <p className="mt-4 text-center text-[10px] text-slate-400">
              Thank you for your business! Please keep this receipt for warranty and returns.
            </p>

            {/* Buttons */}
            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <Printer className="h-4 w-4" /> Print Receipt
              </button>
              <button
                onClick={startNewSale}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#0F42C0] py-2 text-xs font-semibold text-white hover:bg-[#0C369E] transition"
              >
                New Sale <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
