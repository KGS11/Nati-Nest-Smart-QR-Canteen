import { NextFunction, Request, Response } from "express";
import { z, ZodError, ZodSchema } from "zod";

const formatZodErrors = (error: ZodError) =>
  error.issues.map((issue) => ({
    field: issue.path.join(".") || "root",
    message: issue.message,
  }));

export const submitFeedbackSchema = z.object({
  rating: z
    .unknown()
    .superRefine((val, context) => {
      if (val === undefined) {
        context.addIssue({
          code: "custom",
          message: "Rating is required",
        });
        return;
      }

      if (typeof val !== "number" || Number.isNaN(val)) {
        context.addIssue({
          code: "custom",
          message: "Rating must be a number",
        });
        return;
      }

      if (!Number.isInteger(val)) {
        context.addIssue({
          code: "custom",
          message: "Rating must be a whole number",
        });
        return;
      }

      if (val < 1) {
        context.addIssue({
          code: "custom",
          message: "Rating must be at least 1",
        });
        return;
      }

      if (val > 5) {
        context.addIssue({
          code: "custom",
          message: "Rating must not exceed 5",
        });
      }
    })
    .transform((val) => val as number),
  comment: z.string().max(500, "Comment must not exceed 500 characters").trim().optional(),
});

export const getFeedbackQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, "Page must be greater than 0"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100"),
  rating: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine(
      (val) => val === undefined || (val >= 1 && val <= 5),
      "Rating filter must be between 1 and 5",
    ),
  startDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), "startDate must be a valid date string"),
  endDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), "endDate must be a valid date string"),
});

export const validateZodSchema =
  (schema: ZodSchema) => (request: Request, response: Response, next: NextFunction) => {
    try {
      request.body = schema.parse(request.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return response.status(422).json({
          success: false,
          message: "Validation failed",
          errors: formatZodErrors(error),
        });
      }

      return next(error);
    }
  };

export const validateZodQuery =
  (schema: ZodSchema) => (request: Request, response: Response, next: NextFunction) => {
    try {
      request.query = schema.parse(request.query) as Request["query"];
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return response.status(422).json({
          success: false,
          message: "Validation failed",
          errors: formatZodErrors(error),
        });
      }

      return next(error);
    }
  };
