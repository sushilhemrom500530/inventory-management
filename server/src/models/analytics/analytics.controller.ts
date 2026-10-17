import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AnalyticsService } from "./analytics.service";
import { StatusCodes } from "http-status-codes";

const getDashboardOverview = catchAsync(async (req: Request, res: Response) => {
  const days = req.query.days ? Number(req.query.days) : 30;
  const result = await AnalyticsService.getDashboardOverview(days);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Dashboard analytics retrieved successfully",
    data: result,
  });
});

const getLowStockAlerts = catchAsync(async (_req: Request, res: Response) => {
  const result = await AnalyticsService.getLowStockAlerts();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Low stock alerts retrieved successfully",
    data: result,
  });
});

export const AnalyticsController = {
  getDashboardOverview,
  getLowStockAlerts,
};
