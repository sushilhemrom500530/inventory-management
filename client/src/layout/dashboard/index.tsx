"use client";
import { ReactNode, useState, useEffect } from "react";
import { Inter } from "next/font/google";
import Link from "next/link";
import Cookies from "js-cookie";
import { Modal, ConfigProvider, theme } from "antd";
import { ShieldAlert, Hourglass, ArrowRight, LogOut, PhoneCall } from "lucide-react";
import Header from "@/components/header";
import Sidebar from "@/components/header/sidebar";
import { useAuthService } from "@/hooks/auth";

const inter = Inter({ subsets: ["latin"] });

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [navOpened, setNavOpened] = useState<boolean>(false);
    const [isNotApproved, setIsNotApproved] = useState<boolean>(false);
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const { logoutUser } = useAuthService();

    useEffect(() => {
        try {
            const userStr = Cookies.get("user");
            const isApprovedCookie = Cookies.get("isAdminApprove");
            if (userStr) {
                const user = JSON.parse(userStr);
                const role = (user?.role || Cookies.get("role") || "")?.toUpperCase();
                const isOrganizer = role === "ORGANIZER";
                // ONLY organizer accounts are subject to admin approval restriction
                if (isOrganizer && (user?.isAdminApprove === false || isApprovedCookie === "false")) {
                    setIsNotApproved(true);
                    setModalOpen(true);
                }
            } else {
                const role = (Cookies.get("role") || "")?.toUpperCase();
                if (role === "ORGANIZER" && isApprovedCookie === "false") {
                    setIsNotApproved(true);
                    setModalOpen(true);
                }
            }
        } catch { }
    }, []);

    return (
        <div className={`${inter.className} flex min-h-screen h-full bg-[#0A0A0C]`}>
            {/* Side Bar (Disabled when not approved) */}
            <Sidebar
                navOpened={navOpened}
                setNavOpened={setNavOpened}
                isDisabled={isNotApproved}
            />

            {/* Top and Children Content */}
            <div className="flex flex-col flex-1 min-w-0 lg:ml-[288px] transition-all duration-300">
                <Header
                    navOpened={navOpened}
                    setNavOpened={setNavOpened}
                    isDisabled={isNotApproved}
                />

                {/* Top Banner when modal is dismissed */}
                {isNotApproved && !modalOpen && (
                    <div className="bg-rose-950/70 border-b border-rose-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-rose-200 sticky top-0 z-20 backdrop-blur-md">
                        <div className="flex items-center gap-2">
                            <ShieldAlert size={16} className="text-rose-400 shrink-0" />
                            <span>
                                <strong>Account Not Approved:</strong> Your organizer account is not approved by an admin yet. All menus and actions are disabled.
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setModalOpen(true)}
                                className="px-3 py-1 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-white font-semibold text-[11px] border border-rose-500/40 transition-colors cursor-pointer"
                            >
                                View Notice
                            </button>
                            <button
                                type="button"
                                onClick={() => logoutUser()}
                                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-medium text-[11px] transition-colors cursor-pointer"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                )}

                {/* Main Content (Blurred & Disabled when not approved) */}
                <main
                    className={`overflow-y-auto overflow-x-hidden w-full min-h-[calc(100vh-178px)] h-full bg-natural font-primary p-4 md:p-6 lg:p-8 relative transition-all ${isNotApproved ? "pointer-events-none select-none opacity-30 filter blur-[0.5px]" : ""
                        }`}
                >
                    {children}
                </main>
            </div>

            {/* Account Pending Admin Approval Modal */}
            <ConfigProvider
                theme={{
                    algorithm: theme.darkAlgorithm,
                    token: {
                        colorBgElevated: "#141416",
                        colorBorder: "#26262B",
                        colorText: "#FFFFFF",
                        colorPrimary: "#FF2E86",
                        borderRadiusLG: 24,
                    },
                }}
            >
                <Modal
                    open={modalOpen}
                    onCancel={() => setModalOpen(false)}
                    footer={null}
                    centered
                    width={480}
                    closable={true}
                    mask={{ closable: false }}
                    styles={{
                        mask: { backdropFilter: "blur(8px)", background: "rgba(0, 0, 0, 0.75)" },
                    }}
                >
                    <div className="flex flex-col items-center text-center space-y-5 p-2 sm:p-4">
                        {/* Animated Warning Icon */}
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full bg-[#38101E] border border-[#FF2E86]/40 flex items-center justify-center text-[#FF2E86] shadow-lg shadow-pink-500/20">
                                <Hourglass size={30} className="animate-pulse" />
                            </div>
                            <div className="absolute -inset-1 rounded-full bg-[#FF2E86]/20 blur-md -z-10" />
                        </div>

                        {/* Modal Heading & Description */}
                        <div className="space-y-2">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                                Account Not Approved By Admin
                            </h2>
                            <p className="text-xs sm:text-sm text-[#8E8E93] leading-relaxed max-w-sm mx-auto">
                                Your organizer account has not been approved by an administrator yet. That is why you cannot perform any actions or access dashboard features from here.
                            </p>
                        </div>

                        {/* Status Pill */}
                        <div className="px-3.5 py-1.5 rounded-full bg-[#1C1C20] border border-[#2E2E34] text-xs text-[#CCCCCC] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                            <span className="font-medium text-amber-400">Status: Pending Admin Review</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="w-full space-y-2.5 pt-2">
                            <Link
                                href="/auth/account-setup"
                                className="w-full py-3 px-4 rounded-full text-xs font-bold !text-white bg-gradient-to-r from-[#FF2E86] to-[#FF7A1A] hover:opacity-95 transition-all shadow-md shadow-pink-500/25 flex items-center justify-center gap-2"
                            >
                                <span>View Application Status</span>
                                <ArrowRight size={14} />
                            </Link>

                            <div className="flex gap-2.5 w-full">
                                <Link
                                    href="/contact"
                                    className="flex-1 py-2.5 px-3 rounded-full text-xs font-semibold !text-[#CCCCCC] bg-[#1C1C20] hover:bg-[#26262B] border border-[#2E2E34] transition-all flex items-center justify-center gap-1.5"
                                >
                                    <PhoneCall size={13} />
                                    <span>Support</span>
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => logoutUser()}
                                    className="flex-1 py-2.5 px-3 rounded-full text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <LogOut size={13} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>
            </ConfigProvider>
        </div>
    );
}