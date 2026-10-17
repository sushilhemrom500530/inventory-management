import { Schema, model } from "mongoose";
import { IProduct } from "./product.interface";

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    barcode: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    unit: {
      type: String,
      default: "pcs",
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["in_stock", "low_stock", "out_of_stock"],
      default: "in_stock",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Automatic status assignment pre-save hook
productSchema.pre("save", function () {
  if (this.quantity <= 0) {
    this.status = "out_of_stock";
  } else if (this.quantity <= (this.lowStockThreshold || 5)) {
    this.status = "low_stock";
  } else {
    this.status = "in_stock";
  }
});

// Indexes for high performance searches and filters
productSchema.index({ sku: 1 });
productSchema.index({ name: "text", sku: "text", barcode: "text" });
productSchema.index({ category: 1, isDeleted: 1 });
productSchema.index({ status: 1, isDeleted: 1 });

export const Product = model<IProduct>("Product", productSchema);
