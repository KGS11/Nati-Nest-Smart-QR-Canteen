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
  name: z.string().trim().min(1, "Name is required").max(100),
  sortOrder: optionalInteger.optional(),
  isActive: optionalBoolean.optional(),
}).strict();

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100).optional(),
  sortOrder: optionalInteger.optional(),
  isActive: optionalBoolean.optional(),
}).strict();

export const createMenuItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(500).optional(),
  price: z.preprocess((value) => Number(value), z.number().positive("Price must be greater than 0").max(100000)),
  categoryId: z.string().uuid("Category must be a valid UUID"),
  isAvailable: optionalBoolean.optional(),
}).strict();

export const updateMenuItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120).optional(),
  description: z.string().trim().max(500).optional(),
  price: z
    .preprocess((value) => (value === undefined ? undefined : Number(value)), z.number().positive().max(100000))
    .optional(),
  categoryId: z.string().uuid("Category must be a valid UUID").optional(),
  isAvailable: optionalBoolean.optional(),
}).strict();

export const updateAvailabilitySchema = z.object({
  isAvailable: optionalBoolean,
}).strict();

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
