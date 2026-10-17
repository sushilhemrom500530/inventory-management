import { z } from "zod";

const createCategoryZodSchema = z.object({
  name: z.string({
    message: "Category name is required",
  }).min(2, "Category name must be at least 2 characters").max(60),
  description: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updateCategoryZodSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const CategoryValidation = {
  createCategoryZodSchema,
  updateCategoryZodSchema,
};
