import { OrderStatus } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { kitchenService } from "../services/kitchen.service";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const param = (request: Request, key: string) => {
  const value = request.params[key];
  return Array.isArray(value) ? value[0] : value;
};

const validateOrderId = (orderId: string, response: Response): boolean => {
  if (!UUID_REGEX.test(orderId)) {
    response.status(400).json({
      success: false,
      message: "Invalid order ID format.",
    });
    return false;
  }
  return true;
};

export class KitchenController {
  async getActiveOrders(_request: Request, response: Response, next: NextFunction) {
    try {
      const orders = await kitchenService.getActiveOrders();
      const counts = {
        placed: orders.filter((order) => order.status === OrderStatus.PLACED).length,
        accepted: orders.filter((order) => order.status === OrderStatus.ACCEPTED).length,
        preparing: orders.filter((order) => order.status === OrderStatus.PREPARING).length,
        total: orders.length,
      };

      return response.status(200).json({
        success: true,
        data: { orders, counts },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getOrderDetails(request: Request, response: Response, next: NextFunction) {
    try {
      const orderId = param(request, "orderId");
      if (!validateOrderId(orderId, response)) return;

      const order = await kitchenService.getOrderDetails(orderId);
      return response.status(200).json({ success: true, data: { order } });
    } catch (error) {
      return next(error);
    }
  }

  async acceptOrder(request: Request, response: Response, next: NextFunction) {
    try {
      const orderId = param(request, "orderId");
      if (!validateOrderId(orderId, response)) return;

      const order = await kitchenService.acceptOrder(orderId);
      return response.status(200).json({
        success: true,
        message: "Order accepted",
        data: { order },
      });
    } catch (error) {
      return next(error);
    }
  }

  async startPreparing(request: Request, response: Response, next: NextFunction) {
    try {
      const orderId = param(request, "orderId");
      if (!validateOrderId(orderId, response)) return;

      const order = await kitchenService.startPreparing(orderId);
      return response.status(200).json({
        success: true,
        message: "Order is being prepared",
        data: { order },
      });
    } catch (error) {
      return next(error);
    }
  }

  async markReady(request: Request, response: Response, next: NextFunction) {
    try {
      const orderId = param(request, "orderId");
      if (!validateOrderId(orderId, response)) return;

      const order = await kitchenService.markReady(orderId);
      return response.status(200).json({
        success: true,
        message: "Order is ready for delivery",
        data: { order },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const kitchenController = new KitchenController();
