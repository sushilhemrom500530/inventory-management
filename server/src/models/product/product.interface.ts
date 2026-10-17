import { Document, Types } from "mongoose";

export type ProductStockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  sku: string;
  barcode?: string;
  category: Types.ObjectId;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  lowStockThreshold: number;
  unit: string;
  images: string[];
  status: ProductStockStatus;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
