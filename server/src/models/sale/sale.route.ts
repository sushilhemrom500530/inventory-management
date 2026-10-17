import express from "express";
import { SaleController } from "./sale.controller";
import { auth } from "../../middlewares/auth";
import validateRequest from "../../shared/validateRequest";
import { SaleValidation } from "./sale.validation";
import { clearCacheMiddleware } from "../../middlewares/cacheMiddleware";

const router = express.Router();

// Checkout route (both POST / and POST /checkout supported)
router.post(
  "/",
  auth("common"),
  clearCacheMiddleware("products"),
  validateRequest(SaleValidation.checkoutSaleZodSchema),
  SaleController.checkoutSale,
);

router.post(
  "/checkout",
  auth("common"),
  clearCacheMiddleware("products"),
  validateRequest(SaleValidation.checkoutSaleZodSchema),
  SaleController.checkoutSale,
);

// Get All Sales (both GET / and GET /get-all supported)
router.get(
  "/",
  auth("common"),
  SaleController.getAllSales,
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

// Get Single Sale (both GET /:id and GET /find/:id supported)
router.get(
  "/find/:id",
  auth("common"),
  SaleController.getSaleById,
);

router.get(
  "/:id",
  auth("common"),
  SaleController.getSaleById,
);

export const SaleRoutes = router;
