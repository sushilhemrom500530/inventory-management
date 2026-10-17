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

// Create Product (POST / and POST /create)
router.post(
  "/",
  auth("admin", "manager"),
  clearCacheMiddleware("products"),
  multiUploadHandler([{ name: "images", maxCount: 5 }, { name: "image", maxCount: 1 }]),
  validateRequest(ProductValidation.createProductZodSchema),
  ProductController.createProduct,
);

router.post(
  "/create",
  auth("admin", "manager"),
  clearCacheMiddleware("products"),
  multiUploadHandler([{ name: "images", maxCount: 5 }, { name: "image", maxCount: 1 }]),
  validateRequest(ProductValidation.createProductZodSchema),
  ProductController.createProduct,
);

// Get All Products (GET / and GET /get-all)
router.get(
  "/",
  auth("common"),
  cacheMiddleware("products", 30),
  ProductController.getAllProducts,
);

router.get(
  "/get-all",
  auth("common"),
  cacheMiddleware("products", 30),
  ProductController.getAllProducts,
);

// Get Single Product (GET /:id and GET /find/:id)
router.get(
  "/find/:id",
  auth("common"),
  ProductController.getProductById,
);

router.get(
  "/:id",
  auth("common"),
  ProductController.getProductById,
);

// Update Product (PATCH /:id and PATCH /update/:id)
router.patch(
  "/update/:id",
  auth("admin", "manager"),
  clearCacheMiddleware("products"),
  multiUploadHandler([{ name: "images", maxCount: 5 }, { name: "image", maxCount: 1 }]),
  validateRequest(ProductValidation.updateProductZodSchema),
  ProductController.updateProduct,
);

router.patch(
  "/:id",
  auth("admin", "manager"),
  clearCacheMiddleware("products"),
  multiUploadHandler([{ name: "images", maxCount: 5 }, { name: "image", maxCount: 1 }]),
  validateRequest(ProductValidation.updateProductZodSchema),
  ProductController.updateProduct,
);

// Delete Product (DELETE /:id and DELETE /delete/:id)
router.delete(
  "/delete/:id",
  auth("admin"),
  clearCacheMiddleware("products"),
  ProductController.deleteProduct,
);

router.delete(
  "/:id",
  auth("admin"),
  clearCacheMiddleware("products"),
  ProductController.deleteProduct,
);

export const ProductRoutes = router;
