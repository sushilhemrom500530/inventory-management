"use client";
// StockWise Master Dashboard Layout
import { ReactNode, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { Layers } from "lucide-react";
import Header from "@/components/dashboard/header";
import Sidebar from "@/components/dashboard/sidebar";
import { useAuthService } from "@/hooks/auth";
import { RoleProvider } from "@/context/role-context";

interface DashboardLayoutProps {
  children: ReactNode;
  initialRole?: string;
}

export default function DashboardLayout({ children, initialRole = "" }: DashboardLayoutProps) {
  const router = useRouter();
  const [navOpened, setNavOpened] = useState<boolean>(false);
  const { logoutUser, user: currentUser } = useAuthService();

  useEffect(() => {
    let token = Cookies.get("token");
    if (!token && typeof window !== "undefined") {
      token = localStorage.getItem("token") || undefined;
      if (token) {
        // Sync token back to cookie with root path
        Cookies.set("token", token, { path: "/", expires: 7, sameSite: "lax" });
      }
    }

    if (!token) {
      router.replace(`/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [router]);

  const activeRole = (
    currentUser?.role ||
    initialRole ||
    (typeof window !== "undefined" ? Cookies.get("role") : "") ||
    ""
  ).toLowerCase();

  return (
    <RoleProvider role={activeRole}>
      <div className="flex min-h-screen h-full bg-[#F8FAFC] text-slate-900">
        {/* Sidebar Component */}
        <Sidebar
          navOpened={navOpened}
          setNavOpened={setNavOpened}
          initialRole={activeRole}
        />

        {/* Main App Container */}
        <div className="flex flex-col flex-1 min-w-0 lg:ml-[288px] transition-all duration-300">
          <Header
            navOpened={navOpened}
            setNavOpened={setNavOpened}
            initialRole={activeRole}
          />

          {/* Content Area */}
          <main className="overflow-x-clip w-full min-h-[calc(100vh-80px)] bg-[#F8FAFC] p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </RoleProvider>
  );
} 