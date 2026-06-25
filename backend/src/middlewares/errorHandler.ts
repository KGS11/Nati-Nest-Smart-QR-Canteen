import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { Prisma } from "@prisma/client";
import { captureException } from "../utils/monitoring";
import { logger } from "../config/logger";

type HttpError = Error & {
  statusCode?: number;
  code?: string;
};

export const errorHandler = (
  error: HttpError,
  request: Request,
  response: Response,
  _next: NextFunction,
) => {
  const isMulterFileSizeError =
    error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE";
  const statusCode = isMulterFileSizeError ? 400 : (error.statusCode ?? 500);
  const message = isMulterFileSizeError ? "Image size must not exceed 5MB" : error.message;

  let finalStatusCode = statusCode;
  let finalMessage = message;

  // Detect Prisma / Database errors
  const isPrismaError =
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    error instanceof Prisma.PrismaClientValidationError ||
    (error.name && error.name.startsWith("Prisma")) ||
    (error.constructor && error.constructor.name.startsWith("Prisma"));

  if (isPrismaError) {
    // Check if the error indicates a connection / offline database issue
    const isConnectionError =
      error instanceof Prisma.PrismaClientInitializationError ||
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P1000", "P1001", "P1002", "P1003", "P1008", "P1017"].includes(error.code)) ||
      (error.message && (
        error.message.includes("Can't reach database server") ||
        error.message.includes("database server is running") ||
        error.message.includes("Connection refused") ||
        error.message.includes("connect ECONNREFUSED")
      ));

    if (isConnectionError) {
      finalStatusCode = 500;
      finalMessage = "Server unavailable";
    } else {
      finalStatusCode = 500;
      finalMessage = "Unexpected error";
    }
  } else if (finalStatusCode === 500) {
    // For other unhandled internal errors, don't expose stack/details
    finalMessage = "Unexpected error";
  }

  // Always log detailed internal errors on the backend
  if (finalStatusCode >= 500 || statusCode >= 500 || isPrismaError) {
    logger.error("Request failed", {
      error,
      requestId: (request as any).requestId ?? null,
      method: request.method,
      path: request.path,
      statusCode: finalStatusCode,
    });
    captureException(error, {
      method: request.method,
      path: request.path,
      statusCode: finalStatusCode,
    });
  }

  response.status(finalStatusCode).json({
    success: false,
    message: finalMessage,
  });
};
