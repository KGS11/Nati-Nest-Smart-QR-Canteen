import { NextFunction, Request, Response } from "express";
import { z, ZodError, ZodIssue, ZodTypeAny } from "zod";

const tableNumberField = z
  .string()
  .trim()
  .min(1, "Table number is required")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Table number may only contain letters, numbers, hyphens, and underscores",
  );

export const createTableSchema = z.object({
  tableNumber: tableNumberField,
});

export const updateTableSchema = z.object({
  tableNumber: tableNumberField.optional(),
});

export const updateTableStatusSchema = z.object({
  status: z.enum(["AVAILABLE", "OCCUPIED"]),
});

export const validateTableRequest =
  (schema: ZodTypeAny) => (request: Request, response: Response, next: NextFunction) => {
    try {
      request.body = schema.parse(request.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((e: ZodIssue) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        return response.status(422).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      return next(error);
    }
  };
