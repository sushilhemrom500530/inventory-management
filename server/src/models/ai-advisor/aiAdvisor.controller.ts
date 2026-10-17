import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AIAdvisorService } from "./aiAdvisor.service";
import { StatusCodes } from "http-status-codes";
import { JwtUserPayload } from "../../middlewares/auth";
import AppError from "../../errors/AppError";

const getStockForecast = catchAsync(async (_req: Request, res: Response) => {
  const result = await AIAdvisorService.getStockForecast();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "AI stock velocity forecast and recommendations generated successfully",
    data: result,
  });
});

const getStockAdvice = catchAsync(async (req: Request, res: Response) => {
  const { productId, product_id, lookbackDays, lookback_days } = req.body;
  const targetId = productId || product_id;
  const days = lookbackDays || lookback_days || 30;

  if (!targetId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "productId is required to generate stock advice");
  }

  const user = req.user as JwtUserPayload | undefined;

  const result = await AIAdvisorService.getStockAdviceForProduct(
    targetId,
    user?.id,
    Number(days),
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Stock advice and demand prediction generated successfully",
    data: result,
  });
});

export const AIAdvisorController = {
  getStockForecast,
  getStockAdvice,
};
