"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { adminMenuData } from "@/data";
import NavItem from "../nav-menu";
import Image from "next/image";
import logo from "@/assets/logo.svg";
import { LogOut } from "lucide-react";
import { useAuthService } from "@/hooks/auth";
import UserAvatar from "@/components/reuseable/user-avatar";
import { useUserRole } from "@/context/role-context";

interface SidebarProps {
  navOpened?: boolean;
  setNavOpened?: (opened: boolean) => void;
  initialRole?: string;
}

export default function Sidebar({ navOpened, setNavOpened, initialRole }: SidebarProps) {
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const { logoutUser, user: currentUser } = useAuthService();
  const roleContext = useUserRole();

  const menuSections = adminMenuData?.linkData || [];
  const displayName = currentUser?.fullName || currentUser?.name || "Inventory Manager";
  const userRole = (roleContext?.role || initialRole || currentUser?.role || (typeof window !== "undefined" ? Cookies.get("role") : "") || "").toLowerCase();
  const displayRole = (userRole || "Manager").toUpperCase();
  const isEmployee = roleContext?.isEmployee ?? (userRole === "employee");

  // Filter navigation items: restricted strictly for EMPLOYEE, untouched for admin/manager
  const visibleMenuSections = menuSections
    .map((section) => {
      if (!isEmployee) return section;

      const filteredMenu = section.menu
        .filter((item) => {
          if (item.href === "/ai-advisor") return false;
          if (item.href === "/reports") return false;
          if (item.href === "/settings") return false;
          return true;
        })
        .map((item) => {
          if (item.submenu) {
            return {
              ...item,
              submenu: item.submenu.filter((sub) => sub.href !== "/products/new"),
            };
          }
          return item;
        });

      return {
        ...section,
        menu: filteredMenu,
      };
    })
    .filter((section) => section.menu.length > 0);

  const closeAllSubmenus = (): void => {
    setOpenSubmenu(null);
  };

  const handleSubmenuToggle = (label: string): void => {
    setOpenSubmenu((prev) => (prev === label ? null : label));
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden transition-opacity cursor-pointer ${
          navOpened ? "opacity-100 block" : "opacity-0 hidden"
        }`}
        onClick={() => setNavOpened && setNavOpened(false)}
      />

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 z-30 h-screen w-[288px] overflow-y-auto transition-transform duration-300 border-r border-slate-200 bg-white shadow-sm ${
          navOpened ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            {/* Logo Area */}
            <Link
              href="/dashboard"
              className="p-6 pb-4 flex items-center justify-center border-b border-slate-100 cursor-pointer block"
            >
              <Image
                src={logo}
                alt="StockWise Logo"
                width={170}
                height={46}
                priority
                className="w-auto h-9 object-contain"
              />
            </Link>

            {/* Navigation links */}
            <nav className="p-3 space-y-4">
              {visibleMenuSections.map((section, sIndex) => (
                <div key={sIndex} className="space-y-1">
                  {section.sectionTitle && (
                    <div className="px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {section.sectionTitle}
                    </div>
                  )}
                  {section.menu.map((item, index) => (
                    <NavItem
                      key={index}
                      href={item.href}
                      icon={item.icon}
                      label={item.label}
                      submenu={item.submenu}
                      openSubmenu={openSubmenu}
                      handleSubmenuToggle={handleSubmenuToggle}
                      setNavOpened={setNavOpened || (() => {})}
                      closeAllSubmenus={closeAllSubmenus}
                    />
                  ))}
                </div>
              ))}
            </nav>
          </div>

          {/* User profile & logout bottom strip */}
          <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/80">
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="relative w-10 h-10 rounded-full ring-2 ring-[#0F42C0] shrink-0 overflow-hidden">
                <UserAvatar
                  src={currentUser?.profileUrl}
                  name={displayName}
                  className="w-full h-full rounded-full"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-slate-900 truncate">
                  {displayName}
                </span>
                <span className="text-xs text-[#0F42C0] font-semibold">
                  {displayRole}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => logoutUser()}
              className="flex items-center gap-3 w-full px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
