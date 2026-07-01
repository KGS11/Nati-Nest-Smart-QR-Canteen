import {
  AssistanceStatus,
  AssistanceType,
  OrderItemStatus,
  OrderStatus,
  Role,
} from "@prisma/client";
import { Server } from "socket.io";
import { prisma } from "../config/db";
import { ROOMS } from "../sockets/rooms";
import { AppError } from "../utils/AppError";
import { notifyWaiter } from "../utils/notification.util";
import { buildBillSummary, paymentService } from "./payment.service";

type ServerOrder = Awaited<ReturnType<typeof serverOrderById>>;

const getIo = (): Server => {
  const { io } = require("../index") as typeof import("../index");
  return io;
};

const serverOrderById = async (orderId: string) => {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      session: {
        include: {
          table: {
            select: { tableNumber: true },
          },
        },
      },
      items: {
        include: { menuItem: true },
      },
    },
  });
};

const serializeOrder = <T extends NonNullable<ServerOrder>>(order: T) => ({
  ...order,
  items: order.items.map((item) => ({
    ...item,
    unitPrice: item.unitPrice.toNumber(),
    menuItem: {
      ...item.menuItem,
      price: item.menuItem.price.toNumber(),
    },
  })),
});

const serializeReadyOrder = <T extends NonNullable<ServerOrder>>(order: T) => {
  const activeItems = order.items.filter((item) => item.status === OrderItemStatus.ACTIVE);
  const subtotal = activeItems.reduce(
    (sum, item) => sum + item.unitPrice.toNumber() * item.quantity,
    0,
  );

  return {
    ...order,
    items: activeItems.map((item) => ({
      ...item,
      unitPrice: item.unitPrice.toNumber(),
      menuItem: {
        ...item.menuItem,
        price: item.menuItem.price.toNumber(),
      },
    })),
    subtotal: Math.round(subtotal * 100) / 100,
  };
};

const requestMessage = (requestType: AssistanceType, tableNumber: string) => {
  switch (requestType) {
    case AssistanceType.WATER:
      return `Water requested at Table ${tableNumber}`;
    case AssistanceType.PLATE:
      return `Plate requested at Table ${tableNumber}`;
    case AssistanceType.BILL:
      return `Bill requested at Table ${tableNumber}`;
    case AssistanceType.GENERAL:
    default:
      return `Assistance requested at Table ${tableNumber}`;
  }
};

const resolvedMessage = (requestType: AssistanceType) => {
  switch (requestType) {
    case AssistanceType.WATER:
      return "Water is on its way to your table.";
    case AssistanceType.PLATE:
      return "Plates are on their way to your table.";
    case AssistanceType.BILL:
      return "Your bill is on its way.";
    case AssistanceType.GENERAL:
    default:
      return "A staff member is on their way to assist you.";
  }
};

export class ServerService {
  async getReadyOrders(userId?: string, own: boolean = true) {
    try {
      const whereClause: any = {
        status: { in: [OrderStatus.READY, OrderStatus.PREPARED] },
      };

      if (userId && own) {
        whereClause.session = {
          assignedWaiterId: userId,
        };
      }

      const orders = await prisma.order.findMany({
        where: whereClause,
        orderBy: { readyAt: "asc" },
        include: {
          session: {
            include: {
              table: {
                select: { tableNumber: true },
              },
            },
          },
          items: {
            where: { status: OrderItemStatus.ACTIVE },
            include: { menuItem: true },
          },
        },
      });

      return orders.map((order) => serializeReadyOrder(order));
    } catch (error) {
      throw error;
    }
  }

  async getInProgressOrders(userId?: string) {
    try {
      const whereClause: any = {
        status: { in: [OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING] },
      };

      if (userId) {
        whereClause.session = {
          assignedWaiterId: userId,
        };
      }

      const orders = await prisma.order.findMany({
        where: whereClause,
        orderBy: { placedAt: "asc" },
        include: {
          session: {
            include: {
              table: {
                select: { tableNumber: true },
              },
            },
          },
          items: {
            where: { status: OrderItemStatus.ACTIVE },
            include: { menuItem: true },
          },
        },
      });

      return orders.map((order) => serializeReadyOrder(order));
    } catch (error) {
      throw error;
    }
  }

