import { z } from "zod";

const recordAdjustmentZodSchema = z.object({
  product: z.string({
    message: "Product ID is required",
  }),
  type: z.enum(["IN", "OUT", "ADJUSTMENT", "RETURN"], {
    message: "Type must be IN, OUT, ADJUSTMENT, or RETURN",
  }),
  quantity: z.number({
    message: "Quantity is required",
  }).int("Quantity must be an integer"),
  reason: z.string().min(2, "Reason must be provided for audit tracking"),
});

export const StockMovementValidation = {
  recordAdjustmentZodSchema,
};
