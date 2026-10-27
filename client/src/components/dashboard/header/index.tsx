"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IoMdMenu } from "react-icons/io";
import {
  Bell,
  ChevronDown,
  User as UserIcon,
  LogOut,
  Settings,
  ShoppingCart,
  AlertTriangle,
  Package,
} from "lucide-react";
import { Dropdown } from "antd";
import { useAuthService } from "@/hooks/auth";
import { useNotifications } from "@/hooks/use-notifications";
import UserAvatar from "@/components/reuseable/user-avatar";

interface HeaderProps {
  navOpened?: boolean;
  setNavOpened?: (opened: boolean) => void;
}

export default function Header({ navOpened, setNavOpened }: HeaderProps) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { logoutUser, user: currentUser } = useAuthService();
  const { unreadCount } = useNotifications({ autoFetch: true });

  const displayName = currentUser?.fullName || currentUser?.name || "Inventory Manager";
  const displayEmail = currentUser?.email || "manager@stockwise.com";
  const displayRole = (currentUser?.role || "Manager").toUpperCase();

  // Generate page title from pathname
  const getPageTitle = () => {
    if (!pathname || pathname === "/" || pathname === "/dashboard") return "Dashboard Overview";
    if (pathname.startsWith("/products/new")) return "Add New Product";
    if (pathname.startsWith("/products")) return "Product Catalog";
    if (pathname.startsWith("/categories")) return "Categories";
    if (pathname.startsWith("/sales/checkout")) return "Point of Sale (POS)";
    if (pathname.startsWith("/sales")) return "Sales History";
    if (pathname.startsWith("/alerts")) return "Critical Stock Alerts";
    if (pathname.startsWith("/ai-advisor")) return "AI Stock Advisor";
    if (pathname.startsWith("/reports")) return "Analytics & Reports";
    if (pathname.startsWith("/profile")) return "User Profile";
    if (pathname.startsWith("/settings")) return "Store Settings";
    return "StockWise";
  };

  return (
    <div className="sticky top-0 z-20 w-full border-b border-slate-200 h-20 bg-white/95 backdrop-blur-md shadow-sm">
      <header className="flex items-center justify-between h-full px-4 md:px-8">
        {/* Left Mobile Menu Toggle + Breadcrumb */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setNavOpened && setNavOpened(!navOpened)}
            className="lg:hidden flex items-center justify-center p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            <IoMdMenu className="w-6 h-6" />
          </button>

          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
              {getPageTitle()}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              StockWise Inventory Management System
            </p>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Quick POS Shortcut Button */}
          <Link
            href="/sales/checkout"
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F42C0] hover:bg-[#0C369E] text-white text-xs font-semibold shadow-md shadow-[#0F42C0]/20 transition-all cursor-pointer"
          >
            <ShoppingCart size={14} />
            <span>Quick Sale (POS)</span>
          </Link>

          {/* Low Stock Direct Link */}
          <Link
            href="/alerts"
            className="relative p-2.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="View Critical Alerts"
          >
            <AlertTriangle size={18} />
          </Link>

          {/* Notification Bell */}
          <Link
            href="/notifications"
            className="relative p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#0F42C0] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          <div className="h-6 w-[1px] bg-slate-200 mx-1" />

          {/* User Profile Dropdown */}
          <Dropdown
            open={dropdownOpen}
            onOpenChange={setDropdownOpen}
            trigger={["click"]}
            placement="bottomRight"
            popupRender={() => (
              <div className="w-60 rounded-xl border border-slate-200 bg-white p-2 text-slate-800 shadow-xl">
                {/* User info */}
                <div className="px-3 py-2.5 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{displayEmail}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#0F42C0] border border-blue-200">
                    {displayRole}
                  </span>
                </div>

                {/* Navigation links */}
                <div className="py-1.5 space-y-0.5">
                  <Link
                    href="/products"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <Package size={15} />
                    <span>Product Catalog</span>
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <UserIcon size={15} />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <Settings size={15} />
                    <span>Store Settings</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 my-1" />

                {/* Sign Out */}
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    logoutUser();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-left font-medium"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          >
            <div className="flex items-center gap-2.5 cursor-pointer group select-none py-1 px-1.5 rounded-xl hover:bg-slate-100 transition-colors">
              <div className="relative w-9 h-9 rounded-full ring-2 ring-[#0F42C0] shrink-0 overflow-hidden">
                <UserAvatar
                  src={currentUser?.profileUrl}
                  name={displayName}
                  className="w-full h-full rounded-full"
                />
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 group-hover:text-[#0F42C0] transition-colors truncate max-w-[120px]">
                  {displayName}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {displayRole}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`hidden md:block text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180 text-slate-700" : ""
                  }`}
              />
            </div>
          </Dropdown>
        </div>
      </header>
    </div>
  );
}