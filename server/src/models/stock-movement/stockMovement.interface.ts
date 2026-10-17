import { Document, Types } from "mongoose";

export type StockMovementType = "IN" | "OUT" | "ADJUSTMENT" | "SALE" | "RETURN";

export interface IStockMovement extends Document {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  type: StockMovementType;
  quantity: number; // positive or negative shift
  previousStock: number;
  newStock: number;
  reason?: string;
  performedBy?: Types.ObjectId;
  referenceId?: string; // invoice or PO ID
  createdAt: Date;
  updatedAt: Date;
}
