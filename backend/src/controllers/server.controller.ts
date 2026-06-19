import { AssistanceType } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { serverService } from "../services/server.service";
import { sessionService } from "../services/session.service";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const assistanceTypeSchema = z.enum(
  [AssistanceType.WATER, AssistanceType.BILL, AssistanceType.GENERAL, AssistanceType.PLATE] as const,
  { error: `requestType must be one of: ${Object.values(AssistanceType).join(", ")}` },
);

const param = (request: Request, key: string) => {
  const value = request.params[key];
  return Array.isArray(value) ? value[0] : value;
};

export class ServerController {
  async getReadyOrders(request: Request, response: Response, next: NextFunction) {
    try {
      const own = request.query.own !== "false";
      const orders = await serverService.getReadyOrders(request.user?.userId, own);
      return response.status(200).json({
        success: true,
        data: { orders, count: orders.length },
      });
    } catch (error) {
      return next(error);
    }
  }

  async markDelivered(request: Request, response: Response, next: NextFunction) {
    try {
      const orderId = param(request, "orderId");
      if (!UUID_REGEX.test(orderId)) {
        return response.status(400).json({ success: false, message: "Invalid order ID format." });
      }

      const order = await serverService.markDelivered(
        orderId,
        request.user!.userId,
        request.user!.name,
        request.user!.role,
      );
      return response.status(200).json({
        success: true,
        message: "Order marked as delivered",
        data: { order },
      });
    } catch (error) {
      return next(error);
    }
  }

  async claimDelivery(request: Request, response: Response, next: NextFunction) {
    try {
      const orderId = param(request, "orderId");
      if (!UUID_REGEX.test(orderId)) {
        return response.status(400).json({ success: false, message: "Invalid order ID format." });
      }

      const staffId = request.user!.userId;
      const staffName = request.user!.name;

      const order = await serverService.claimDelivery(orderId, staffId, staffName);
      return response.status(200).json({
        success: true,
        message: "Delivery claimed successfully",
        data: { order },
      });
    } catch (error) {
      return next(error);
    }
  }

  async releaseDelivery(request: Request, response: Response, next: NextFunction) {
    try {
      const orderId = param(request, "orderId");
      if (!UUID_REGEX.test(orderId)) {
        return response.status(400).json({ success: false, message: "Invalid order ID format." });
      }

      const user = request.user!;
      const order = await serverService.releaseDelivery(orderId, user.userId, user.role);
      return response.status(200).json({
        success: true,
        message: "Delivery released back to available queue",
        data: { order },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getAssistanceRequests(request: Request, response: Response, next: NextFunction) {
    try {
      const own = request.query.own !== "false";
      const requests = await serverService.getAssistanceRequests(request.user?.userId, own);
      return response.status(200).json({
        success: true,
        data: { requests, count: requests.length },
      });
    } catch (error) {
      return next(error);
    }
  }

  async resolveAssistanceRequest(request: Request, response: Response, next: NextFunction) {
    try {
      const requestId = param(request, "requestId");

      if (!UUID_REGEX.test(requestId)) {
        return response.status(400).json({ success: false, message: "Invalid request ID format." });
      }

      const resolvedRequest = await serverService.resolveAssistanceRequest(
        requestId,
        request.user!.userId,
      );
      return response.status(200).json({
        success: true,
        message: "Request resolved",
        data: { request: resolvedRequest },
      });
    } catch (error) {
      return next(error);
    }
  }

  async createAssistanceRequest(request: Request, response: Response, next: NextFunction) {
    try {
      const parsed = assistanceTypeSchema.safeParse(request.body.requestType);
      if (!parsed.success) {
        return response.status(400).json({
          success: false,
          message: parsed.error.issues[0]?.message ?? "Invalid requestType.",
        });
      }

      const createdRequest = await serverService.createAssistanceRequest(
        request.session!.sessionId,
        parsed.data,
      );
      return response.status(201).json({
        success: true,
        message: "Request sent to staff",
        data: { request: createdRequest },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getSessionBillSummary(request: Request, response: Response, next: NextFunction) {
    try {
      const sessionId = request.session?.sessionId ?? param(request, "sessionId");
      const billSummary = await serverService.getSessionBillSummary(sessionId);
      return response.status(200).json({
        success: true,
        data: billSummary,
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateOrderNotes(request: Request, response: Response, next: NextFunction) {
    try {
      const orderId = param(request, "orderId");
      if (!UUID_REGEX.test(orderId)) {
        return response.status(400).json({ success: false, message: "Invalid order ID format." });
      }

      const { specialNotes } = request.body;
      const order = await serverService.updateOrderNotes(orderId, specialNotes);
      return response.status(200).json({
        success: true,
        message: "Order special notes updated successfully",
        data: { order },
      });
    } catch (error) {
      return next(error);
    }
  }
  async acceptWaiterAssignment(request: Request, response: Response, next: NextFunction) {
    try {
      const requestId = param(request, "requestId");
      if (!UUID_REGEX.test(requestId)) {
        return response.status(400).json({ success: false, message: "Invalid request ID format." });
      }

      const waiterId = request.user!.userId;
      const result = await sessionService.acceptWaiterAssignment(requestId, waiterId);

      if (result.alreadyTaken) {
        return response.status(409).json({
          success: false,
          message: "Table already assigned to another waiter.",
        });
      }

      return response.status(200).json({
        success: true,
        message: "Table assignment accepted.",
      });
    } catch (error) {
      return next(error);
    }
  }

  async getMyTables(request: Request, response: Response, next: NextFunction) {
    try {
      const waiterId = request.user!.userId;
      const myTables = await sessionService.getMyTables(waiterId);
      return response.status(200).json({
        success: true,
        data: { myTables },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getAssignmentRequests(request: Request, response: Response, next: NextFunction) {
    try {
      const requests = await sessionService.getAssignmentRequests();
      return response.status(200).json({
        success: true,
        data: { requests, count: requests.length },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const serverController = new ServerController();
