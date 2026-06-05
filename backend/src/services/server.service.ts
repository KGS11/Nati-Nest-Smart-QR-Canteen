import {
  AssistanceStatus,
  AssistanceType,
  OrderItemStatus,
  OrderStatus,
} from "@prisma/client";
import { Server } from "socket.io";
import { prisma } from "../config/db";
import { ROOMS } from "../sockets/rooms";
import { AppError } from "../utils/AppError";
import { paymentService } from "./payment.service";

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
    case AssistanceType.BILL:
      return "Your bill is on its way.";
    case AssistanceType.GENERAL:
    default:
      return "A staff member is on their way to assist you.";
  }
};

export class ServerService {
  async getReadyOrders() {
    try {
      const orders = await prisma.order.findMany({
        where: { status: OrderStatus.READY },
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

  async markDelivered(orderId: string, _staffId: string) {
    try {
      const order = await serverOrderById(orderId);

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      if (order.status !== OrderStatus.READY) {
        throw new AppError("Only READY orders can be marked as delivered.", 400);
      }

      const deliveredAt = new Date();
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.DELIVERED, deliveredAt },
        include: {
          session: { include: { table: { select: { tableNumber: true } } } },
          items: { include: { menuItem: true } },
        },
      });

      const payload = {
        orderId: updatedOrder.id,
        status: OrderStatus.DELIVERED,
        tableNumber: updatedOrder.session.table.tableNumber,
        deliveredAt: updatedOrder.deliveredAt,
      };
      const io = getIo();
      io.to(ROOMS.server).emit("order:status_updated", payload);
      io.to(ROOMS.kitchen).emit("order:status_updated", payload);
      io.to(ROOMS.session(updatedOrder.session.id)).emit("order:delivered", {
        orderId: updatedOrder.id,
        message: "Your order has been delivered. Enjoy your meal!",
        deliveredAt: updatedOrder.deliveredAt,
      });

      return serializeOrder(updatedOrder);
    } catch (error) {
      throw error;
    }
  }

  async getAssistanceRequests() {
    try {
      return prisma.assistanceRequest.findMany({
        where: { status: AssistanceStatus.PENDING },
        orderBy: { createdAt: "asc" },
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

      const io = getIo();
      io.to(ROOMS.server).emit("assistance:resolved", {
        requestId: updatedRequest.id,
        tableNumber: updatedRequest.session.table.tableNumber,
        requestType: updatedRequest.requestType,
        resolvedAt: updatedRequest.resolvedAt,
      });
      io.to(ROOMS.session(updatedRequest.session.id)).emit("assistance:resolved", {
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
        // BR-04: Propagate payment errors for BILL requests — don't swallow silently
        const { payment } = await paymentService.createPaymentOnBillRequest(sessionId);
        paymentData = {
          paymentId: payment.id,
          totalAmount: payment.totalAmount,
        };
      }

      getIo().to(ROOMS.server).emit("assistance:new", {
        requestId: request.id,
        sessionId,
        tableNumber: request.session.table.tableNumber,
        requestType,
        createdAt: request.createdAt,
        message: requestMessage(requestType, request.session.table.tableNumber),
        payment: paymentData,
      });

      return request;
    } catch (error) {
      throw error;
    }
  }

  async getSessionBillSummary(sessionId: string) {
    try {
      const session = await prisma.tableSession.findUnique({
        where: { id: sessionId },
        include: { table: { select: { tableNumber: true } } },
      });

      if (!session) {
        throw new AppError("Session not found", 404);
      }

      const orders = await prisma.order.findMany({
        where: {
          sessionId,
          status: { not: OrderStatus.CANCELLED },
        },
        include: {
          items: {
            where: { status: OrderItemStatus.ACTIVE },
            include: { menuItem: true },
          },
        },
      });

      const breakdown = new Map<
        string,
        { name: string; quantity: number; unitPrice: number; subtotal: number }
      >();
      let totalAmount = 0;

      const serializedOrders = orders.map((order) => ({
        ...order,
        items: order.items.map((item) => {
          const unitPrice = item.unitPrice.toNumber();
          const subtotal = Math.round(unitPrice * item.quantity * 100) / 100;
          totalAmount += subtotal;

          const existing = breakdown.get(item.menuItem.name);
          if (existing) {
            existing.quantity += item.quantity;
            existing.subtotal = Math.round((existing.subtotal + subtotal) * 100) / 100;
          } else {
            breakdown.set(item.menuItem.name, {
              name: item.menuItem.name,
              quantity: item.quantity,
              unitPrice,
              subtotal,
            });
          }

          return {
            ...item,
            unitPrice,
            menuItem: {
              ...item.menuItem,
              price: item.menuItem.price.toNumber(),
            },
          };
        }),
      }));

      return {
        tableNumber: session.table.tableNumber,
        orders: serializedOrders,
        totalAmount: Math.round(totalAmount * 100) / 100,
        itemBreakdown: Array.from(breakdown.values()),
      };
    } catch (error) {
      throw error;
    }
  }
}

export const serverService = new ServerService();
