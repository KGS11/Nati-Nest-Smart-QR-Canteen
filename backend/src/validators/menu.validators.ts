import { NextFunction, Request, Response } from "express";
import { z, ZodError, ZodTypeAny } from "zod";

const optionalBoolean = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

const optionalInteger = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) return undefined;
  return Number(value);
}, z.number().int().min(0));

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  sortOrder: optionalInteger.optional(),
  isActive: optionalBoolean.optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  sortOrder: optionalInteger.optional(),
  isActive: optionalBoolean.optional(),
});

export const createMenuItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  price: z.preprocess((value) => Number(value), z.number().positive("Price must be greater than 0")),
  categoryId: z.string().trim().min(1, "Category is required"),
  isAvailable: optionalBoolean.optional(),
});

export const updateMenuItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  description: z.string().trim().optional(),
  price: z
    .preprocess((value) => (value === undefined ? undefined : Number(value)), z.number().positive())
    .optional(),
  categoryId: z.string().trim().min(1, "Category is required").optional(),
  isAvailable: optionalBoolean.optional(),
});

export const updateAvailabilitySchema = z.object({
  isAvailable: optionalBoolean,
});

export const validate =
  (schema: ZodTypeAny) => (request: Request, response: Response, next: NextFunction) => {
    try {
      request.body = schema.parse(request.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return response.status(422).json({
          success: false,
          message: "Validation Error",
        });
      }

      return next(error);
    }
  };
