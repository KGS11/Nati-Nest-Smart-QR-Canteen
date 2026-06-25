import {
  AssistanceStatus,
  AssistanceType,
  OrderItemStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  SessionStatus,
  TableStatus,
  Prisma,
  Role,
} from "@prisma/client";
import { Server } from "socket.io";
import { prisma } from "../config/db";
import { ROOMS } from "../sockets/rooms";
import { AppError } from "../utils/AppError";
import { sessionService } from "./session.service";

const getIo = (): Server => {
  const { io } = require("../index") as typeof import("../index");
  return io;
};

const serializePayment = <
  T extends {
    totalAmount: { toNumber(): number };
    tipAmount?: { toNumber(): number } | null;
  }
>(
  payment: T
) => ({
  ...payment,
  totalAmount: payment.totalAmount.toNumber(),
  tipAmount: payment.tipAmount ? payment.tipAmount.toNumber() : 0,
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
      const unitPrice = Number(item.unitPrice) || 0;
      const quantity = Number(item.quantity) || 0;
      const subtotal = Math.round(unitPrice * quantity * 100) / 100;
      totalAmount += subtotal;

      const existing = breakdown.get(item.menuItem.name);
      if (existing) {
        existing.quantity += quantity;
        existing.subtotal = Math.round((existing.subtotal + subtotal) * 100) / 100;
      } else {
        breakdown.set(item.menuItem.name, {
          name: item.menuItem.name,
          quantity,
          unitPrice,
          subtotal,
        });
      }

      return {
        ...item,
        unitPrice,
        menuItem: {
          ...item.menuItem,
          price: Number(item.menuItem.price) || 0,
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

      const sessionOrders = await prisma.order.findMany({
        where: {
          sessionId,
          status: { not: OrderStatus.CANCELLED },
        },
      });

      const hasUndelivered = sessionOrders.some(o => 
        ([OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY] as OrderStatus[]).includes(o.status)
      );

      if (hasUndelivered) {
        throw new AppError("Payment cannot be processed until all orders are delivered.", 400);
      }

      const billSummary = await buildBillSummary(sessionId);

      if (existingPayment?.status === PaymentStatus.PENDING) {
        const currentTotal = Number(existingPayment.totalAmount) || 0;
        if (currentTotal !== billSummary.totalAmount) {
          const updatedPayment = await prisma.payment.update({
            where: { id: existingPayment.id },
            data: { totalAmount: new Prisma.Decimal(billSummary.totalAmount) },
          });
          return {
            payment: serializePayment(updatedPayment),
            billSummary,
            isNew: false,
          };
        }
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

  async verifyPayment(paymentId: string, staffId: string, paymentMethod: PaymentMethod, role: string) {
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

      // Enforce waiter order ownership
      const sessionOrders = await prisma.order.findMany({
        where: { sessionId: payment.sessionId, status: { not: OrderStatus.CANCELLED } }
      });
      const assignedWaiterIds = [...new Set(sessionOrders.map(o => o.assignedWaiterId).filter(Boolean))];
      if (assignedWaiterIds.length > 0 && !assignedWaiterIds.includes(staffId) && role !== "ADMIN") {
        throw new AppError("Payment verification is restricted to the assigned waiter.", 403);
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

      // DB-06: Mark both DELIVERED, READY and PREPARED orders as PAID at payment time
      await prisma.order.updateMany({
        where: {
          sessionId: payment.session.id,
          status: { in: [OrderStatus.DELIVERED, OrderStatus.READY, OrderStatus.PREPARED] },
        },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
        },
      });

      // Auto-resolve any PENDING BILL assistance requests for this session.
      // The waiter is already verifying payment — the BILL request resolves naturally.
      await prisma.assistanceRequest.updateMany({
        where: {
          sessionId: payment.session.id,
          requestType: AssistanceType.BILL,
          status: AssistanceStatus.PENDING,
        },
        data: {
          status: AssistanceStatus.RESOLVED,
          resolvedAt: new Date(),
        },
      });

      await sessionService.clearWaiterAssignment(payment.session.id);

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

  async setTipAmount(sessionId: string, tipAmount: number) {
    try {
      const sanitizedTip = Number(tipAmount) || 0;
      if (isNaN(sanitizedTip) || sanitizedTip < 0) {
        throw new AppError("Invalid tip amount.", 400);
      }

      let payment = await prisma.payment.findUnique({
        where: { sessionId },
      });

      if (!payment) {
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

        const sessionOrders = await prisma.order.findMany({
          where: {
            sessionId,
            status: { not: OrderStatus.CANCELLED },
          },
        });

        const hasUndelivered = sessionOrders.some(o => 
          ([OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY] as OrderStatus[]).includes(o.status)
        );

        if (hasUndelivered) {
          throw new AppError("Payment cannot be processed until all orders are delivered.", 400);
        }

        const billSummary = await buildBillSummary(sessionId);
        if (billSummary.totalAmount === 0) {
          throw new AppError("No items to bill. Place an order first.", 400);
        }

        payment = await prisma.payment.create({
          data: {
            sessionId,
            totalAmount: billSummary.totalAmount,
            paymentMethod: PaymentMethod.CASH,
            status: PaymentStatus.PENDING,
            tipAmount: new Prisma.Decimal(sanitizedTip),
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
      } else {
        if (payment.status === PaymentStatus.COMPLETED) {
          throw new AppError("Payment already completed.", 400);
        }

        const billSummary = await buildBillSummary(sessionId);
        payment = await prisma.payment.update({
          where: { id: payment.id },
          data: {
            tipAmount: new Prisma.Decimal(sanitizedTip),
            totalAmount: new Prisma.Decimal(billSummary.totalAmount),
          },
        });
      }

      const serialized = serializePayment(payment);

      getIo().to(ROOMS.server).emit("payment:tip_updated", {
        paymentId: payment.id,
        tipAmount: serialized.tipAmount,
      });

      return serialized;
    } catch (error) {
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
