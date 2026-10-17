import { Schema, model } from "mongoose";
import { ISale, ISaleItem } from "./sale.interface";

const saleItemSchema = new Schema<ISaleItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const saleSchema = new Schema<ISale>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    items: {
      type: [saleItemSchema],
      required: true,
      validate: {
        validator: (v: ISaleItem[]) => v.length > 0,
        message: "Sale must contain at least one product item",
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "bank_transfer"],
      default: "cash",
    },
    cashier: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    customerName: {
      type: String,
      trim: true,
      default: "Walk-in Customer",
    },
    customerContact: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["completed", "refunded", "cancelled"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  },
);

saleSchema.index({ invoiceNumber: 1 });
saleSchema.index({ cashier: 1, createdAt: -1 });
saleSchema.index({ createdAt: -1 });

export const Sale = model<ISale>("Sale", saleSchema);
