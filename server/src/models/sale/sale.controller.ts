import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SaleService } from "./sale.service";
import { StatusCodes } from "http-status-codes";
import { JwtUserPayload } from "../../middlewares/auth";

const checkoutSale = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;

  const result = await SaleService.checkoutSale({
    ...req.body,
    cashierId: userId,
  });

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Sale processed and stock updated successfully",
    data: result,
  });
});

const getAllSales = catchAsync(async (req: Request, res: Response) => {
  const result = await SaleService.getAllSales(req.query as Record<string, unknown>);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sales history retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSaleById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SaleService.getSaleById(id as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sale invoice retrieved successfully",
    data: result,
  });
});

const getRecentSales = catchAsync(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 5;
  const result = await SaleService.getRecentSales(limit);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Recent sales retrieved successfully",
    data: result,
  });
});

export const SaleController = {
  checkoutSale,
  getAllSales,
  getSaleById,
  getRecentSales,
};
