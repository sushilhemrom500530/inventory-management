"use client";

import React from "react";

export type StockStatusType = "in_stock" | "low_stock" | "out_of_stock" | string;

interface StockBadgeProps {
  status: StockStatusType;
  quantity?: number;
  className?: string;
}

export default function StockBadge({ status, quantity, className = "" }: StockBadgeProps) {
  const normalizedStatus = (status || "").toLowerCase();

  if (normalizedStatus === "out_of_stock" || quantity === 0) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
        <span>Out of Stock</span>
      </span>
    );
  }

  if (normalizedStatus === "low_stock") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
        <span>Low Stock</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
      <span>In Stock</span>
    </span>
  );
}

export { StockBadge };
