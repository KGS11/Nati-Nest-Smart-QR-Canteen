import {
  OrderItemStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  SessionStatus,
  TableStatus,
} from "@prisma/client";
import { Server } from "socket.io";
import { prisma } from "../config/db";
import { ROOMS } from "../sockets/rooms";
import { AppError } from "../utils/AppError";

const getIo = (): Server => {
  const { io } = require("../index") as typeof import("../index");
  return io;
};

const serializePayment = <T extends { totalAmount: { toNumber(): number } }>(payment: T) => ({
  ...payment,
  totalAmount: payment.totalAmount.toNumber(),
});

const buildBillSummary = async (sessionId: string) => {
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
};

export class PaymentService {
  async createPaymentOnBillRequest(sessionId: string) {
    try {
      const session = await prisma.tableSession.findUnique({
        where: { id: sessionId },
        include: { table: { select: { tableNumber: true } } },
      });

      if (!session) {
        throw new AppError("Session not found", 404);
      }

      if (session.status !== SessionStatus.ACTIVE) {
        throw new AppError("Session has already ended.", 400);
      }

      const existingPayment = await prisma.payment.findUnique({
        where: { sessionId },
      });
      const billSummary = await buildBillSummary(sessionId);

      if (existingPayment?.status === PaymentStatus.PENDING) {
        return {
          payment: serializePayment(existingPayment),
          billSummary,
          isNew: false,
        };
      }

      if (existingPayment?.status === PaymentStatus.COMPLETED) {
        throw new AppError("Payment already completed.", 400);
      }

      if (billSummary.totalAmount === 0) {
        throw new AppError("No items to bill. Place an order first.", 400);
      }

      const payment = await prisma.payment.create({
        data: {
          sessionId,
          totalAmount: billSummary.totalAmount,
          paymentMethod: PaymentMethod.CASH,
          status: PaymentStatus.PENDING,
        },
      });
      const serializedPayment = serializePayment(payment);

      getIo().to(ROOMS.server).emit("payment:bill_requested", {
        sessionId,
        paymentId: payment.id,
        tableNumber: session.table.tableNumber,
        totalAmount: serializedPayment.totalAmount,
        requestedAt: new Date(),
      });

      return {
        payment: serializedPayment,
        billSummary,
        isNew: true,
      };
    } catch (error) {
      throw error;
    }
  }

  async verifyPayment(paymentId: string, staffId: string, paymentMethod: PaymentMethod) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
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

      if (!payment) {
        throw new AppError("Payment not found", 404);
      }

      if (payment.status === PaymentStatus.COMPLETED) {
        throw new AppError("Payment has already been verified.", 400);
      }

      if (payment.status !== PaymentStatus.PENDING) {
        throw new AppError("Invalid payment status.", 400);
      }

      const verifiedAt = new Date();
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.COMPLETED,
          paymentMethod,
          verifiedById: staffId,
          verifiedAt,
        },
        include: {
          session: {
            include: {
              table: {
                select: { tableNumber: true },
              },
            },
          },
          verifiedBy: {
            select: { name: true },
          },
        },
      });

      const [closedSession] = await prisma.$transaction([
        prisma.tableSession.update({
          where: { id: payment.session.id },
          data: {
            status: SessionStatus.CLOSED,
            closedAt: new Date(),
          },
        }),
        prisma.restaurantTable.update({
          where: { id: payment.session.tableId },
          data: { status: TableStatus.AVAILABLE },
        }),
      ]);

      // DB-06: Mark both DELIVERED and READY orders as PAID at payment time
      await prisma.order.updateMany({
        where: {
          sessionId: payment.session.id,
          status: { in: [OrderStatus.DELIVERED, OrderStatus.READY] },
        },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
        },
      });

      const serializedPayment = serializePayment(updatedPayment);
      const io = getIo();
      io.to(ROOMS.session(payment.session.id)).emit("payment:confirmed", {
        paymentId: updatedPayment.id,
        totalAmount: serializedPayment.totalAmount,
        paymentMethod,
        message: "Payment confirmed. Thank you for dining with us!",
        verifiedAt: updatedPayment.verifiedAt,
      });
      io.to(ROOMS.server).emit("payment:completed", {
        paymentId: updatedPayment.id,
        sessionId: payment.session.id,
        tableNumber: payment.session.table.tableNumber,
        totalAmount: serializedPayment.totalAmount,
        paymentMethod,
        verifiedAt: updatedPayment.verifiedAt,
      });
      io.to(ROOMS.kitchen).emit("table:available", {
        tableId: payment.session.tableId,
        tableNumber: payment.session.table.tableNumber,
        message: "Table is now available",
      });

      return {
        payment: serializedPayment,
        session: closedSession,
      };
    } catch (error) {
      throw error;
    }
  }

  async getPaymentBySession(sessionId: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { sessionId },
        include: {
          verifiedBy: {
            select: { name: true },
          },
        },
      });

      return payment ? serializePayment(payment) : null;
    } catch (error) {
      throw error;
    }
  }

  async getPendingPayments() {
    try {
      const payments = await prisma.payment.findMany({
        where: { status: PaymentStatus.PENDING },
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

      return payments.map((payment) => serializePayment(payment));
    } catch (error) {
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
