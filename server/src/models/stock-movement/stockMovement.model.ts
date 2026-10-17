import { Schema, model } from "mongoose";
import { IStockMovement } from "./stockMovement.interface";

const stockMovementSchema = new Schema<IStockMovement>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    type: {
      type: String,
      enum: ["IN", "OUT", "ADJUSTMENT", "SALE", "RETURN"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    referenceId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

stockMovementSchema.index({ product: 1, createdAt: -1 });
stockMovementSchema.index({ type: 1 });

export const StockMovement = model<IStockMovement>("StockMovement", stockMovementSchema);
