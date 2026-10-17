import { Document, Types } from "mongoose";

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
