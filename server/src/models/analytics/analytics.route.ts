import express from "express";
import { AnalyticsController } from "./analytics.controller";
import { auth } from "../../middlewares/auth";
import { cacheMiddleware } from "../../middlewares/cacheMiddleware";

const router = express.Router();

router.get(
  "/dashboard-overview",
  auth("common"),
  cacheMiddleware("dashboard_overview", 30),
  AnalyticsController.getDashboardOverview,
);

router.get(
  "/low-stock-alerts",
  auth("common"),
  AnalyticsController.getLowStockAlerts,
);

export const AnalyticsRoutes = router;
