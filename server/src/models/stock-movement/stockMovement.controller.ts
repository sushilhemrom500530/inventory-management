import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StockMovementService } from "./stockMovement.service";
import { StatusCodes } from "http-status-codes";
import { JwtUserPayload } from "../../middlewares/auth";

const recordAdjustment = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const result = await StockMovementService.recordAdjustment({
    ...req.body,
    performedBy: userId,
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Stock adjusted and logged successfully",
    data: result,
  });
});

const getMovementsByProduct = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const result = await StockMovementService.getMovementsByProduct(
    productId as string,
    req.query as Record<string, unknown>,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Product stock history retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getAllMovements = catchAsync(async (req: Request, res: Response) => {
  const result = await StockMovementService.getAllMovements(
    req.query as Record<string, unknown>,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Stock movement ledger retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

export const StockMovementController = {
  recordAdjustment,
  getMovementsByProduct,
  getAllMovements,
};
