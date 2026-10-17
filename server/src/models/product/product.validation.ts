import { z } from "zod";

const createProductZodSchema = z
  .object({
    name: z
      .string({
        message: "Product name is required",
      })
      .min(2, "Product name must be at least 2 characters"),
    sku: z
      .string({
        message: "SKU is required",
      })
      .min(2, "SKU must be at least 2 characters"),
    barcode: z.string().optional(),
    category: z.string().optional(),
    categoryId: z.string().optional(),
    description: z.string().optional(),
    costPrice: z.number().min(0, "Cost price cannot be negative").optional(),
    sellingPrice: z.number().min(0, "Selling price cannot be negative").optional(),
    price: z.number().min(0, "Price cannot be negative").optional(),
    quantity: z.number().int().min(0).default(0),
    lowStockThreshold: z.number().int().min(0).optional(),
    reorderLevel: z.number().int().min(0).optional(),
    unit: z.string().optional().default("pcs"),
    images: z.array(z.string()).optional(),
  })
  .refine((data) => data.category || data.categoryId, {
    message: "Category (or categoryId) is required",
    path: ["category"],
  })
  .refine((data) => data.sellingPrice !== undefined || data.price !== undefined, {
    message: "Selling price (or price) is required",
    path: ["sellingPrice"],
  });

const updateProductZodSchema = z.object({
  name: z.string().min(2).optional(),
  sku: z.string().min(2).optional(),
  barcode: z.string().optional(),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  costPrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  price: z.number().min(0).optional(),
  quantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  reorderLevel: z.number().int().min(0).optional(),
  unit: z.string().optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(["in_stock", "low_stock", "out_of_stock"]).optional(),
});

export const ProductValidation = {
  createProductZodSchema,
  updateProductZodSchema,
};
