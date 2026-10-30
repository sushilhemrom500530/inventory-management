import { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import handleZodError from "../errors/handleZodError";
import handleValidationError from "../errors/handleValidationError";
import handleCastError from "../errors/handleCastError";
import handleDuplicateError from "../errors/handleDuplicateError";
import AppError from "../errors/AppError";
import { IErrorResponse } from "./../interface/index";
import { logger } from "../logger/logger";
import { NODE_ENV } from "../config";

const globalErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let errorResponse: IErrorResponse = {
    success: false,
    statusCode: err.statusCode || 500,
    message: err.message || "Something went wrong",
    errorMessages: [
      {
        path: "",
        message: err.message || "Internal Server Error",
      },
    ],
  };

  // Classify Errors
  if (err instanceof ZodError) {
    errorResponse = handleZodError(err);
  } else if (err instanceof mongoose.Error.ValidationError) {
    errorResponse = handleValidationError(err);
  } else if (err instanceof mongoose.Error.CastError) {
    errorResponse = handleCastError(err);
  } else if (err?.code === 11000) {
    errorResponse = handleDuplicateError(err);
  } else if (err instanceof AppError) {
    errorResponse = {
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      errorMessages: [
        {
          path: "",
          message: err.message,
        },
      ],
    };
  } else if (
    err?.name === "MongooseServerSelectionError" ||
    err?.name === "MongoServerSelectionError" ||
    err?.name === "MongoNetworkError" ||
    err?.name === "MongoTimeoutError" ||
    err?.name === "MongoTopologyClosedError" ||
    err?.name === "MongoNetworkTimeoutError" ||
    /connection <monitor>|27017|buffering timed out|Server selection timed out|topology was destroyed|Topology is closed/i.test(
      err?.message || "",
    )
  ) {
    const friendlyMessage =
      "Database connection is currently unavailable. Please check your internet connection or server status.";
    errorResponse = {
      success: false,
      statusCode: 503,
      message: friendlyMessage,
      errorMessages: [
        {
          path: "",
          message: friendlyMessage,
        },
      ],
    };
  } else if (err instanceof Error) {
    const isSensitiveOrNetwork =
      /connection <monitor>|27017|buffering timed out|Server selection timed out|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(
        err.message,
      );

    const safeMessage = isSensitiveOrNetwork
      ? "Unable to connect to the database or external service. Please check your internet connection."
      : err.message;

    errorResponse = {
      success: false,
      statusCode: 500,
      message: safeMessage,
      errorMessages: [
        {
          path: "",
          message: safeMessage,
        },
      ],
    };
  }

  // Log Errors
  logger.error(
    {
      name: err?.name,
      message: err?.message,
      statusCode: errorResponse.statusCode,
      path: req.originalUrl,
      method: req.method,
      // stack: NODE_ENV === "development" ? err?.stack : undefined,
    },
    "❌ Global Error",
  );

  // Send Response
  return res.status(errorResponse.statusCode).json({
    success: false,
    message: errorResponse.message,
    errorMessages: errorResponse.errorMessages,
    // stack: NODE_ENV === "development" ? err?.stack : null,
  });
};

export default globalErrorHandler;
