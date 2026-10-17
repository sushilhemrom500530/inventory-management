import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AIAdvisorService } from "./aiAdvisor.service";
import { StatusCodes } from "http-status-codes";

const getStockForecast = catchAsync(async (_req: Request, res: Response) => {
  const result = await AIAdvisorService.getStockForecast();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "AI stock velocity forecast and recommendations generated successfully",
    data: result,
  });
});

export const AIAdvisorController = {
  getStockForecast,
};
