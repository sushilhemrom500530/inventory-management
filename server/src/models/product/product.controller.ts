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
    thumbnail?: string | string[];
    featuredImages?: string | string[];
    featureImages?: string | string[];
    images?: string | string[];
    image?: string | string[];
  };

  // 1. Resolve thumbnail
  let thumbnail = "";
  if (files?.thumbnail) {
    thumbnail = Array.isArray(files.thumbnail) ? files.thumbnail[0] : files.thumbnail;
  } else if (req.body.thumbnail && typeof req.body.thumbnail === "string" && req.body.thumbnail.trim()) {
    thumbnail = req.body.thumbnail.trim();
  } else if (files?.image) {
    thumbnail = Array.isArray(files.image) ? files.image[0] : files.image;
  }
  productData.thumbnail = thumbnail;

  // 2. Resolve featured images (Multiple)
  const uploadedFeatured = files?.featuredImages || files?.featureImages;
  const uploadedFilesFeatured: string[] = uploadedFeatured
    ? (Array.isArray(uploadedFeatured) ? uploadedFeatured : [uploadedFeatured])
    : [];

  let bodyFeaturedUrls: string[] = [];
  if (req.body.featuredImages) {
    if (Array.isArray(req.body.featuredImages)) {
      bodyFeaturedUrls = req.body.featuredImages.filter((s: any) => typeof s === "string" && s.trim());
    } else if (typeof req.body.featuredImages === "string" && req.body.featuredImages.trim()) {
      try {
        const parsed = JSON.parse(req.body.featuredImages);
        bodyFeaturedUrls = (Array.isArray(parsed) ? parsed : [parsed]).filter((s: any) => typeof s === "string" && s.trim());
      } catch {
        bodyFeaturedUrls = [req.body.featuredImages.trim()];
      }
    }
  }

  // Deduplicate and combine uploaded files with body URLs
  const allFeatured = Array.from(new Set([...uploadedFilesFeatured, ...bodyFeaturedUrls]));
  if (allFeatured.length === 0 && files?.images) {
    const rawImgs = Array.isArray(files.images) ? files.images : [files.images];
    allFeatured.push(...rawImgs);
  }
  productData.featuredImages = allFeatured;

  // 3. Sync images array for backwards compatibility
  if (!productData.images || productData.images.length === 0) {
    const combined = Array.from(
      new Set([
        ...(productData.thumbnail ? [productData.thumbnail] : []),
        ...(productData.featuredImages || []),
      ])
    );
    if (combined.length > 0) {
      productData.images = combined;
    }
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
    thumbnail?: string | string[];
    featuredImages?: string | string[];
    featureImages?: string | string[];
    images?: string | string[];
    image?: string | string[];
  };

  if (files?.thumbnail) {
    productData.thumbnail = Array.isArray(files.thumbnail) ? files.thumbnail[0] : files.thumbnail;
  }
  if (files?.featuredImages || files?.featureImages) {
    const rawFeatured = files.featuredImages || files.featureImages;
    const newFeatured = Array.isArray(rawFeatured) ? rawFeatured : [rawFeatured];
    productData.featuredImages = [...(productData.featuredImages || []), ...newFeatured];
  }
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
