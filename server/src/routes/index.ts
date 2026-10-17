import express from "express";
import { UserRoutes } from "../models/user/user.route";
import { AuthRoutes } from "../models/auth/auth.route";
import { NotificationRoutes } from "../models/notification/notification.route";
import { CategoryRoutes } from "../models/category/category.route";
import { ProductRoutes } from "../models/product/product.route";
import { StockMovementRoutes } from "../models/stock-movement/stockMovement.route";
import { SaleRoutes } from "../models/sale/sale.route";
import { AnalyticsRoutes } from "../models/analytics/analytics.route";
import { AIAdvisorRoutes } from "../models/ai-advisor/aiAdvisor.route";

const router = express.Router();

const apiRoutes: any[] = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/notification",
    route: NotificationRoutes,
  },
  // Categories (both /category and /categories supported)
  {
    path: "/category",
    route: CategoryRoutes,
  },
  {
    path: "/categories",
    route: CategoryRoutes,
  },
  // Products (both /product and /products supported)
  {
    path: "/product",
    route: ProductRoutes,
  },
  {
    path: "/products",
    route: ProductRoutes,
  },
  // Stock Movements & Ledger
  {
    path: "/stock-movement",
    route: StockMovementRoutes,
  },
  {
    path: "/stock-movements",
    route: StockMovementRoutes,
  },
  // Sales & POS Checkout (both /sale and /sales supported)
  {
    path: "/sale",
    route: SaleRoutes,
  },
  {
    path: "/sales",
    route: SaleRoutes,
  },
  // Dashboard & Analytics (both /dashboard and /analytics supported)
  {
    path: "/analytics",
    route: AnalyticsRoutes,
  },
  {
    path: "/dashboard",
    route: AnalyticsRoutes,
  },
  // AI Advisor (both /ai and /ai-advisor supported)
  {
    path: "/ai-advisor",
    route: AIAdvisorRoutes,
  },
  {
    path: "/ai",
    route: AIAdvisorRoutes,
  },
];

apiRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
