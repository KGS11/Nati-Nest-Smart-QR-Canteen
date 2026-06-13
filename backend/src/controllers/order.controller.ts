import { NextFunction, Request, Response } from "express";
import { orderService } from "../services/order.service";

const param = (request: Request, key: string) => {
  const value = request.params[key];
  return Array.isArray(value) ? value[0] : value;
};

export class OrderController {
  async create(request: Request, response: Response, next: NextFunction) {
    try {
      const order = await orderService.createOrder(request.session!.sessionId, request.body);
      return response.status(201).json({
        success: true,
        message: "Order placed successfully",
        data: { order },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getSessionOrders(request: Request, response: Response, next: NextFunction) {
    try {
      const orders = await orderService.getSessionOrders(request.session!.sessionId);
      return response.status(200).json({
        success: true,
        data: { orders, count: orders.length },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getDetails(request: Request, response: Response, next: NextFunction) {
    try {
      const order = await orderService.getOrderDetails(
        request.session!.sessionId,
        param(request, "orderId"),
      );
      return response.status(200).json({ success: true, data: { order } });
    } catch (error) {
      return next(error);
    }
  }

  async cancel(request: Request, response: Response, next: NextFunction) {
    try {
      const order = await orderService.cancelOrder(
        request.session!.sessionId,
        param(request, "orderId"),
      );
      return response.status(200).json({
        success: true,
        message: "Order cancelled",
        data: { order },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const orderController = new OrderController();
