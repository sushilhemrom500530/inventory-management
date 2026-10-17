"use client";
import { ReactNode, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { Layers } from "lucide-react";
import Header from "@/components/dashboard/header";
import Sidebar from "@/components/dashboard/sidebar";
import { useAuthService } from "@/hooks/auth";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [navOpened, setNavOpened] = useState<boolean>(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const { logoutUser } = useAuthService();

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.replace("/auth/login");
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F42C0] text-white shadow-md shadow-[#0F42C0]/20">
            <Layers className="h-6 w-6 animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <h3 className="text-sm font-bold text-slate-900">Verifying Authorization...</h3>
            <p className="text-xs text-slate-500">Securing your session with StockWise Guard</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen h-full bg-[#F8FAFC] text-slate-900">
      {/* Sidebar Component */}
      <Sidebar
        navOpened={navOpened}
        setNavOpened={setNavOpened}
      />

      {/* Main App Container */}
      <div className="flex flex-col flex-1 min-w-0 lg:ml-[288px] transition-all duration-300">
        <Header
          navOpened={navOpened}
          setNavOpened={setNavOpened}
        />

        {/* Content Area */}
        <main className="overflow-y-auto overflow-x-hidden w-full min-h-[calc(100vh-80px)] bg-[#F8FAFC] p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}