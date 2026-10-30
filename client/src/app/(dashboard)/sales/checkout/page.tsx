"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  ArrowLeft,
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
  thumbnail?: string;
  featuredImages?: string[];
  images?: string[];
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const observerRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  const pageRef = useRef<number>(1);
  const hasMoreRef = useRef<boolean>(true);
  const loadingRef = useRef<boolean>(true);
  const loadingMoreRef = useRef<boolean>(false);
  const hasUserScrolledRef = useRef<boolean>(false);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerContact, setCustomerContact] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "bank_transfer">("cash");
  const [taxRate, setTaxRate] = useState<number>(5); // 5% default
  const [discount, setDiscount] = useState<number>(0);
  const [cashTendered, setCashTendered] = useState<number>(0);

  // Mobile layout state
  const [mobileTab, setMobileTab] = useState<"catalog" | "cart">("catalog");

  // Checkout modal
  const [submitting, setSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  const getProductThumbnail = (p: Product) => {
    return (
      p.thumbnail ||
      (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null) ||
      (Array.isArray((p as any).featuredImages) && (p as any).featuredImages.length > 0
        ? (p as any).featuredImages[0]
        : null)
    );
  };

  // Fetch paginated products (page 1 initially, then page 2, 3 on scroll)
  const fetchProductsPage = useCallback(
    async (pageNum: number, isInitial: boolean = false) => {
      if (isFetchingRef.current && !isInitial) return;
      isFetchingRef.current = true;

      try {
        if (isInitial) {
          setLoading(true);
          loadingRef.current = true;
          hasUserScrolledRef.current = false;
        } else {
          setLoadingMore(true);
          loadingMoreRef.current = true;
        }

        const params = new URLSearchParams();
        params.append("page", String(pageNum));
        params.append("limit", "10");
        if (searchQuery.trim()) {
          params.append("searchTerm", searchQuery.trim());
        }
        if (selectedCategory && selectedCategory !== "all") {
          params.append("category", selectedCategory);
        }

        const res = await fetchApi<any>(`/products?${params.toString()}`);

        const rawProds = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : [];

        const safeProds: Product[] = rawProds.map((p: any) => ({
          ...p,
          sellingPrice: Number(p.sellingPrice ?? p.price ?? 0),
          costPrice: Number(p.costPrice ?? 0),
          quantity: Number(p.quantity ?? 0),
          status: p.status || (p.quantity <= 0 ? "out_of_stock" : "in_stock"),
          thumbnail:
            p.thumbnail ||
            (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : undefined) ||
            (Array.isArray(p.featuredImages) && p.featuredImages.length > 0
              ? p.featuredImages[0]
              : undefined),
        }));

        const meta = res?.meta || res?.data?.meta;
        const total = Number(meta?.totalResult ?? meta?.total ?? meta?.totalCount ?? 0);
        const totalPage = Number(
          meta?.totalPage ?? meta?.totalPages ?? (total > 0 ? Math.ceil(total / 10) : 1)
        );

        if (total > 0) {
          setTotalProducts(total);
        }

        if (isInitial) {
          setProducts(safeProds);
        } else {
          setProducts((prev) => {
            const existingIds = new Set(prev.map((i) => i._id));
            const fresh = safeProds.filter((i) => !existingIds.has(i._id));
            return [...prev, ...fresh];
          });
        }

        setPage(pageNum);
        pageRef.current = pageNum;

        // Has more items if current page is less than totalPage and we retrieved items
        const hasNext = pageNum < totalPage && safeProds.length >= 10;
        setHasMore(hasNext);
        hasMoreRef.current = hasNext;
      } catch (err: any) {
        console.warn("Failed to load products page:", err);
        if (isInitial) {
          message.error(err?.message || "Failed to load products for POS");
        }
      } finally {
        setLoading(false);
        loadingRef.current = false;
        setLoadingMore(false);
        loadingMoreRef.current = false;
        isFetchingRef.current = false;
      }
    },
    [searchQuery, selectedCategory]
  );

  // Trigger loading next page
  const triggerLoadMore = useCallback(() => {
    if (
      !hasMoreRef.current ||
      loadingRef.current ||
      loadingMoreRef.current ||
      isFetchingRef.current
    ) {
      return;
    }
    const nextPage = pageRef.current + 1;
    fetchProductsPage(nextPage, false);
  }, [fetchProductsPage]);

  // Load Categories on mount
  useEffect(() => {
    fetchApi<any>("/categories")
      .then((catRes) => {
        const rawCats = Array.isArray(catRes?.data)
          ? catRes.data
          : Array.isArray(catRes?.data?.data)
            ? catRes.data.data
            : [];
        setCategories(rawCats);
      })
      .catch((err) => {
        console.warn("Categories fetch error:", err);
      });
  }, []);

  // Fetch page 1 when search or category filter changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      pageRef.current = 1;
      hasMoreRef.current = true;
      hasUserScrolledRef.current = false;
      setPage(1);
      setHasMore(true);
      fetchProductsPage(1, true);
    }, 250);

    return () => clearTimeout(timer);
  }, [fetchProductsPage]);

  // User Scroll detection & Infinite Scroll Trigger
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      if (scrollTop > 20) {
        hasUserScrolledRef.current = true;
      }

      if (
        !hasUserScrolledRef.current ||
        !hasMoreRef.current ||
        loadingRef.current ||
        loadingMoreRef.current ||
        isFetchingRef.current
      ) {
        return;
      }

      const scrollHeight = document.documentElement.scrollHeight || 0;
      const clientHeight = window.innerHeight || 0;

      // When within 250px of bottom and user has scrolled down
      if (scrollTop + clientHeight >= scrollHeight - 250) {
        triggerLoadMore();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [triggerLoadMore]);

  // IntersectionObserver for sentinel when user scrolls near the bottom
  useEffect(() => {
    const sentinel = observerRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasUserScrolledRef.current &&
          (window.scrollY > 20 || document.documentElement.scrollTop > 20) &&
          hasMoreRef.current &&
          !loadingRef.current &&
          !loadingMoreRef.current &&
          !isFetchingRef.current
        ) {
          triggerLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, triggerLoadMore]);

  // Manual Reload
  const loadData = async () => {
    try {
      const catRes = await fetchApi<any>("/categories");
      const rawCats = Array.isArray(catRes?.data)
        ? catRes.data
        : Array.isArray(catRes?.data?.data)
          ? catRes.data.data
          : [];
      setCategories(rawCats);
    } catch (err) {
      console.warn("Categories fetch error:", err);
    }
    await fetchProductsPage(1, true);
  };

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
        setMobileTab("catalog");
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
    setMobileTab("catalog");
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

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
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
          >
            <Receipt className="h-4 w-4" /> Sales History
          </Link>
          <button
            onClick={loadData}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
            title="Refresh Inventory"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#0F42C0]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile View Toggle: Catalog vs Cart */}
      <div className="flex lg:hidden items-center rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setMobileTab("catalog")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${mobileTab === "catalog"
            ? "bg-white text-slate-900 shadow-xs"
            : "text-slate-600 hover:text-slate-900"
            }`}
        >
          <Package className="h-3.5 w-3.5" />
          <span>Catalog ({filteredProducts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("cart")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition cursor-pointer relative ${mobileTab === "cart"
            ? "bg-white text-[#0F42C0] shadow-xs"
            : "text-slate-600 hover:text-slate-900"
            }`}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          <span>Order ({totalCartCount})</span>
          {totalCartCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#0F42C0] text-white text-[10px] font-bold">
              ${grandTotal.toFixed(2)}
            </span>
          )}
        </button>
      </div>

      {/* POS Grid: Catalog (Left 65%) vs Cart / Register (Right 35%) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start relative">
        {/* Left Column: Product Selection */}
        <div
          className={`space-y-4 lg:col-span-7 xl:col-span-8 ${mobileTab === "cart" ? "hidden lg:block" : "block"
            }`}
        >
          {/* Search & Category Pills */}
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs">
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
                className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer shrink-0 ${selectedCategory === "all"
                  ? "bg-[#0F42C0] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
              >
                All Products ({totalProducts > 0 ? totalProducts : products.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c._id}
                  onClick={() => setSelectedCategory(c._id)}
                  className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer shrink-0 ${selectedCategory === c._id
                    ? "bg-[#0F42C0] text-white shadow-xs"
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
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <Package className="mx-auto h-10 w-10 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-900">No products match your filter</p>
              <p className="mt-1 text-xs text-slate-500">Check spelling or clear active category filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 sm:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((p) => {
                const cartEntry = cart.find((i) => i.product._id === p._id);
                const inCartQty = cartEntry?.quantity || 0;
                const isOutOfStock = p.quantity <= 0;
                const isMaxInCart = inCartQty >= p.quantity;
                const thumbUrl = getProductThumbnail(p);

                return (
                  <div
                    key={p._id}
                    onClick={() => !isOutOfStock && !isMaxInCart && addToCart(p)}
                    className={`group relative flex flex-col justify-between rounded-xl sm:rounded-2xl border transition-all duration-200 select-none overflow-hidden ${isOutOfStock
                      ? "border-slate-200 bg-slate-50/70 opacity-60 cursor-not-allowed"
                      : isMaxInCart
                        ? "border-blue-300 bg-blue-50/40 shadow-2xs cursor-default ring-1 ring-[#0F42C0]/20"
                        : inCartQty > 0
                          ? "border-blue-200 bg-white shadow-2xs ring-1 ring-blue-100 hover:border-[#0F42C0] hover:shadow-md cursor-pointer"
                          : "border-slate-200 bg-white hover:border-[#0F42C0] hover:shadow-md cursor-pointer"
                      }`}
                  >
                    {/* Thumbnail Image Container */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100/90 border-b border-slate-100 flex items-center justify-center">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={p.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                            const fallback = (e.currentTarget.parentElement?.querySelector(".img-fallback")) as HTMLElement;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}

                      {/* Fallback Icon */}
                      <div
                        className={`img-fallback flex flex-col items-center justify-center text-slate-300 ${thumbUrl ? "hidden" : "flex"
                          }`}
                      >
                        <Package className="h-7 w-7 sm:h-9 sm:w-9 stroke-[1.5]" />
                      </div>

                      {/* Floating Badges */}
                      {/* Top-Left: SKU */}
                      <div className="absolute top-2 left-2 z-10">
                        <span className="font-mono text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-slate-600 border border-slate-200/80 shadow-2xs truncate max-w-[75px] sm:max-w-[100px] inline-block">
                          {p.sku}
                        </span>
                      </div>

                      {/* Top-Right: Stock badge */}
                      <div className="absolute top-2 right-2 z-10">
                        <span
                          className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md border shadow-2xs backdrop-blur-xs ${p.quantity > 5
                            ? "bg-emerald-50/95 text-emerald-700 border-emerald-200"
                            : p.quantity > 0
                              ? "bg-amber-50/95 text-amber-700 border-amber-200"
                              : "bg-rose-50/95 text-rose-700 border-rose-200"
                            }`}
                        >
                          {p.quantity} left
                        </span>
                      </div>

                      {/* In-Cart Overlay Badge */}
                      {inCartQty > 0 && (
                        <div className="absolute bottom-2 left-2 z-10">
                          <span className="flex items-center gap-1 rounded-md bg-[#0F42C0] px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-white shadow-xs">
                            <span>In Cart: {inCartQty}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-2.5 sm:p-3 flex flex-col justify-between flex-1">
                      <div>
                        <h4 className="text-[11px] sm:text-xs font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-[#0F42C0] transition-colors min-h-[1.75rem] sm:min-h-[2rem]">
                          {p.name}
                        </h4>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2">
                        <div className="flex flex-col">
                          <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium leading-none mb-0.5">Price</span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                            ${Number(p.sellingPrice ?? (p as any).price ?? 0).toFixed(2)}
                          </span>
                        </div>

                        {inCartQty > 0 ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(p._id, -1);
                              }}
                              className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                              title="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="flex h-6 min-w-[20px] sm:h-7 sm:min-w-[24px] px-1 items-center justify-center rounded-md bg-[#0F42C0] text-[11px] sm:text-xs font-bold text-white shadow-2xs">
                              {inCartQty}
                            </span>
                            <button
                              type="button"
                              disabled={isMaxInCart}
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(p);
                              }}
                              className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-slate-100 hover:bg-[#0F42C0] hover:text-white text-slate-700 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p);
                            }}
                            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-[#0F42C0] hover:text-white hover:shadow-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Add to Cart"
                          >
                            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Infinite Scroll Sentinel & Loading Indicator */}
          {products.length > 0 && (
            <div className="w-full">
              {/* Invisible sentinel for scroll detection when more data exists */}
              {hasMore && <div ref={observerRef} className="h-4 w-full pointer-events-none" />}

              {/* Show loading spinner while fetching next page on scroll */}
              {loadingMore && (
                <div className="py-4 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-[#0F42C0] shadow-2xs">
                    <RefreshCw className="h-4 w-4 animate-spin text-[#0F42C0]" />
                    <span>Loading more products...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Register & Cart (Sticky on Scroll) */}
        <div
          className={`space-y-4 lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 lg:self-start z-10 ${mobileTab === "catalog" ? "hidden lg:block" : "block"
            }`}
        >
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            {/* Cart Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-[#0F42C0]" />
                <h3 className="text-sm font-bold text-slate-900">Active Order</h3>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#0F42C0] border border-blue-100">
                  {totalCartCount} items
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileTab("catalog")}
                  className="lg:hidden flex items-center gap-1 text-xs font-semibold text-[#0F42C0] hover:underline cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>+ Add items</span>
                </button>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs font-medium text-rose-600 hover:text-rose-700 transition cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Cart Items List */}
            <div className="my-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-12 text-center">
                  <ShoppingCart className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Cart is empty</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Click items in the catalog to add them to this sale.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMobileTab("catalog")}
                    className="lg:hidden mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F42C0] text-white text-xs font-semibold"
                  >
                    <Package className="h-3.5 w-3.5" />
                    Browse Products
                  </button>
                </div>
              ) : (
                cart.map((item) => {
                  const itemThumb = getProductThumbnail(item.product);
                  return (
                    <div
                      key={item.product._id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-2 sm:p-2.5 transition hover:bg-slate-50"
                    >
                      {/* Left: Product Thumbnail and Name */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white flex items-center justify-center">
                          {itemThumb ? (
                            <img
                              src={itemThumb}
                              alt={item.product.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                                const fallback = (e.currentTarget.parentElement?.querySelector(".cart-img-fallback")) as HTMLElement;
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className={`cart-img-fallback flex items-center justify-center text-slate-300 ${itemThumb ? "hidden" : "flex"
                              }`}
                          >
                            <Package className="h-5 w-5" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">{item.product.name}</p>
                          <p className="font-mono text-[10px] text-slate-500">
                            ${Number(item.product.sellingPrice ?? (item.product as any).price ?? 0).toFixed(2)} / unit
                          </p>
                        </div>
                      </div>

                      {/* Right: Quantity Adjuster, Total & Delete */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product._id, -1)}
                            className="flex h-7 w-7 items-center justify-center text-slate-500 hover:text-slate-900 transition cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-[20px] px-1 text-center text-xs font-bold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product._id, 1)}
                            className="flex h-7 w-7 items-center justify-center text-slate-500 hover:text-slate-900 transition cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <span className="w-14 text-right font-mono text-xs font-bold text-slate-900">
                          ${(Number(item.product.sellingPrice ?? (item.product as any).price ?? 0) * item.quantity).toFixed(2)}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product._id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Customer Details */}
            <div className="border-t border-slate-200 pt-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition cursor-pointer ${paymentMethod === "cash"
                    ? "border-[#0F42C0] bg-blue-50 text-[#0F42C0] font-bold shadow-2xs"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  <Banknote className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition cursor-pointer ${paymentMethod === "card"
                    ? "border-[#0F42C0] bg-blue-50 text-[#0F42C0] font-bold shadow-2xs"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  <CreditCard className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank_transfer")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition cursor-pointer ${paymentMethod === "bank_transfer"
                    ? "border-[#0F42C0] bg-blue-50 text-[#0F42C0] font-bold shadow-2xs"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  <Building className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                  <span className="truncate">Bank / Pay</span>
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
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F42C0] py-3 text-sm font-bold text-white shadow-sm shadow-[#0F42C0]/20 transition hover:bg-[#0C369E] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting ? "Processing Transaction..." : `Charge $${grandTotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div >

      {/* Sticky Mobile Floating Cart Bar (when items are in cart and viewing catalog on mobile) */}
      {
        cart.length > 0 && mobileTab === "catalog" && (
          <div className="fixed bottom-3 left-3 right-3 z-30 lg:hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-900/95 backdrop-blur-md p-3 text-white shadow-2xl border border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F42C0] text-white shadow-sm">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-slate-900">
                    {totalCartCount}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] text-slate-300">
                    {totalCartCount} {totalCartCount === 1 ? "item" : "items"} in order
                  </p>
                  <p className="font-mono text-sm font-bold text-white">
                    ${grandTotal.toFixed(2)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileTab("cart")}
                className="flex items-center gap-1.5 rounded-xl bg-[#0F42C0] hover:bg-[#0C369E] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition cursor-pointer"
              >
                <span>View Order & Pay</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )
      }

      {/* Printable Receipt Modal */}
      < Modal
        title={null}
        open={receiptModalOpen}
        onCancel={() => setReceiptModalOpen(false)}
        footer={null}
        width={420}
        centered
        className="max-w-[95vw] sm:max-w-[420px]"
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
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Print Receipt
              </button>
              <button
                onClick={startNewSale}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#0F42C0] py-2 text-xs font-semibold text-white hover:bg-[#0C369E] transition cursor-pointer"
              >
                New Sale <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div >
  );
}