  async claimDelivery(orderId: string, staffId: string, staffName: string) {
    try {
      const updateResult = await prisma.order.updateMany({
        where: {
          id: orderId,
          status: { in: [OrderStatus.READY, OrderStatus.PREPARED] },
          assignedWaiterId: null,
        },
        data: {
          assignedWaiterId: staffId,
          assignedWaiterName: staffName,
          assignedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        const existingOrder = await prisma.order.findUnique({
          where: { id: orderId },
        });

        if (!existingOrder) {
          throw new AppError("Order not found", 404);
        }

        if (existingOrder.status !== OrderStatus.READY && existingOrder.status !== OrderStatus.PREPARED) {
          throw new AppError("Only READY or PREPARED orders can be claimed for delivery.", 400);
        }

        if (existingOrder.assignedWaiterId) {
          throw new AppError(`This delivery is already claimed by ${existingOrder.assignedWaiterName || "another waiter"}.`, 409);
        }

        throw new AppError("Failed to claim delivery.", 400);
      }

      const updatedOrder = await serverOrderById(orderId);
      if (!updatedOrder) {
        throw new AppError("Order not found", 404);
      }

      await prisma.orderAssignmentHistory.create({
        data: {
          orderId,
          staffId,
          role: Role.SERVER,
          action: "CLAIMED",
        },
      });

      const io = getIo();
      io.to(ROOMS.server).emit("order:claimed:waiter", {
        orderId: updatedOrder.id,
        assignedWaiterId: staffId,
        assignedWaiterName: staffName,
        status: updatedOrder.status,
      });

      return serializeOrder(updatedOrder);
    } catch (error) {
      throw error;
    }
  }

  async releaseDelivery(orderId: string, userId: string, role: string) {
    try {
      const order = await serverOrderById(orderId);
      if (!order) {
        throw new AppError("Order not found", 404);
      }

      if (order.status !== OrderStatus.READY && order.status !== OrderStatus.PREPARED) {
        throw new AppError("Only READY or PREPARED orders can be released.", 400);
      }

      if (!order.assignedWaiterId) {
        throw new AppError("Delivery is not claimed.", 400);
      }

      if (order.assignedWaiterId !== userId && role !== "ADMIN") {
        throw new AppError("This delivery is assigned to another waiter.", 403);
      }

      const staffId = order.assignedWaiterId;
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          assignedWaiterId: null,
          assignedWaiterName: null,
          assignedAt: null,
        },
        include: {
          session: { include: { table: { select: { tableNumber: true } } } },
          items: { include: { menuItem: true } },
        },
      });

      await prisma.orderAssignmentHistory.create({
        data: {
          orderId,
          staffId,
          role: Role.SERVER,
          action: "RELEASED",
        },
      });

      const io = getIo();
      io.to(ROOMS.server).emit("order:released", {
        orderId,
        role: Role.SERVER,
        status: updatedOrder.status,
      });

      return serializeOrder(updatedOrder);
    } catch (error) {
      throw error;
    }
  }

  async markDelivered(orderId: string, staffId: string, staffName: string, role: string) {
    try {
      const order = await serverOrderById(orderId);

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      if (order.status !== OrderStatus.READY && order.status !== OrderStatus.PREPARED) {
        throw new AppError("Only READY or PREPARED orders can be marked as delivered.", 400);
      }

      if (!order.assignedWaiterId) {
        throw new AppError("You must claim this delivery first.", 400);
      }

      if (order.assignedWaiterId !== staffId && role !== "ADMIN") {
        throw new AppError("This order is assigned to another waiter.", 403);
      }

      const deliveredAt = new Date();
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.DELIVERED,
          deliveredAt,
          deliveredBy: staffName,
        },
        include: {
          session: { include: { table: { select: { tableNumber: true } } } },
          items: { include: { menuItem: true } },
        },
      });

      await prisma.orderAssignmentHistory.create({
        data: {
          orderId,
          staffId,
          role: Role.SERVER,
          action: "DELIVERED",
        },
      });

      const payload = {
        orderId: updatedOrder.id,
        status: OrderStatus.DELIVERED,
        tableNumber: updatedOrder.session.table.tableNumber,
        deliveredAt: updatedOrder.deliveredAt,
        assignedWaiterId: updatedOrder.assignedWaiterId,
        assignedWaiterName: updatedOrder.assignedWaiterName,
        deliveredBy: staffName,
      };
      await notifyWaiter(updatedOrder.session.id, "order:status_updated", payload);
      await notifyWaiter(updatedOrder.session.id, "order:delivered", {
        orderId: updatedOrder.id,
        deliveredBy: staffName,
      });
      getIo().to(ROOMS.session(updatedOrder.session.id)).emit("order:delivered", {
        orderId: updatedOrder.id,
        message: "Your order has been delivered. Enjoy your meal!",
        deliveredAt: updatedOrder.deliveredAt,
      });

      return serializeOrder(updatedOrder);
    } catch (error) {
      throw error;
    }
  }

  async getAssistanceRequests(userId?: string, own: boolean = true) {
    try {
      const whereClause: any = { status: AssistanceStatus.PENDING };

      if (userId && own) {
        whereClause.session = {
          assignedWaiterId: userId,
        };
      }

      const requests = await prisma.assistanceRequest.findMany({
        where: whereClause,
        include: {
          session: {
            include: {
              table: {
                select: { tableNumber: true },
              },
            },
          },
        },
      });

      const priorityOrder: Record<AssistanceType, number> = {
        BILL: 0,
        WATER: 1,
        PLATE: 1,
        GENERAL: 2,
      };

      requests.sort((a, b) => {
        const typeDiff = priorityOrder[a.requestType] - priorityOrder[b.requestType];
        if (typeDiff !== 0) return typeDiff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      return requests;
    } catch (error) {
      throw error;
    }
  }

  async resolveAssistanceRequest(requestId: string, staffId: string) {
    try {
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId },
        include: {
          session: {
            include: {
              table: {
                select: { tableNumber: true },
              },
            },
          },
        },
      });

      if (!request) {
        throw new AppError("Assistance request not found", 404);
      }

      if (request.status !== AssistanceStatus.PENDING) {
        throw new AppError("This request has already been resolved.", 400);
      }

      const updatedRequest = await prisma.assistanceRequest.update({
        where: { id: requestId },
        data: {
          status: AssistanceStatus.RESOLVED,
          resolvedById: staffId,
          resolvedAt: new Date(),
        },
        include: {
          session: {
            include: {
              table: {
                select: { tableNumber: true },
              },
            },
          },
        },
      });

      await notifyWaiter(updatedRequest.session.id, "assistance:resolved", {
        requestId: updatedRequest.id,
        tableNumber: updatedRequest.session.table.tableNumber,
        requestType: updatedRequest.requestType,
        resolvedAt: updatedRequest.resolvedAt,
      });
      getIo().to(ROOMS.session(updatedRequest.session.id)).emit("assistance:resolved", {
        requestId: updatedRequest.id,
        requestType: updatedRequest.requestType,
        message: resolvedMessage(updatedRequest.requestType),
      });

      return updatedRequest;
    } catch (error) {
      throw error;
    }
  }

  async createAssistanceRequest(sessionId: string, requestType: AssistanceType) {
    try {
      const session = await prisma.tableSession.findUnique({
        where: { id: sessionId },
        include: {
          table: {
            select: { tableNumber: true },
          },
        },
      });

      if (!session || session.status !== "ACTIVE") {
        throw new AppError("Session not found or ended", 404);
      }

      const existingRequest = await prisma.assistanceRequest.findFirst({
        where: {
          sessionId,
          requestType,
          status: AssistanceStatus.PENDING,
        },
      });

      if (existingRequest) {
        throw new AppError("A request of this type is already pending for your table.", 409);
      }

      const request = await prisma.assistanceRequest.create({
        data: {
          sessionId,
          requestType,
          status: AssistanceStatus.PENDING,
        },
        include: {
          session: {
            include: {
              table: {
                select: { tableNumber: true },
              },
            },
          },
        },
      });

      let paymentData: { paymentId: string; totalAmount: number } | undefined;

      if (requestType === AssistanceType.BILL) {
        const { payment } = await paymentService.createPaymentOnBillRequest(sessionId);
        paymentData = {
          paymentId: payment.id,
          totalAmount: payment.totalAmount,
        };
      }

      const pendingCount = await prisma.assistanceRequest.count({
        where: { sessionId, status: AssistanceStatus.PENDING },
      });

      if (pendingCount === 1 && !session.assignedWaiterId) {
        const { sessionService } = require("./session.service") as typeof import("./session.service");
        await sessionService.requestWaiterAssignment(sessionId);
      }

      await notifyWaiter(sessionId, "assistance:new", {
        requestId: request.id,
        sessionId,
        tableNumber: request.session.table.tableNumber,
        requestType,
        createdAt: request.createdAt,
        message: requestMessage(requestType, request.session.table.tableNumber),
        payment: paymentData,
      }, requestType === AssistanceType.BILL);

      return request;
    } catch (error) {
      throw error;
    }
  }

  async getSessionBillSummary(sessionId: string) {
    try {
      return buildBillSummary(sessionId);
    } catch (error) {
      throw error;
    }
  }

  async updateOrderNotes(orderId: string, notes: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          specialNotes: notes || null,
        },
      });

      getIo().to(ROOMS.kitchen).emit("order:notes_updated", {
        orderId,
        specialNotes: notes || null,
      });

      getIo().to(ROOMS.server).emit("order:notes_updated", {
        orderId,
        specialNotes: notes || null,
      });

      return updatedOrder;
    } catch (error) {
      throw error;
    }
  }
}

export const serverService = new ServerService();
