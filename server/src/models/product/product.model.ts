import { Schema, model } from "mongoose";
import { IProduct } from "./product.interface";

const productSchema = new Schema<IProduct>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
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
    thumbnail: {
      type: String,
      default: "",
      trim: true,
    },
    featuredImages: {
      type: [String],
      default: [],
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual aliases for compatibility with diverse frontend / doc naming
productSchema.virtual("price").get(function () {
  return this.sellingPrice;
});
productSchema.virtual("reorderLevel").get(function () {
  return this.lowStockThreshold;
});
productSchema.virtual("categoryId").get(function () {
  return this.category;
});

// Automatic status assignment pre-save hook
productSchema.pre("save", function () {
  if (this.quantity <= 0) {
    this.status = "out_of_stock";
  } else if (this.quantity <= (this.lowStockThreshold || 5)) {
    this.status = "low_stock";
  } else {
    this.status = "in_stock";
  }

  // Keep images in sync with thumbnail and featuredImages for backwards compatibility
  if ((!this.images || this.images.length === 0) && (this.thumbnail || (this.featuredImages && this.featuredImages.length > 0))) {
    this.images = [
      ...(this.thumbnail ? [this.thumbnail] : []),
      ...(this.featuredImages || []),
    ];
  }
});

// Indexes for high performance searches and unique constraint per user/store
productSchema.index({ sku: 1 });
productSchema.index({ userId: 1, sku: 1 });
productSchema.index({ name: "text", sku: "text", barcode: "text" });
productSchema.index({ category: 1, isDeleted: 1 });
productSchema.index({ status: 1, isDeleted: 1 });

export const Product = model<IProduct>("Product", productSchema);
