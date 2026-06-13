import { CateringLeadStatus } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { z, ZodError, ZodTypeAny } from "zod";

const eventTypes = ["CORPORATE", "BIRTHDAY", "WEDDING", "SPORTS", "OTHER"] as const;
const contactTimes = ["MORNING", "AFTERNOON", "EVENING"] as const;

export const createCateringLeadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
  eventType: z.enum(eventTypes),
  eventDate: z.string().refine((value) => {
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date > new Date();
  }, "Event date must be in the future"),
  guestCount: z.number().int().min(5).max(10_000),
  location: z.string().trim().min(3).max(200),
  notes: z.string().trim().max(500).optional(),
  preferredContactTime: z.enum(contactTimes).optional(),
});

export const listCateringLeadsSchema = z.object({
  status: z.nativeEnum(CateringLeadStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const cateringLeadIdSchema = z.object({
  id: z.string().uuid(),
});

export const updateCateringLeadStatusSchema = z.object({
  status: z.nativeEnum(CateringLeadStatus),
  adminNotes: z.string().trim().max(500).optional(),
});

const formatZodErrors = (error: ZodError) =>
  error.issues.map((issue) => ({
    field: issue.path.join(".") || "root",
    message: issue.message,
  }));

export const validateBody =
  (schema: ZodTypeAny) => (request: Request, response: Response, next: NextFunction) => {
    try {
      request.body = schema.parse(request.body);
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

export const validateQuery =
  (schema: ZodTypeAny) => (request: Request, response: Response, next: NextFunction) => {
    try {
      Object.defineProperty(request, "query", {
        value: schema.parse(request.query),
        writable: true,
        configurable: true,
        enumerable: true,
      });
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

export const validateParams =
  (schema: ZodTypeAny) => (request: Request, response: Response, next: NextFunction) => {
    try {
      Object.defineProperty(request, "params", {
        value: schema.parse(request.params),
        writable: true,
        configurable: true,
        enumerable: true,
      });
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

export type CreateCateringLeadInput = z.infer<typeof createCateringLeadSchema>;
export type ListCateringLeadsInput = z.infer<typeof listCateringLeadsSchema>;
export type UpdateCateringLeadStatusInput = z.infer<typeof updateCateringLeadStatusSchema>;
