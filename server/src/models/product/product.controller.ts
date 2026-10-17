import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ProductService } from "./product.service";
import { StatusCodes } from "http-status-codes";
import { JwtUserPayload } from "../../middlewares/auth";

const createProduct = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const productData = { ...req.body };

  // Handle uploaded images if provided by upload middleware
  const files = (req.body as any).files as {
    images?: string | string[];
    image?: string;
  };

  if (files?.images) {
    productData.images = Array.isArray(files.images) ? files.images : [files.images];
  } else if (files?.image) {
    productData.images = [files.image];
  }

  // Ensure numeric fields
  if (productData.costPrice !== undefined) productData.costPrice = Number(productData.costPrice);
  if (productData.sellingPrice !== undefined) productData.sellingPrice = Number(productData.sellingPrice);
  if (productData.quantity !== undefined) productData.quantity = Number(productData.quantity);
  if (productData.lowStockThreshold !== undefined) productData.lowStockThreshold = Number(productData.lowStockThreshold);

  const result = await ProductService.createProduct(productData, userId);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Product created successfully",
    data: result,
  });
});

const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductService.getAllProducts(req.query as Record<string, unknown>);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Products retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getProductById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductService.getProductById(id as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Product details retrieved successfully",
    data: result,
  });
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { id: userId } = req.user as JwtUserPayload;
  const productData = { ...req.body };

  const files = (req.body as any).files as {
    images?: string | string[];
    image?: string;
  };

  if (files?.images) {
    const newImages = Array.isArray(files.images) ? files.images : [files.images];
    productData.images = [...(productData.images || []), ...newImages];
  } else if (files?.image) {
    productData.images = [...(productData.images || []), files.image];
  }

  if (productData.costPrice !== undefined) productData.costPrice = Number(productData.costPrice);
  if (productData.sellingPrice !== undefined) productData.sellingPrice = Number(productData.sellingPrice);
  if (productData.quantity !== undefined) productData.quantity = Number(productData.quantity);
  if (productData.lowStockThreshold !== undefined) productData.lowStockThreshold = Number(productData.lowStockThreshold);

  const result = await ProductService.updateProduct(id as string, productData, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Product updated successfully",
    data: result,
  });
});

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductService.deleteProduct(id as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Product deleted successfully",
    data: result,
  });
});

export const ProductController = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
