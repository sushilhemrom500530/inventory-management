import express from "express";
import { SaleController } from "./sale.controller";
import { auth } from "../../middlewares/auth";
import validateRequest from "../../shared/validateRequest";
import { SaleValidation } from "./sale.validation";
import { clearCacheMiddleware } from "../../middlewares/cacheMiddleware";

const router = express.Router();

router.post(
  "/checkout",
  auth("common"),
  clearCacheMiddleware("products"),
  validateRequest(SaleValidation.checkoutSaleZodSchema),
  SaleController.checkoutSale,
);

router.get(
  "/get-all",
  auth("common"),
  SaleController.getAllSales,
);

router.get(
  "/recent",
  auth("common"),
  SaleController.getRecentSales,
);

router.get(
  "/find/:id",
  auth("common"),
  SaleController.getSaleById,
);

export const SaleRoutes = router;
