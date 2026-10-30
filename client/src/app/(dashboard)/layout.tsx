import { cookies } from "next/headers";
import DashboardLayout from "@/layout/dashboard";

function extractRoleFromToken(token?: string): string {
  if (!token) return "";
  try {
    const parts = token.split(".");
    if (parts.length >= 2) {
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const jsonStr = typeof Buffer !== "undefined"
        ? Buffer.from(base64, "base64").toString("utf-8")
        : atob(base64);
      const payload = JSON.parse(jsonStr);
      return (payload.role || "").toLowerCase();
    }
  } catch {
    return "";
  }
  return "";
}

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const roleFromCookie = cookieStore.get("role")?.value || "";
  const token = cookieStore.get("token")?.value || "";
  const initialRole = (roleFromCookie || extractRoleFromToken(token)).toLowerCase();

  return <DashboardLayout initialRole={initialRole}>{children}</DashboardLayout>;
}