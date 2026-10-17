import express from "express";
import { StockMovementController } from "./stockMovement.controller";
import { auth } from "../../middlewares/auth";
import validateRequest from "../../shared/validateRequest";
import { StockMovementValidation } from "./stockMovement.validation";
import { clearCacheMiddleware } from "../../middlewares/cacheMiddleware";

const router = express.Router();

router.post(
  "/adjust",
  auth("admin", "manager"),
  clearCacheMiddleware("products"),
  validateRequest(StockMovementValidation.recordAdjustmentZodSchema),
  StockMovementController.recordAdjustment,
);

router.get(
  "/product/:productId",
  auth("common"),
  StockMovementController.getMovementsByProduct,
);

router.get(
  "/get-all",
  auth("admin", "manager"),
  StockMovementController.getAllMovements,
);

export const StockMovementRoutes = router;
