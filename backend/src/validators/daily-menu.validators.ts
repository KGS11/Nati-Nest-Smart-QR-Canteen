import { NextFunction, Request, Response } from "express";
import { z, ZodError, ZodTypeAny } from "zod";
import { DailyMenuRemovalReason } from "@prisma/client";

export const addDailyMenuItemSchema = z.object({
  menuItemId: z.string().uuid("Invalid menu item ID format"),
});

export const removeDailyMenuItemSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
  reasonType: z.nativeEnum(DailyMenuRemovalReason),
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

