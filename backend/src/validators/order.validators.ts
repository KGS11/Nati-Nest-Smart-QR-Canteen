import { NextFunction, Request, Response } from "express";
import { z, ZodError, ZodTypeAny } from "zod";

const formatZodErrors = (error: ZodError) =>
  error.issues.map((issue) => ({
    field: issue.path.join(".") || "root",
    message: issue.message,
  }));

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid("menuItemId must be a valid UUID"),
        quantity: z.number().int("Quantity must be a whole number").positive("Quantity must be greater than 0"),
        specialInstructions: z.string().trim().max(250, "Special instructions must not exceed 250 characters").optional(),
      }),
    )
    .min(1, "At least one item is required"),
});

export const orderIdParamSchema = z.object({
  orderId: z.string().uuid("orderId must be a valid UUID"),
});

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
          errors: formatZodErrors(error),
        });
      }

      return next(error);
    }
  };

export const validateParams =
  (schema: ZodTypeAny) => (request: Request, response: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(request.params);
      Object.defineProperty(request, "params", {
        value: parsed,
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

export const createOrderValidator = validateRequest(createOrderSchema);
export const orderIdParamValidator = validateParams(orderIdParamSchema);
export const verifyPaymentValidator = validateRequest(verifyPaymentSchema);

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
