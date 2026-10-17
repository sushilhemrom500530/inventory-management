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

router.post(
  "/create",
  auth("admin", "manager"),
  clearCacheMiddleware("categories"),
  validateRequest(CategoryValidation.createCategoryZodSchema),
  CategoryController.createCategory,
);

router.get(
  "/get-all",
  auth("common"),
  cacheMiddleware("categories", 60),
  CategoryController.getAllCategories,
);

router.get(
  "/find/:id",
  auth("common"),
  CategoryController.getCategoryById,
);

router.patch(
  "/update/:id",
  auth("admin", "manager"),
  clearCacheMiddleware("categories"),
  validateRequest(CategoryValidation.updateCategoryZodSchema),
  CategoryController.updateCategory,
);

router.delete(
  "/delete/:id",
  auth("admin"),
  clearCacheMiddleware("categories"),
  CategoryController.deleteCategory,
);

export const CategoryRoutes = router;
