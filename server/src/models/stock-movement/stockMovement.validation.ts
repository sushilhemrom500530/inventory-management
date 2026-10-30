import { z } from "zod";

const recordAdjustmentZodSchema = z
  .object({
    product: z.string().optional(),
    productId: z.string().optional(),
    type: z.enum(["IN", "OUT", "ADJUSTMENT", "RETURN"], {
      message: "Type must be IN, OUT, ADJUSTMENT, or RETURN",
    }).optional().default("ADJUSTMENT"),
    quantity: z.coerce.number().int("Quantity must be an integer"),
    reason: z.string().min(2, "Reason must be provided for audit tracking"),
  })
  .refine((data) => data.product || data.productId, {
    message: "Product ID is required",
    path: ["product"],
  });

export const StockMovementValidation = {
  recordAdjustmentZodSchema,
};
