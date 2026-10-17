import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Layers,
  AlertTriangle,
  ShoppingCart,
  Receipt,
  Sparkles,
  BarChart3,
  Settings,
  User as UserIcon,
} from "lucide-react";

export const user = {
  name: "Store Manager",
  email: "manager@stockwise.com",
  role: "manager",
  isBusinessUser: true,
  isAdminApprove: true,
  isProfileCompleted: true,
};

export const adminMenuData = {
  linkData: [
    {
      sectionTitle: "Overview",
      menu: [
        {
          label: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          isShow: true,
        },
      ],
    },
    {
      sectionTitle: "Inventory",
      menu: [
        {
          label: "Products",
          href: "/products",
          icon: Package,
          isShow: true,
          submenu: [
            { label: "All Products", href: "/products", icon: Package },
            { label: "Add Product", href: "/products/new", icon: PlusCircle },
          ],
        },
        {
          label: "Categories",
          href: "/categories",
          icon: Layers,
          isShow: true,
        },
        {
          label: "Stock Alerts",
          href: "/alerts",
          icon: AlertTriangle,
          isShow: true,
        },
      ],
    },
    {
      sectionTitle: "Sales & POS",
      menu: [
        {
          label: "Record Sale (POS)",
          href: "/sales/checkout",
          icon: ShoppingCart,
          isShow: true,
        },
        {
          label: "Sales History",
          href: "/sales",
          icon: Receipt,
          isShow: true,
        },
      ],
    },
    {
      sectionTitle: "Intelligence",
      menu: [
        {
          label: "AI Stock Advisor",
          href: "/ai-advisor",
          icon: Sparkles,
          isShow: true,
        },
        {
          label: "Reports & Analytics",
          href: "/reports",
          icon: BarChart3,
          isShow: true,
        },
      ],
    },
    {
      sectionTitle: "System",
      menu: [
        {
          label: "Profile",
          href: "/profile",
          icon: UserIcon,
          isShow: true,
        },
        {
          label: "Settings",
          href: "/settings",
          icon: Settings,
          isShow: true,
        },
      ],
    },
  ],
};

export const userMenuData = adminMenuData;
