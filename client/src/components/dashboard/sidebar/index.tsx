"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import {
    adminMenuData,
    userMenuData,
    user,
} from "../../../data";
import NavItem from "../nav-menu";
import Image from "next/image";
import logo from "@/src/assets/logo.svg";
import {
    LogOut,
} from "lucide-react";
import { useAuthService } from "@/hooks/auth";
import UserAvatar from "@/components/reuseable/user-avatar";

interface SidebarProps {
    navOpened?: boolean;
    setNavOpened?: (opened: boolean) => void;
    isDisabled?: boolean;
}

export default function Sidebar({ navOpened, setNavOpened, isDisabled }: SidebarProps | any) {
    const pathname = usePathname();
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
    const { logoutUser } = useAuthService();
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        try {
            const userStr = Cookies.get("user");
            if (userStr) {
                setCurrentUser(JSON.parse(userStr));
            }
        } catch { }
    }, []);

    const isAdminRoute = Boolean(pathname?.startsWith("/admin"));
    const activeUser = currentUser || user;
    const currentRole = (
        currentUser?.role ||
        (isAdminRoute ? "admin" : Cookies.get("role")) ||
        user?.role ||
        ""
    )?.toLowerCase();

    const isOrganizer = currentRole === "organizer";
    const isAdmin = currentRole === "admin" || currentRole === "super_admin" || isAdminRoute;
    // This pending approval / disable logic is STRICTLY for organizer users
    const isPendingApproval = Boolean(isOrganizer && !isAdmin && (isDisabled || currentUser?.isAdminApprove === false));

    const menuLinks =
        isAdminRoute || currentRole === "admin" || currentRole === "super_admin"
            ? adminMenuData?.linkData
            : userMenuData?.linkData;

    const displayName = currentUser?.name || "User";
    const displayRole = currentUser?.role ? `Verified ${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1).toLowerCase()}` : "Verified Organizer";

    const closeAllSubmenus = (): void => {
        setOpenSubmenu(null);
    };

    const handleSubmenuToggle = (label: string): void => {
        setOpenSubmenu((prev) => (prev === label ? null : label));
    };

    return (
        <>
            {/* Backdrop for mobile */}
            <div
                className={`fixed inset-0 bg-white/50 z-20 lg:hidden transition-opacity ${navOpened ? "opacity-100 block" : "opacity-0 hidden"
                    }`}
                onClick={() => setNavOpened(false)}
            ></div>

            {/* Sidebar */}
            <div
                className={`
          fixed top-0 left-0 z-30 h-screen w-[288px] overflow-y-auto transition-transform duration-300 border-e border-e-[#1E1E1E] bg-natural
          ${navOpened ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0  
        `}
            >
                <div className="flex flex-col gap-5 pt-28 lg:pt-0">
                    <div className="px-2 w-[170px] mx-auto hidden lg:block h-[120px]">
                        <Image
                            src={logo}
                            alt="icon"
                            width={170}
                            height={120}
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <div className="flex flex-col justify-between h-[calc(100vh-150px)]">
                        {isPendingApproval && (
                            <div className="mx-3 mb-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-[11px] font-semibold text-rose-400 text-center flex items-center justify-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                <span>Menus Disabled (Pending Approval)</span>
                            </div>
                        )}
                        <nav className={`flex-1 min-h-0 overflow-y-auto pb-2 px-3 transition-opacity ${isPendingApproval ? "opacity-30 pointer-events-none select-none cursor-not-allowed" : ""}`}>
                            {menuLinks?.map((section, sIndex) => (
                                <div key={sIndex} className="space-y-2">
                                    {section?.menu
                                        ?.filter(
                                            (item) =>
                                                item?.isShow !== false ||
                                                (item?.isShow === false && activeUser?.isBusinessUser),
                                        )
                                        .map((item, index) => (
                                            <NavItem
                                                key={index}
                                                href={item?.href || "#"}
                                                icon={item?.icon}
                                                label={item?.label}
                                                submenu={item?.submenu}
                                                openSubmenu={openSubmenu}
                                                handleSubmenuToggle={handleSubmenuToggle}
                                                setNavOpened={setNavOpened}
                                                closeAllSubmenus={closeAllSubmenus}
                                            />
                                        ))}
                                </div>
                            ))}
                        </nav>
                        {/* Bottom  */}
                        <div className="p-3 border-t border-[#1E1E1E] flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => logoutUser()}
                                className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-300 rounded-full transition-all hover:text-primary hover:bg-primary/10 cursor-pointer w-full text-left"
                            >
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>

                            <div className="flex items-center gap-3 px-2 py-1">
                                <div className="relative w-10 h-10 rounded-full p-[1.5px] border-2 border-primary shrink-0">
                                    <UserAvatar
                                        src={currentUser?.avatar}
                                        name={displayName}
                                        className="w-full h-full rounded-full"
                                        textClassName="text-xs font-bold"
                                    />
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-natural" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-semibold text-white truncate leading-tight">
                                        {displayName}
                                    </span>
                                    <span className="text-xs text-gray-400 truncate leading-tight mt-0.5">
                                        {displayRole}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
