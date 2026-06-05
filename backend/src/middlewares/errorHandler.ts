import { NextFunction, Request, Response } from "express";
import multer from "multer";

type HttpError = Error & {
  statusCode?: number;
};

export const errorHandler = (
  error: HttpError,
  _request: Request,
  response: Response,
  _next: NextFunction,
) => {
  const isProduction = process.env.NODE_ENV === "production";
  const isMulterFileSizeError =
    error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE";
  const statusCode = isMulterFileSizeError ? 400 : (error.statusCode ?? 500);
  const message = isMulterFileSizeError ? "Image size must not exceed 5MB" : error.message;

  response.status(statusCode).json({
    success: false,
    message: isProduction && statusCode === 500 ? "Internal server error" : message,
  });
};
