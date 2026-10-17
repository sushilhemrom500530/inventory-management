"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { IoMdMenu } from "react-icons/io";
import {
    Bell,
    ChevronDown,
    Users,
    Wallet,
    User as UserIcon,
    LogOut,
    Trophy,
    FileText,
} from "lucide-react";
import { Dropdown } from "antd";
import { useAuthService } from "@/hooks/auth";
import { useNotifications } from "@/hooks/use-notifications";
import UserAvatar from "@/components/reuseable/user-avatar";

interface HeaderProps {
    navOpened?: boolean;
    setNavOpened?: (opened: boolean) => void;
    isDisabled?: boolean;
}

export default function Header({ navOpened, setNavOpened, isDisabled }: HeaderProps | any) {
    const pathname = usePathname();
    const [dropdownOpen, setDropdownOpen] = useState(false);
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
    const role = (
        currentUser?.role ||
        (isAdminRoute ? "ADMIN" : Cookies.get("role")) ||
        ""
    ).toUpperCase();
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN" || isAdminRoute;
    const isOrganizer = role === "ORGANIZER" && !isAdmin;
    const isPendingApproval = Boolean(isOrganizer && !isAdmin && (isDisabled || currentUser?.isAdminApprove === false));

    const displayName = currentUser?.name || "User";
    const displayEmail = currentUser?.email || "";
    const displayRole = currentUser?.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1).toLowerCase() : (isAdmin ? "Admin" : "Organizer");

    const { unreadCount } = useNotifications({ autoFetch: true });
    const notificationsHref = isAdmin ? "/admin/notifications" : "/user/notifications";

    return (
        <div className="sticky inset-y-0 left-0 z-30 w-full border-b border-b-[#1E1E1E] h-20 bg-natural">
            <header className="flex items-center justify-between h-full px-4 md:px-6">
                {/* Left side / Mobile Menu Toggle */}
                <div
                    onClick={() => setNavOpened(!navOpened)}
                    className="lg:hidden flex items-center justify-center cursor-pointer"
                >
                    <IoMdMenu className="w-10 h-10 rounded-full bg-primary/10 text-primary transition-all duration-300 hover:bg-primary hover:text-white text-center p-2" />
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Right side */}
                <div className="flex items-center gap-4 sm:gap-5">
                    {/* Pending Approval Badge */}
                    {isPendingApproval && (
                        <Link
                            href="/auth/account-setup"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-all cursor-pointer"
                        >
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            <span>Pending Admin Approval</span>
                        </Link>
                    )}

                    {/* Profile Setup Warning Message (Only for non-admin users) */}
                    {!isPendingApproval &&
                        currentUser &&
                        currentUser.isProfileCompleted === false &&
                        currentUser.role?.toUpperCase() !== "ADMIN" &&
                        currentUser.role?.toUpperCase() !== "SUPER_ADMIN" && (
                            <Link
                                href="/auth/account-setup"
                                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-all cursor-pointer"
                            >
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                <span>Remaining: Complete Account Setup</span>
                            </Link>
                        )}

                    {/* Notification Bell */}
                    <Link
                        href={notificationsHref}
                        className={`relative p-2 text-white/80 hover:text-white transition-colors focus:outline-none flex items-center justify-center rounded-xl hover:bg-white/5 ${isPendingApproval ? "opacity-30 pointer-events-none cursor-not-allowed" : "cursor-pointer"
                            }`}
                        aria-label="Notifications"
                    >
                        <Bell className="w-5 h-5 text-white" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#FF2E86] text-white text-[9px] font-black flex items-center justify-center shadow-md shadow-[#FF2E86]/50 animate-pulse">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </Link>

                    {/* Vertical Divider */}
                    <div className="h-7 w-[1px] bg-white/10" />

                    {/* User Profile with Ant Design Dropdown */}
                    <Dropdown
                        open={dropdownOpen}
                        onOpenChange={setDropdownOpen}
                        trigger={["click"]}
                        placement="bottomRight"
                        popupRender={() => (
                            <div className="w-56 sm:w-60 rounded-xl border border-white/10 bg-[#141414] p-2 text-white shadow-2xl backdrop-blur-md">
                                {/* User Info Header */}
                                <div className="px-3 py-2.5 border-b border-white/10">
                                    <div className="flex items-center gap-2.5">
                                        <div className="relative w-8 h-8 rounded-full p-[1px] border border-primary overflow-hidden shrink-0 md:hidden">
                                            <UserAvatar
                                                src={currentUser?.avatar}
                                                name={displayName}
                                                className="w-full h-full rounded-full"
                                                textClassName="text-[10px] font-bold"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold !text-white truncate">{displayName}</p>
                                            {displayEmail && (
                                                <p className="text-xs text-gray-400 truncate mt-0.5">
                                                    {displayEmail}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation Links (Disabled when pending approval for organizer) */}
                                <div className={`py-1.5 space-y-0.5 ${isPendingApproval ? "opacity-30 pointer-events-none select-none" : ""}`}>
                                    {isAdmin ? (
                                        <>
                                            <Link
                                                href="/admin/achievement"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2 text-sm !text-white rounded-lg transition-all hover:bg-white/5 hover:!text-primary group"
                                            >
                                                <Trophy size={16} className="text-white group-hover:text-primary transition-colors" />
                                                <span className="font-medium !text-white group-hover:!text-primary transition-colors">Achievement</span>
                                            </Link>

                                            <Link
                                                href="/admin/wallet"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2 text-sm !text-white rounded-lg transition-all hover:bg-white/5 hover:!text-primary group"
                                            >
                                                <Wallet size={16} className="text-white group-hover:text-primary transition-colors" />
                                                <span className="font-medium !text-white group-hover:!text-primary transition-colors">Wallet</span>
                                            </Link>

                                            <Link
                                                href="/admin/report"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2 text-sm !text-white rounded-lg transition-all hover:bg-white/5 hover:!text-primary group"
                                            >
                                                <FileText size={16} className="text-white group-hover:text-primary transition-colors" />
                                                <span className="font-medium !text-white group-hover:!text-primary transition-colors">Report</span>
                                            </Link>

                                            <Link
                                                href="/admin/notifications"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center justify-between px-3 py-2 text-sm !text-white rounded-lg transition-all hover:bg-white/5 hover:!text-primary group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Bell size={16} className="text-white group-hover:text-primary transition-colors" />
                                                    <span className="font-medium !text-white group-hover:!text-primary transition-colors">Notifications</span>
                                                </div>
                                                {unreadCount > 0 && (
                                                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#FF2E86]/20 text-[#FF2E86] border border-[#FF2E86]/30">
                                                        {unreadCount}
                                                    </span>
                                                )}
                                            </Link>

                                            <Link
                                                href="/admin/settings/profile"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2 text-sm !text-white rounded-lg transition-all hover:bg-white/5 hover:!text-primary group"
                                            >
                                                <UserIcon size={16} className="text-white group-hover:text-primary transition-colors" />
                                                <span className="font-medium !text-white group-hover:!text-primary transition-colors">Profile</span>
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <Link
                                                href="/dashboard/group"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2 text-sm !text-white rounded-lg transition-all hover:bg-white/5 hover:!text-primary group"
                                            >
                                                <Users size={16} className="text-white group-hover:text-primary transition-colors" />
                                                <span className="font-medium !text-white group-hover:!text-primary transition-colors">Group</span>
                                            </Link>

                                            <Link
                                                href="/dashboard/wallet"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2 text-sm !text-white rounded-lg transition-all hover:bg-white/5 hover:!text-primary group"
                                            >
                                                <Wallet size={16} className="text-white group-hover:text-primary transition-colors" />
                                                <span className="font-medium !text-white group-hover:!text-primary transition-colors">Wallet</span>
                                            </Link>

                                            <Link
                                                href="/user/notifications"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center justify-between px-3 py-2 text-sm !text-white rounded-lg transition-all hover:bg-white/5 hover:!text-primary group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Bell size={16} className="text-white group-hover:text-primary transition-colors" />
                                                    <span className="font-medium !text-white group-hover:!text-primary transition-colors">Notifications</span>
                                                </div>
                                                {unreadCount > 0 && (
                                                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#FF2E86]/20 text-[#FF2E86] border border-[#FF2E86]/30">
                                                        {unreadCount}
                                                    </span>
                                                )}
                                            </Link>

                                            <Link
                                                href="/dashboard/profile"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2 text-sm !text-white rounded-lg transition-all hover:bg-white/5 hover:!text-primary group"
                                            >
                                                <UserIcon size={16} className="text-white group-hover:text-primary transition-colors" />
                                                <span className="font-medium !text-white group-hover:!text-primary transition-colors">Profile</span>
                                            </Link>
                                        </>
                                    )}
                                </div>

                                {/* Divider */}
                                <div className="border-t border-white/10 my-1" />

                                {/* Logout */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDropdownOpen(false);
                                        logoutUser();
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm !text-red-500 rounded-lg transition-all hover:bg-red-500/10 hover:!text-red-400 group cursor-pointer text-left"
                                >
                                    <LogOut size={16} className="text-red-500 group-hover:text-red-400 transition-colors" />
                                    <span className="font-medium !text-red-500 group-hover:!text-red-400">Logout</span>
                                </button>
                            </div>
                        )}
                    >
                        <div className="flex items-center gap-2 md:gap-3 cursor-pointer group select-none">
                            <div className="relative w-9 h-9 md:w-10 md:h-10 rounded-full p-[1.5px] border border-primary overflow-hidden shrink-0 transition-transform duration-200 group-hover:scale-105">
                                <UserAvatar
                                    src={currentUser?.avatar}
                                    name={displayName}
                                    className="w-full h-full rounded-full"
                                    textClassName="text-xs font-bold"
                                />
                            </div>
                            <div className="hidden md:flex flex-col text-left">
                                <span className="text-sm font-semibold text-white leading-tight group-hover:text-primary transition-colors truncate max-w-[140px] lg:max-w-[180px]">
                                    {displayName}
                                </span>
                                <span className="text-xs text-gray-400 font-normal truncate max-w-[140px] lg:max-w-[180px]">
                                    {displayRole}
                                </span>
                            </div>
                            <ChevronDown
                                className={`hidden md:block w-4 h-4 text-gray-400 group-hover:text-white transition-transform duration-200 shrink-0 ${dropdownOpen ? "rotate-180 text-white" : ""
                                    }`}
                            />
                        </div>
                    </Dropdown>
                </div>
            </header>
        </div>
    );
}