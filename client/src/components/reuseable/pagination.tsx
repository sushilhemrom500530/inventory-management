"use client";

import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalResults: number;
  totalPages: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
  className?: string;
}

export function getPaginationRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number = 1
): (number | string)[] {
  if (totalPages <= 1) return [1];

  const totalNumbers = siblingCount * 2 + 5;
  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages);
  const showLeftDots = leftSibling > 3;
  const showRightDots = rightSibling < totalPages - 2;

  // Case 1: Only right dots (near beginning)
  if (!showLeftDots && showRightDots) {
    const leftRange = [1, 2, 3, 4, 5];
    return [...leftRange, "...", totalPages - 1, totalPages];
  }

  // Case 2: Only left dots (near end)
  if (showLeftDots && !showRightDots) {
    const rightRange = [
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
    return [1, 2, "...", ...rightRange];
  }

  // Case 3: Both left and right dots (middle)
  if (showLeftDots && showRightDots) {
    const middle: number[] = [];
    for (let i = leftSibling; i <= rightSibling; i++) {
      middle.push(i);
    }
    return [1, 2, "...", ...middle, "...", totalPages - 1, totalPages];
  }

  return Array.from({ length: totalPages }, (_, i) => i + 1);
}

export default function Pagination({
  currentPage,
  totalResults,
  totalPages,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  itemName = "records",
  className = "",
}: PaginationProps) {
  const fromRecord = totalResults === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toRecord = Math.min(currentPage * pageSize, totalResults);

  const paginationItems = useMemo(() => {
    return getPaginationRange(currentPage, totalPages);
  }, [currentPage, totalPages]);

  // Only show pagination when there are more than 10 records or more than 1 page
  if (totalResults <= 10 && totalPages <= 1) return null;

  return (
    <div
      className={`p-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 bg-white select-none ${className}`}
    >
      {/* Left side: Current page, item range, and total records */}
      <div className="flex flex-wrap items-center gap-3 text-slate-600">
        <div className="flex items-center gap-1.5">
          <span>Showing</span>
          <span className="font-bold text-slate-900">
            {fromRecord}–{toRecord}
          </span>
          <span>of</span>
          <span className="font-bold text-slate-900">
            {totalResults.toLocaleString()}
          </span>
          <span>{itemName}</span>
        </div>

        <span className="hidden sm:inline-block h-3 w-px bg-slate-200" />

        <div className="flex items-center gap-1">
          <span>Page</span>
          <span className="font-bold text-[#0F42C0]">{currentPage}</span>
          <span>of</span>
          <span className="font-bold text-slate-800">{Math.max(1, totalPages)}</span>
        </div>

        {/* Optional Page Size Selector */}
        {onPageSizeChange && (
          <>
            <span className="hidden sm:inline-block h-3 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0F42C0] cursor-pointer"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Right side: Pagination Navigation Row */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
        {/* Previous Button */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0F42C0] hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page Numbers and Ellipses */}
        {paginationItems.map((item, index) => {
          if (item === "...") {
            // Determine whether it's left or right ellipsis for smart quick-jump
            const isLeft = index < paginationItems.length / 2;
            const jumpTarget = isLeft
              ? Math.max(1, currentPage - 5)
              : Math.min(totalPages, currentPage + 5);

            return (
              <button
                key={`ellipsis-${index}`}
                type="button"
                onClick={() => onPageChange(jumpTarget)}
                title={isLeft ? "Jump 5 pages backward" : "Jump 5 pages forward"}
                className="min-w-[34px] h-[34px] px-2 rounded-xl text-xs font-bold text-slate-400 hover:text-[#0F42C0] hover:bg-slate-50 transition-colors flex items-center justify-center cursor-pointer tracking-wider"
              >
                ...
              </button>
            );
          }

          const pageNum = Number(item);
          const isActive = pageNum === currentPage;

          return (
            <button
              key={`page-${pageNum}`}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`min-w-[34px] h-[34px] px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                isActive
                  ? "bg-[#0F42C0] text-white border border-[#0F42C0]"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-[#0F42C0] hover:border-slate-300"
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0F42C0] hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4 shrink-0" />
        </button>
      </div>
    </div>
  );
}
