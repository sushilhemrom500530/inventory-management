import { StockMovement } from "./stockMovement.model";
import { Product } from "../product/product.model";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../shared/queryBuilder";
import { Types } from "mongoose";

interface IRecordAdjustmentParams {
  product: string;
  type: "IN" | "OUT" | "ADJUSTMENT" | "RETURN";
  quantity: number;
  reason: string;
  performedBy: string;
}

const recordAdjustment = async (params: IRecordAdjustmentParams) => {
  const { product: productId, type, quantity, reason, performedBy } = params;

  const product = await Product.findById(productId);
  if (!product || product.isDeleted) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found or has been deleted");
  }

  const previousStock = product.quantity;
  let newStock = previousStock;

  if (type === "IN" || type === "RETURN") {
    if (quantity <= 0) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Quantity must be greater than zero for IN/RETURN");
    }
    newStock = previousStock + quantity;
  } else if (type === "OUT") {
    if (quantity <= 0) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Quantity must be greater than zero for OUT");
    }
    if (previousStock < quantity) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Insufficient inventory. Current stock: ${previousStock}, Requested removal: ${quantity}`,
      );
    }
    newStock = previousStock - quantity;
  } else if (type === "ADJUSTMENT") {
    if (quantity < 0) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Adjusted stock level cannot be negative");
    }
    newStock = quantity;
  }

  // Update product stock and status
  product.quantity = newStock;
  await product.save();

  // Create movement log
  const movement = await StockMovement.create({
    product: new Types.ObjectId(productId),
    type,
    quantity: type === "ADJUSTMENT" ? newStock - previousStock : quantity,
    previousStock,
    newStock,
    reason,
    performedBy: new Types.ObjectId(performedBy),
  });

  return {
    product,
    movement,
  };
};

const getMovementsByProduct = async (productId: string, query: Record<string, unknown>) => {
  const movementQuery = new QueryBuilder(
    StockMovement.find({ product: productId }).populate("performedBy", "fullName email role"),
    query,
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  const movements = await movementQuery.modelQuery.lean();
  const meta = await movementQuery.countTotal();

  return {
    meta,
    data: movements,
  };
};

const getAllMovements = async (query: Record<string, unknown>) => {
  const movementQuery = new QueryBuilder(
    StockMovement.find()
      .populate("product", "name sku unit")
      .populate("performedBy", "fullName email role"),
    query,
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  const movements = await movementQuery.modelQuery.lean();
  const meta = await movementQuery.countTotal();

  return {
    meta,
    data: movements,
  };
};

export const StockMovementService = {
  recordAdjustment,
  getMovementsByProduct,
  getAllMovements,
};
