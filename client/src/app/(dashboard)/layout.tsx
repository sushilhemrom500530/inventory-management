import DashboardLayout from "@/layout/dashboard";

export default function SiteLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return <DashboardLayout>{children}</DashboardLayout>;
}