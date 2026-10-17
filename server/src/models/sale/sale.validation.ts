import { z } from "zod";

const checkoutSaleZodSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().optional(),
        product: z.string().optional(),
        quantity: z
          .number({
            message: "Quantity is required",
          })
          .int()
          .min(1, "Quantity must be at least 1"),
      }).refine((item) => item.productId || item.product, {
        message: "productId or product is required",
        path: ["productId"],
      }),
    )
    .min(1, "Must contain at least 1 item in checkout"),
  taxRate: z.number().min(0).max(100).optional().default(0),
  discount: z.number().min(0).optional().default(0),
  paymentMethod: z
    .enum(["cash", "card", "bank_transfer"])
    .optional()
    .default("cash"),
  customerName: z.string().optional().default("Walk-in Customer"),
  customerContact: z.string().optional(),
  notes: z.string().optional(),
});

export const SaleValidation = {
  checkoutSaleZodSchema,
};
