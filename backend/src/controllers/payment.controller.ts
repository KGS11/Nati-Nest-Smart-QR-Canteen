import { PaymentMethod } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { paymentService } from "../services/payment.service";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const paymentMethodSchema = z.enum(
  [PaymentMethod.CASH, PaymentMethod.UPI] as const,
  { error: `paymentMethod must be one of: ${Object.values(PaymentMethod).join(", ")}` },
);

const param = (request: Request, key: string) => {
  const value = request.params[key];
  return Array.isArray(value) ? value[0] : value;
};

export class PaymentController {
  async requestBill(request: Request, response: Response, next: NextFunction) {
    try {
      const { payment, billSummary, isNew } = await paymentService.createPaymentOnBillRequest(
        request.session!.sessionId,
      );

      return response.status(isNew ? 201 : 200).json({
        success: true,
        message: "Bill requested. Staff will attend shortly.",
        data: {
          payment: {
            id: payment.id,
            totalAmount: payment.totalAmount,
            status: payment.status,
          },
          billSummary,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async verifyPayment(request: Request, response: Response, next: NextFunction) {
    try {
      const paymentId = param(request, "paymentId");

      // SEC-02: Validate paymentId format
      if (!UUID_REGEX.test(paymentId)) {
        return response.status(400).json({ success: false, message: "Invalid payment ID format." });
      }

      // SEC-02: Validate paymentMethod against enum
      const parsed = paymentMethodSchema.safeParse(request.body.paymentMethod);
      if (!parsed.success) {
        return response.status(400).json({
          success: false,
          message: parsed.error.issues[0]?.message ?? "Invalid paymentMethod.",
        });
      }

      const { payment } = await paymentService.verifyPayment(
        paymentId,
        request.user!.userId,
        parsed.data,
      );

      return response.status(200).json({
        success: true,
        message: "Payment verified successfully",
        data: {
          payment,
          tableNumber: payment.session.table.tableNumber,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getPaymentStatus(request: Request, response: Response, next: NextFunction) {
    try {
      const payment = await paymentService.getPaymentBySession(request.session!.sessionId);
      return response.status(200).json({
        success: true,
        data: { payment },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getPendingPayments(_request: Request, response: Response, next: NextFunction) {
    try {
      const payments = await paymentService.getPendingPayments();
      return response.status(200).json({
        success: true,
        data: {
          payments,
          count: payments.length,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const paymentController = new PaymentController();
