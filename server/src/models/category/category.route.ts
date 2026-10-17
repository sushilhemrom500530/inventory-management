import express from "express";
import { CategoryController } from "./category.controller";
import { auth } from "../../middlewares/auth";
import validateRequest from "../../shared/validateRequest";
import { CategoryValidation } from "./category.validation";
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from "../../middlewares/cacheMiddleware";

const router = express.Router();

// Create Category (POST / and POST /create)
router.post(
  "/",
  auth("admin", "manager"),
  clearCacheMiddleware("categories"),
  validateRequest(CategoryValidation.createCategoryZodSchema),
  CategoryController.createCategory,
);

router.post(
  "/create",
  auth("admin", "manager"),
  clearCacheMiddleware("categories"),
  validateRequest(CategoryValidation.createCategoryZodSchema),
  CategoryController.createCategory,
);

// Get All Categories (GET / and GET /get-all)
router.get(
  "/",
  auth("common"),
  cacheMiddleware("categories", 60),
  CategoryController.getAllCategories,
);

router.get(
  "/get-all",
  auth("common"),
  cacheMiddleware("categories", 60),
  CategoryController.getAllCategories,
);

// Get Single Category (GET /:id and GET /find/:id)
router.get(
  "/find/:id",
  auth("common"),
  CategoryController.getCategoryById,
);

router.get(
  "/:id",
  auth("common"),
  CategoryController.getCategoryById,
);

// Update Category (PATCH /:id and PATCH /update/:id)
router.patch(
  "/update/:id",
  auth("admin", "manager"),
  clearCacheMiddleware("categories"),
  validateRequest(CategoryValidation.updateCategoryZodSchema),
  CategoryController.updateCategory,
);

router.patch(
  "/:id",
  auth("admin", "manager"),
  clearCacheMiddleware("categories"),
  validateRequest(CategoryValidation.updateCategoryZodSchema),
  CategoryController.updateCategory,
);

// Delete Category (DELETE /:id and DELETE /delete/:id)
router.delete(
  "/delete/:id",
  auth("admin"),
  clearCacheMiddleware("categories"),
  CategoryController.deleteCategory,
);

router.delete(
  "/:id",
  auth("admin"),
  clearCacheMiddleware("categories"),
  CategoryController.deleteCategory,
);

export const CategoryRoutes = router;
