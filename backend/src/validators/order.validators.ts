import { NextFunction, Request, Response } from "express";
import { z, ZodError, ZodTypeAny } from "zod";

export const assistanceRequestSchema = z.object({
  requestType: z.enum(["WATER", "BILL", "GENERAL"]),
});

export const verifyPaymentSchema = z.object({
  paymentMethod: z.enum(["CASH", "UPI"]),
});

export const assistanceRequestValidator =
  (request: Request, response: Response, next: NextFunction) => {
    try {
      request.body = assistanceRequestSchema.parse(request.body);
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

export const validateRequest =
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

export const verifyPaymentValidator = validateRequest(verifyPaymentSchema);
