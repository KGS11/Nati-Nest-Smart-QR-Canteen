import { NextFunction, Request, Response } from "express";
import { z, ZodError, ZodTypeAny } from "zod";

const formatZodErrors = (error: ZodError) =>
  error.issues.map((issue) => ({
    field: issue.path.join(".") || "root",
    message: issue.message,
  }));

const refreshTokenSchema = z
  .string()
  .trim()
  .min(1, "Refresh token is required")
  .max(256, "Refresh token is invalid");

export const loginSchema = z
  .object({
    phone: z.string().trim().regex(/^\d{10}$/, "Phone must be 10 digits"),
    password: z.string().min(1, "Password is required").max(100, "Password is too long"),
  })
  .strict();

export const refreshSchema = z
  .object({
    refreshToken: refreshTokenSchema.optional(),
  })
  .strict();

export const logoutSchema = refreshSchema;

export const validateAuthBody =
  (schema: ZodTypeAny) => (request: Request, response: Response, next: NextFunction) => {
    try {
      request.body = schema.parse(request.body ?? {});
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return response.status(422).json({
          success: false,
          message: "Validation Error",
          errors: formatZodErrors(error),
        });
      }

      return next(error);
    }
  };
