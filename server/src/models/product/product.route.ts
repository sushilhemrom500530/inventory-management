import express from "express";
import { ProductController } from "./product.controller";
import { auth } from "../../middlewares/auth";
import validateRequest from "../../shared/validateRequest";
import { ProductValidation } from "./product.validation";
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from "../../middlewares/cacheMiddleware";
import { multiUploadHandler } from "../../handler/cloudinary/fileUploadHandler";

const router = express.Router();

router.post(
  "/create",
  auth("admin", "manager"),
  clearCacheMiddleware("products"),
  multiUploadHandler([{ name: "images", maxCount: 5 }, { name: "image", maxCount: 1 }]),
  validateRequest(ProductValidation.createProductZodSchema),
  ProductController.createProduct,
);

router.get(
  "/get-all",
  auth("common"),
  cacheMiddleware("products", 30),
  ProductController.getAllProducts,
);

router.get(
  "/find/:id",
  auth("common"),
  ProductController.getProductById,
);

router.patch(
  "/update/:id",
  auth("admin", "manager"),
  clearCacheMiddleware("products"),
  multiUploadHandler([{ name: "images", maxCount: 5 }, { name: "image", maxCount: 1 }]),
  validateRequest(ProductValidation.updateProductZodSchema),
  ProductController.updateProduct,
);

router.delete(
  "/delete/:id",
  auth("admin"),
  clearCacheMiddleware("products"),
  ProductController.deleteProduct,
);

export const ProductRoutes = router;
