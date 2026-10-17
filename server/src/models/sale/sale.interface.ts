import { Document, Types } from "mongoose";

export interface ISaleItem {
  product: Types.ObjectId;
  productId?: Types.ObjectId;
  productName: string;
  productNameSnapshot?: string;
  sku: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  subtotal: number;
  lineTotal?: number;
}

export type PaymentMethod = "cash" | "card" | "bank_transfer";
export type SaleStatus = "completed" | "refunded" | "cancelled";

export interface ISale extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  invoiceNumber: string;
  items: ISaleItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  grandTotal: number;
  totalAmount?: number;
  paymentMethod: PaymentMethod;
  cashier?: Types.ObjectId;
  customerName?: string;
  customerContact?: string;
  notes?: string;
  status: SaleStatus;
  createdAt: Date;
  updatedAt: Date;
}
