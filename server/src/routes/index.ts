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
  {
    path: "/category",
    route: CategoryRoutes,
  },
  {
    path: "/product",
    route: ProductRoutes,
  },
  {
    path: "/stock-movement",
    route: StockMovementRoutes,
  },
  {
    path: "/sale",
    route: SaleRoutes,
  },
  {
    path: "/analytics",
    route: AnalyticsRoutes,
  },
  {
    path: "/ai-advisor",
    route: AIAdvisorRoutes,
  },
];

apiRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
