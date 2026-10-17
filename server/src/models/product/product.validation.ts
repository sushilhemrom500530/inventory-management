import { z } from "zod";

const createProductZodSchema = z.object({
  name: z.string({
    message: "Product name is required",
  }).min(2, "Product name must be at least 2 characters"),
  sku: z.string({
    message: "SKU is required",
  }).min(2, "SKU must be at least 2 characters"),
  barcode: z.string().optional(),
  category: z.string({
    message: "Category is required",
  }),
  description: z.string().optional(),
  costPrice: z.number({
    message: "Cost price is required",
  }).min(0, "Cost price cannot be negative"),
  sellingPrice: z.number({
    message: "Selling price is required",
  }).min(0, "Selling price cannot be negative"),
  quantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  unit: z.string().optional().default("pcs"),
  images: z.array(z.string()).optional(),
});

const updateProductZodSchema = z.object({
  name: z.string().min(2).optional(),
  sku: z.string().min(2).optional(),
  barcode: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  costPrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  quantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  unit: z.string().optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(["in_stock", "low_stock", "out_of_stock"]).optional(),
});

export const ProductValidation = {
  createProductZodSchema,
  updateProductZodSchema,
};
