import { Product } from "./product.model";
import { IProduct } from "./product.interface";
import { Category } from "../category/category.model";
import { StockMovement } from "../stock-movement/stockMovement.model";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../shared/queryBuilder";
import { Types } from "mongoose";

const createProduct = async (
  payload: Partial<IProduct>,
  creatorId?: string,
): Promise<IProduct> => {
  const normalizedSku = payload.sku!.trim().toUpperCase();

  const existingSku = await Product.findOne({ sku: normalizedSku, isDeleted: false });
  if (existingSku) {
    throw new AppError(StatusCodes.CONFLICT, `A product with SKU "${normalizedSku}" already exists`);
  }

  const categoryExists = await Category.findById(payload.category);
  if (!categoryExists) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Selected category does not exist");
  }

  const initialQty = Number(payload.quantity) || 0;
  const threshold = Number(payload.lowStockThreshold) || 5;

  let initialStatus: "in_stock" | "low_stock" | "out_of_stock" = "in_stock";
  if (initialQty <= 0) initialStatus = "out_of_stock";
  else if (initialQty <= threshold) initialStatus = "low_stock";

  const product = await Product.create({
    ...payload,
    sku: normalizedSku,
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

const getAllProducts = async (query: Record<string, unknown>) => {
  const baseQuery = Product.find({ isDeleted: false }).populate("category", "name slug color");

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

const getProductById = async (id: string): Promise<IProduct | null> => {
  const product = await Product.findOne({ _id: id, isDeleted: false }).populate(
    "category",
    "name slug color description",
  );

  if (!product) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found");
  }

  return product;
};

const updateProduct = async (
  id: string,
  payload: Partial<IProduct>,
  updaterId?: string,
): Promise<IProduct | null> => {
  const product = await Product.findOne({ _id: id, isDeleted: false });
  if (!product) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found");
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

  if (payload.category) {
    const categoryExists = await Category.findById(payload.category);
    if (!categoryExists) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Selected category does not exist");
    }
  }

  // Handle direct quantity modification with audit log
  const previousQuantity = product.quantity;
  if (payload.quantity !== undefined && payload.quantity !== previousQuantity) {
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
      reason: "Manual adjustment via product edit form",
      performedBy: updaterId ? new Types.ObjectId(updaterId) : undefined,
    });
  }

  Object.assign(product, payload);
  await product.save();

  return product;
};

const deleteProduct = async (id: string): Promise<IProduct | null> => {
  const product = await Product.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true },
  );

  if (!product) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found");
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
