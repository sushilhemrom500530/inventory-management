import express from "express";
import { AIAdvisorController } from "./aiAdvisor.controller";
import { auth } from "../../middlewares/auth";
import { cacheMiddleware } from "../../middlewares/cacheMiddleware";

const router = express.Router();

router.get(
  "/forecast",
  auth("admin", "manager"),
  cacheMiddleware("ai_stock_forecast", 60),
  AIAdvisorController.getStockForecast,
);

export const AIAdvisorRoutes = router;
