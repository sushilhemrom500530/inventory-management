import { Sale } from "./sale.model";
import { ISale, ISaleItem, PaymentMethod } from "./sale.interface";
import { Product } from "../product/product.model";
import { StockMovement } from "../stock-movement/stockMovement.model";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../shared/queryBuilder";
import mongoose, { Types } from "mongoose";

interface ICheckoutItemInput {
  productId?: string;
  product?: string;
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
  userId?: string;
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
    userId = cashierId,
  } = payload;

  if (!items || items.length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Cannot checkout an empty cart");
  }

  // Normalize product ID input
  const normalizedItems = items.map((i) => ({
    productId: i.productId || i.product || "",
    quantity: Number(i.quantity),
  }));

  for (const item of normalizedItems) {
    if (!item.productId) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Each sale item must include a valid productId");
    }
    if (isNaN(item.quantity) || item.quantity <= 0) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Requested item quantities must be positive integers");
    }
  }

  // 1. Fetch products to get trusted pricing and metadata from database
  const productIds = normalizedItems.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, isDeleted: false });

  if (products.length !== normalizedItems.length) {
    throw new AppError(StatusCodes.NOT_FOUND, "One or more products in cart were not found or have been deleted");
  }

  const productMap = new Map(products.map((p) => [String(p._id), p]));

  // Verify stock sufficiency before attempting deductions
  for (const item of normalizedItems) {
    const product = productMap.get(item.productId);
    if (!product || product.quantity < item.quantity) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Insufficient stock for "${product?.name || "Product"}". Available: ${product?.quantity || 0}, Requested: ${item.quantity}`,
      );
    }
  }

  // 2. Multi-tier Transaction & Atomic Decrement
  let session: mongoose.ClientSession | null = null;
  let useTransaction = false;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    useTransaction = true;
  } catch (_e) {
    // Standalone MongoDB setup does not support transactions; fallback to compensating atomic operations
    useTransaction = false;
    session = null;
  }

  const successfullyDecremented: { productId: string; quantity: number }[] = [];
  const processedItems: ISaleItem[] = [];
  let subtotal = 0;
  const invoiceNumber = await generateInvoiceNumber();

  try {
    for (const item of normalizedItems) {
      const product = productMap.get(item.productId)!;

      // Conditional Atomic Decrement: Only updates if quantity is still >= requested quantity
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          quantity: { $gte: item.quantity },
          isDeleted: false,
        },
        {
          $inc: { quantity: -item.quantity },
        },
        {
          new: true,
          session: useTransaction && session ? session : undefined,
        },
      );

      if (!updatedProduct) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          `Concurrent stock conflict for "${product.name}". Available stock dropped below ${item.quantity}.`,
        );
      }

      successfullyDecremented.push({
        productId: item.productId,
        quantity: item.quantity,
      });

      // Update status on the product
      if (updatedProduct.quantity <= 0) {
        updatedProduct.status = "out_of_stock";
      } else if (updatedProduct.quantity <= (updatedProduct.lowStockThreshold || 5)) {
        updatedProduct.status = "low_stock";
      } else {
        updatedProduct.status = "in_stock";
      }
      await updatedProduct.save({ session: useTransaction && session ? session : undefined });

      const lineTotal = product.sellingPrice * item.quantity;
      subtotal += lineTotal;

      processedItems.push({
        product: product._id,
        productId: product._id,
        productName: product.name,
        productNameSnapshot: product.name,
        sku: product.sku,
        unitPrice: product.sellingPrice,
        costPrice: product.costPrice,
        quantity: item.quantity,
        subtotal: lineTotal,
        lineTotal,
      });

      // Audit Log
      await StockMovement.create(
        [
          {
            product: product._id,
            type: "SALE",
            quantity: -item.quantity,
            previousStock: updatedProduct.quantity + item.quantity,
            newStock: updatedProduct.quantity,
            reason: `POS Sale Checkout [${invoiceNumber}]`,
            performedBy: cashierId ? new Types.ObjectId(cashierId) : undefined,
            referenceId: invoiceNumber,
          },
        ],
        { session: useTransaction && session ? session : undefined },
      );
    }

    // Calculate Tax & Final Grand Total from trusted server-side math
    const calculatedTaxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
    const grandTotal = Math.max(0, Math.round((subtotal + calculatedTaxAmount - discount) * 100) / 100);

    // Create Sale Document
    const [sale] = await Sale.create(
      [
        {
          userId: userId ? new Types.ObjectId(userId) : undefined,
          cashier: cashierId ? new Types.ObjectId(cashierId) : undefined,
          invoiceNumber,
          items: processedItems,
          subtotal,
          taxRate,
          taxAmount: calculatedTaxAmount,
          discount,
          grandTotal,
          totalAmount: grandTotal,
          paymentMethod,
          customerName,
          customerContact,
          notes,
          status: "completed",
        },
      ],
      { session: useTransaction && session ? session : undefined },
    );

    if (useTransaction && session) {
      await session.commitTransaction();
    }

    return sale;
  } catch (error) {
    if (useTransaction && session) {
      await session.abortTransaction();
    } else {
      // Compensating rollback for standalone MongoDB
      for (const reverted of successfullyDecremented) {
        await Product.findByIdAndUpdate(reverted.productId, {
          $inc: { quantity: reverted.quantity },
        });
      }
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

const getAllSales = async (
  query: Record<string, unknown>,
  scopedUserId?: string,
) => {
  const baseFind: Record<string, unknown> = {};
  if (scopedUserId) {
    baseFind.userId = new Types.ObjectId(scopedUserId);
  }

  const baseQuery = Sale.find(baseFind).populate("cashier", "fullName email role");

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

const getSaleById = async (
  id: string,
  _scopedUserId?: string,
): Promise<ISale | null> => {
  const sale = await Sale.findById(id).populate("cashier", "fullName email role");
  if (!sale) {
    throw new AppError(StatusCodes.NOT_FOUND, "Sale invoice not found");
  }
  return sale;
};

const getRecentSales = async (limit = 5, scopedUserId?: string) => {
  const findQuery: Record<string, unknown> = { status: "completed" };
  if (scopedUserId) {
    findQuery.userId = new Types.ObjectId(scopedUserId);
  }

  const recent = await Sale.find(findQuery)
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
