import { Document, Types } from "mongoose";

export type ProductStockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface IProduct extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  name: string;
  sku: string;
  barcode?: string;
  category: Types.ObjectId;
  categoryId?: Types.ObjectId;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  price?: number;
  quantity: number;
  lowStockThreshold: number;
  reorderLevel?: number;
  unit: string;
  thumbnail?: string;
  featuredImages: string[];
  images: string[];
  status: ProductStockStatus;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
