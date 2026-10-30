import { Product } from "./product.model";
import { IProduct } from "./product.interface";
import { Category } from "../category/category.model";
import { StockMovement } from "../stock-movement/stockMovement.model";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../shared/queryBuilder";
import { Types } from "mongoose";

const createProduct = async (
  payload: any,
  creatorId?: string,
): Promise<IProduct> => {
  const normalizedSku = payload.sku!.trim().toUpperCase();

  // Resolve aliases
  const targetCategory = payload.category || payload.categoryId;
  const sellingPrice = payload.sellingPrice !== undefined ? Number(payload.sellingPrice) : Number(payload.price);
  const costPrice = payload.costPrice !== undefined ? Number(payload.costPrice) : Math.round(sellingPrice * 0.65 * 100) / 100;
  const threshold = payload.lowStockThreshold !== undefined ? Number(payload.lowStockThreshold) : (payload.reorderLevel !== undefined ? Number(payload.reorderLevel) : 5);
  const initialQty = Number(payload.quantity) || 0;

  const existingSku = await Product.findOne({
    sku: normalizedSku,
    isDeleted: false,
    ...(creatorId ? { userId: new Types.ObjectId(creatorId) } : {}),
  });

  if (existingSku) {
    throw new AppError(StatusCodes.CONFLICT, `A product with SKU "${normalizedSku}" already exists in your inventory`);
  }

  const categoryExists = await Category.findById(targetCategory);
  if (!categoryExists) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Selected category does not exist");
  }

  let initialStatus: "in_stock" | "low_stock" | "out_of_stock" = "in_stock";
  if (initialQty <= 0) initialStatus = "out_of_stock";
  else if (initialQty <= threshold) initialStatus = "low_stock";

  const product = await Product.create({
    ...payload,
    userId: creatorId ? new Types.ObjectId(creatorId) : undefined,
    category: new Types.ObjectId(targetCategory),
    sku: normalizedSku,
    costPrice,
    sellingPrice,
    quantity: initialQty,
    lowStockThreshold: threshold,
    status: initialStatus,
  });

  // Automatically log initial stock movement if quantity > 0
  if (initialQty > 0) {
    await StockMovement.create({
      product: product._id,
      type: "IN",
      quantity: initialQty,
      previousStock: 0,
      newStock: initialQty,
      reason: "Initial product inventory setup",
      performedBy: creatorId ? new Types.ObjectId(creatorId) : undefined,
    });
  }

  return product;
};

const getAllProducts = async (
  query: Record<string, unknown>,
  _scopedUserId?: string,
) => {
  const baseFind: Record<string, unknown> = { isDeleted: false };

  const baseQuery = Product.find(baseFind).populate("category", "name slug color");

  const productQuery = new QueryBuilder(baseQuery, query)
    .search(["name", "sku", "barcode"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const products = await productQuery.modelQuery.lean();
  const meta = await productQuery.countTotal();

  return {
    meta,
    data: products,
  };
};

const getProductById = async (
  id: string,
  _scopedUserId?: string,
): Promise<IProduct | null> => {
  const findQuery: Record<string, unknown> = { _id: id, isDeleted: false };

  const product = await Product.findOne(findQuery).populate(
    "category",
    "name slug color description",
  );

  if (!product) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found or access denied");
  }

  return product;
};

const updateProduct = async (
  id: string,
  payload: any,
  updaterId?: string,
): Promise<IProduct | null> => {
  const findQuery: Record<string, unknown> = { _id: id, isDeleted: false };

  const product = await Product.findOne(findQuery);
  if (!product) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found or access denied");
  }

  if (payload.sku) {
    const normalizedSku = payload.sku.trim().toUpperCase();
    const existingSku = await Product.findOne({
      _id: { $ne: id },
      sku: normalizedSku,
      isDeleted: false,
    });
    if (existingSku) {
      throw new AppError(StatusCodes.CONFLICT, `SKU "${normalizedSku}" is already in use by another product`);
    }
    payload.sku = normalizedSku;
  }

  const targetCategory = payload.category || payload.categoryId;
  if (targetCategory) {
    const categoryExists = await Category.findById(targetCategory);
    if (!categoryExists) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Selected category does not exist");
    }
    payload.category = new Types.ObjectId(targetCategory);
  }

  if (payload.price !== undefined && payload.sellingPrice === undefined) {
    payload.sellingPrice = Number(payload.price);
  }
  if (payload.reorderLevel !== undefined && payload.lowStockThreshold === undefined) {
    payload.lowStockThreshold = Number(payload.reorderLevel);
  }

  // Handle direct quantity modification with audit log
  const previousQuantity = product.quantity;
  if (payload.quantity !== undefined && Number(payload.quantity) !== previousQuantity) {
    const newQty = Number(payload.quantity);
    if (newQty < 0) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Product quantity cannot be negative");
    }

    await StockMovement.create({
      product: product._id,
      type: "ADJUSTMENT",
      quantity: newQty - previousQuantity,
      previousStock: previousQuantity,
      newStock: newQty,
      reason: payload.adjustmentNote || "Manual adjustment via product edit form",
      performedBy: updaterId ? new Types.ObjectId(updaterId) : undefined,
    });
  }

  Object.assign(product, payload);
  await product.save();

  return product;
};

const deleteProduct = async (
  id: string,
  _scopedUserId?: string,
): Promise<IProduct | null> => {
  const findQuery: Record<string, unknown> = { _id: id, isDeleted: false };

  const product = await Product.findOneAndUpdate(
    findQuery,
    { isDeleted: true },
    { new: true },
  );

  if (!product) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found or access denied");
  }

  return product;
};

export const ProductService = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
