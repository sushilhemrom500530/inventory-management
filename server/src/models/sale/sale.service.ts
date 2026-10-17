import { Sale } from "./sale.model";
import { ISale, ISaleItem, PaymentMethod } from "./sale.interface";
import { Product } from "../product/product.model";
import { StockMovement } from "../stock-movement/stockMovement.model";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../shared/queryBuilder";
import { Types } from "mongoose";

interface ICheckoutItemInput {
  productId: string;
  quantity: number;
}

interface ICheckoutPayload {
  items: ICheckoutItemInput[];
  taxRate?: number;
  discount?: number;
  paymentMethod?: PaymentMethod;
  customerName?: string;
  customerContact?: string;
  notes?: string;
  cashierId?: string;
}

const generateInvoiceNumber = async (): Promise<string> => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const countToday = await Sale.countDocuments({
    createdAt: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
    },
  });
  return `INV-${dateStr}-${String(countToday + 1).padStart(4, "0")}-${randomSuffix}`;
};

const checkoutSale = async (payload: ICheckoutPayload): Promise<ISale> => {
  const {
    items,
    taxRate = 0,
    discount = 0,
    paymentMethod = "cash",
    customerName = "Walk-in Customer",
    customerContact = "",
    notes = "",
    cashierId,
  } = payload;

  if (!items || items.length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Cannot checkout an empty cart");
  }

  // 1. Fetch and lock products
  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, isDeleted: false });

  if (products.length !== items.length) {
    throw new AppError(StatusCodes.NOT_FOUND, "One or more products in cart were not found or have been deleted");
  }

  const productMap = new Map(products.map((p) => [String(p._id), p]));

  // 2. Validate stock levels for all items before applying any deductions
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new AppError(StatusCodes.NOT_FOUND, `Product ID ${item.productId} not found`);
    }
    if (product.quantity < item.quantity) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Insufficient stock for "${product.name}". Available: ${product.quantity}, Requested: ${item.quantity}`,
      );
    }
  }

  // 3. Compute item totals and deductions
  const invoiceNumber = await generateInvoiceNumber();
  const processedItems: ISaleItem[] = [];
  let subtotal = 0;

  for (const item of items) {
    const product = productMap.get(item.productId)!;
    const lineTotal = product.sellingPrice * item.quantity;
    subtotal += lineTotal;

    processedItems.push({
      product: product._id,
      productName: product.name,
      sku: product.sku,
      unitPrice: product.sellingPrice,
      costPrice: product.costPrice,
      quantity: item.quantity,
      subtotal: lineTotal,
    });

    const previousStock = product.quantity;
    const newStock = previousStock - item.quantity;

    // Deduct stock and trigger auto-status update via save()
    product.quantity = newStock;
    await product.save();

    // Log StockMovement audit entry
    await StockMovement.create({
      product: product._id,
      type: "SALE",
      quantity: -item.quantity,
      previousStock,
      newStock,
      reason: `POS Sale Checkout [${invoiceNumber}]`,
      performedBy: cashierId ? new Types.ObjectId(cashierId) : undefined,
      referenceId: invoiceNumber,
    });
  }

  // 4. Calculate Tax & Final Grand Total
  const calculatedTaxAmount = Math.round((subtotal * (taxRate / 100)) * 100) / 100;
  const grandTotal = Math.max(0, Math.round((subtotal + calculatedTaxAmount - discount) * 100) / 100);

  // 5. Create Sale Document
  const sale = await Sale.create({
    invoiceNumber,
    items: processedItems,
    subtotal,
    taxRate,
    taxAmount: calculatedTaxAmount,
    discount,
    grandTotal,
    paymentMethod,
    cashier: cashierId ? new Types.ObjectId(cashierId) : undefined,
    customerName,
    customerContact,
    notes,
    status: "completed",
  });

  return sale;
};

const getAllSales = async (query: Record<string, unknown>) => {
  const baseQuery = Sale.find().populate("cashier", "fullName email role");

  const saleQuery = new QueryBuilder(baseQuery, query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const sales = await saleQuery.modelQuery.lean();
  const meta = await saleQuery.countTotal();

  return {
    meta,
    data: sales,
  };
};

const getSaleById = async (id: string): Promise<ISale | null> => {
  const sale = await Sale.findById(id).populate("cashier", "fullName email role");
  if (!sale) {
    throw new AppError(StatusCodes.NOT_FOUND, "Sale invoice not found");
  }
  return sale;
};

const getRecentSales = async (limit = 5) => {
  const recent = await Sale.find({ status: "completed" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("cashier", "fullName email")
    .lean();

  return recent;
};

export const SaleService = {
  checkoutSale,
  getAllSales,
  getSaleById,
  getRecentSales,
};
