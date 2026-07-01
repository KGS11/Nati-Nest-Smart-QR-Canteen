import { NextFunction, Request, Response } from "express";
import { adminService } from "../services/admin.service";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const param = (request: Request, key: string) => {
  const value = request.params[key];
  return Array.isArray(value) ? value[0] : value;
};

export class AdminController {
  async getComplaintEligibleOrders(_request: Request, response: Response, next: NextFunction) {
    try {
      const orders = await adminService.getComplaintEligibleOrders();
      return response.status(200).json({
        success: true,
        data: { orders, count: orders.length },
      });
    } catch (error) {
      return next(error);
    }
  }

  async cancelOrderItem(request: Request, response: Response, next: NextFunction) {
    try {
      const orderId = param(request, "orderId");
      const itemId = param(request, "itemId");
      const result = await adminService.cancelOrderItem(
        orderId,
        itemId,
        request.body,
        {
          userId: request.user!.userId,
          name: request.user!.name,
        },
        request.ip,
      );

      return response.status(200).json({
        success: true,
        message: "Order item cancelled by restaurant.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async reassignKitchen(request: Request, response: Response, next: NextFunction) {
    try {
      const orderId = param(request, "orderId");
      if (!UUID_REGEX.test(orderId)) {
        return response.status(400).json({ success: false, message: "Invalid order ID format." });
      }

      const { staffId } = request.body;
      if (!staffId || !UUID_REGEX.test(staffId)) {
        return response.status(400).json({ success: false, message: "Invalid staff ID format." });
      }

      const order = await adminService.reassignKitchen(orderId, staffId);
      return response.status(200).json({
        success: true,
        message: "Kitchen staff reassigned successfully.",
        data: { order },
      });
    } catch (error) {
      return next(error);
    }
  }

  async reassignWaiter(request: Request, response: Response, next: NextFunction) {
    try {
      const orderId = param(request, "orderId");
      if (!UUID_REGEX.test(orderId)) {
        return response.status(400).json({ success: false, message: "Invalid order ID format." });
      }

      const { staffId } = request.body;
      if (!staffId || !UUID_REGEX.test(staffId)) {
        return response.status(400).json({ success: false, message: "Invalid staff ID format." });
      }

      const order = await adminService.reassignWaiter(orderId, staffId);
      return response.status(200).json({
        success: true,
        message: "Waiter staff reassigned successfully.",
        data: { order },
      });
    } catch (error) {
      return next(error);
    }
  }

  async forceUnclaimKitchen(request: Request, response: Response, next: NextFunction) {
    try {
      const orderId = param(request, "orderId");
      if (!UUID_REGEX.test(orderId)) {
        return response.status(400).json({ success: false, message: "Invalid order ID format." });
      }

      const order = await adminService.forceUnclaimKitchen(orderId);
      return response.status(200).json({
        success: true,
        message: "Kitchen order unclaimed successfully.",
        data: { order },
      });
    } catch (error) {
      return next(error);
    }
  }

  async forceUnclaimWaiter(request: Request, response: Response, next: NextFunction) {
    try {
      const orderId = param(request, "orderId");
      if (!UUID_REGEX.test(orderId)) {
        return response.status(400).json({ success: false, message: "Invalid order ID format." });
      }

      const order = await adminService.forceUnclaimWaiter(orderId);
      return response.status(200).json({
        success: true,
        message: "Waiter delivery unclaimed successfully.",
        data: { order },
      });
    } catch (error) {
      return next(error);
    }
  }

  async forceDeliver(request: Request, response: Response, next: NextFunction) {
    try {
      const orderId = param(request, "orderId");
      if (!UUID_REGEX.test(orderId)) {
        return response.status(400).json({ success: false, message: "Invalid order ID format." });
      }

      const order = await adminService.forceDeliver(orderId, request.user!.userId);
      return response.status(200).json({
        success: true,
        message: "Order force-delivered successfully.",
        data: { order },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getAssignmentHistory(request: Request, response: Response, next: NextFunction) {
    try {
      const orderId = param(request, "orderId");
      if (!UUID_REGEX.test(orderId)) {
        return response.status(400).json({ success: false, message: "Invalid order ID format." });
      }

      const history = await adminService.getAssignmentHistory(orderId);
      return response.status(200).json({
        success: true,
        data: { history },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const adminController = new AdminController();
