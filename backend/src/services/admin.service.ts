import { prisma } from "../config/db";
import { OrderItemStatus, OrderStatus, PaymentStatus, Prisma, Role } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { ROOMS } from "../sockets/rooms";
import { notifyWaiter } from "../utils/notification.util";

type CancelOrderItemInput = {
  reason: string;
  notes?: string;
};

type AdminActor = {
  userId: string;
  name: string;
};

const getIo = () => {
  const { io } = require("../index");
  return io;
};

const complaintCancellableStatuses: OrderStatus[] = [OrderStatus.DELIVERED, OrderStatus.PAID];

export class AdminService {
  private calculateActiveTotal(
    orders: Array<{
      status: OrderStatus;
      items: Array<{ status: OrderItemStatus; unitPrice: Prisma.Decimal; quantity: number }>;
    }>,
  ) {
    const total = orders
      .filter((order) => order.status !== OrderStatus.CANCELLED)
      .flatMap((order) => order.items)
      .filter((item) => item.status === OrderItemStatus.ACTIVE)
      .reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);

    return Math.max(0, Math.round(total * 100) / 100);
  }

  async cancelOrderItem(
    orderId: string,
    itemId: string,
    input: CancelOrderItemInput,
    admin: AdminActor,
    ipAddress?: string,
  ) {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          session: {
            include: {
              table: { select: { tableNumber: true } },
            },
          },
          items: {
            include: { menuItem: true },
          },
        },
      });

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      if (!complaintCancellableStatuses.includes(order.status)) {
        throw new AppError("Only delivered or paid order items can be cancelled by admin.", 400);
      }

      const item = order.items.find((orderItem) => orderItem.id === itemId);
      if (!item) {
        throw new AppError("Order item not found", 404);
      }

      if (item.status === OrderItemStatus.CANCELLED_BY_ADMIN) {
        throw new AppError("Order item is already cancelled by restaurant.", 409);
      }

      if (item.status !== OrderItemStatus.ACTIVE) {
        throw new AppError("Only active order items can be cancelled by admin.", 400);
      }

      const payment = await tx.payment.findUnique({
        where: { sessionId: order.sessionId },
      });

      const sessionOrdersBefore = await tx.order.findMany({
        where: { sessionId: order.sessionId },
        include: { items: true },
      });
      const oldTotal = payment ? Number(payment.totalAmount) : this.calculateActiveTotal(sessionOrdersBefore);
      const originalAmount = Math.round(Number(item.unitPrice) * item.quantity * 100) / 100;
      const now = new Date();

      const updatedItem = await tx.orderItem.update({
        where: { id: itemId },
        data: {
          status: OrderItemStatus.CANCELLED_BY_ADMIN,
          cancelledAt: now,
          cancelledById: admin.userId,
          cancellationReason: input.reason,
          cancellationNotes: input.notes?.trim() || null,
          originalAmount: new Prisma.Decimal(originalAmount),
        },
        include: {
          menuItem: true,
          cancelledBy: { select: { id: true, name: true } },
        },
      });

      const sessionOrdersAfter = await tx.order.findMany({
        where: { sessionId: order.sessionId },
        include: { items: true },
      });
      const newTotal = this.calculateActiveTotal(sessionOrdersAfter);

      let adjustment:
        | {
            id: string;
            amount: Prisma.Decimal;
            status: string;
          }
        | null = null;

      if (payment?.status === PaymentStatus.PENDING) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { totalAmount: new Prisma.Decimal(newTotal) },
        });
      }

      if (payment?.status === PaymentStatus.COMPLETED) {
        adjustment = await tx.paymentAdjustment.create({
          data: {
            paymentId: payment.id,
            sessionId: order.sessionId,
            orderItemId: itemId,
            adminId: admin.userId,
            amount: new Prisma.Decimal(originalAmount),
            reason: input.reason,
            notes: input.notes?.trim() || null,
            status: "REFUND_PENDING",
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: admin.userId,
          action: "ORDER_ITEM_CANCELLED_BY_ADMIN",
          entityType: "OrderItem",
          entityId: itemId,
          ipAddress: ipAddress || null,
          metadata: {
            adminName: admin.name,
            orderId,
            sessionId: order.sessionId,
            tableNumber: order.session.table.tableNumber,
            menuItemId: item.menuItemId,
            menuItemName: item.menuItem.name,
            previousStatus: item.status,
            newStatus: OrderItemStatus.CANCELLED_BY_ADMIN,
            reason: input.reason,
            notes: input.notes?.trim() || null,
            originalAmount,
            oldTotal,
            newTotal,
            paymentId: payment?.id ?? null,
            paymentStatus: payment?.status ?? null,
            adjustmentId: adjustment?.id ?? null,
            adjustmentStatus: adjustment?.status ?? null,
          },
        },
      });

      return {
        order,
        item: updatedItem,
        oldTotal,
        newTotal,
        amountDeducted: originalAmount,
        paymentStatus: payment?.status ?? null,
        adjustment: adjustment
          ? {
              id: adjustment.id,
              amount: Number(adjustment.amount),
              status: adjustment.status,
            }
          : null,
      };
    });

    const payload = {
      orderId,
      itemId,
      sessionId: result.order.sessionId,
      tableNumber: result.order.session.table.tableNumber,
      name: result.item.menuItem.name,
      quantity: result.item.quantity,
      unitPrice: Number(result.item.unitPrice),
      amountDeducted: result.amountDeducted,
      reason: result.item.cancellationReason,
      notes: result.item.cancellationNotes,
      cancelledAt: result.item.cancelledAt,
      cancelledBy: result.item.cancelledBy?.name ?? admin.name,
      oldTotal: result.oldTotal,
      newTotal: result.newTotal,
      paymentStatus: result.paymentStatus,
      adjustment: result.adjustment,
    };

    const io = getIo();
    io.to(ROOMS.session(result.order.sessionId)).emit("order:item_cancelled", payload);
    io.to(ROOMS.session(result.order.sessionId)).emit("bill:updated", {
      sessionId: result.order.sessionId,
      tableNumber: result.order.session.table.tableNumber,
      totalAmount: result.newTotal,
      updatedAt: new Date(),
    });
    io.to(ROOMS.admin).emit("order:item_cancelled", payload);

    await notifyWaiter(result.order.sessionId, "order:item_cancelled", payload, true);

    return payload;
  }

  async getComplaintEligibleOrders() {
    const orders = await prisma.order.findMany({
      where: {
        status: { in: complaintCancellableStatuses },
      },
      orderBy: { deliveredAt: "desc" },
      take: 30,
      include: {
        session: {
          include: {
            table: { select: { tableNumber: true } },
          },
        },
        items: {
          include: { menuItem: true },
        },
      },
    });

    return orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        originalAmount: item.originalAmount ? Number(item.originalAmount) : null,
        menuItem: {
          ...item.menuItem,
          price: Number(item.menuItem.price),
        },
      })),
    }));
  }

  async reassignKitchen(orderId: string, staffId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new AppError("Order not found", 404);

    const staff = await prisma.user.findUnique({
      where: { id: staffId },
    });
    if (!staff || staff.role !== Role.KITCHEN) {
      throw new AppError("Invalid kitchen staff member.", 400);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        assignedKitchenId: staff.id,
        assignedKitchenName: staff.name,
        status: order.status === OrderStatus.PLACED ? OrderStatus.ACCEPTED : order.status,
        acceptedAt: order.acceptedAt ?? new Date(),
      },
    });

    await prisma.orderAssignmentHistory.create({
      data: {
        orderId,
        staffId: staff.id,
        role: Role.KITCHEN,
        action: "REASSIGNED",
      },
    });

    const io = getIo();
    io.to(ROOMS.kitchen).emit("order:reassigned", {
      orderId,
      assignedKitchenId: staff.id,
      assignedKitchenName: staff.name,
      role: Role.KITCHEN,
      status: updatedOrder.status,
    });

    return updatedOrder;
  }

  async reassignWaiter(orderId: string, staffId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new AppError("Order not found", 404);

    const staff = await prisma.user.findUnique({
      where: { id: staffId },
    });
    if (!staff || staff.role !== Role.SERVER) {
      throw new AppError("Invalid waiter staff member.", 400);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        assignedWaiterId: staff.id,
        assignedWaiterName: staff.name,
        assignedAt: new Date(),
      },
    });

    await prisma.orderAssignmentHistory.create({
      data: {
        orderId,
        staffId: staff.id,
        role: Role.SERVER,
        action: "REASSIGNED",
      },
    });

    const io = getIo();
    io.to(ROOMS.server).emit("order:reassigned", {
      orderId,
      assignedWaiterId: staff.id,
      assignedWaiterName: staff.name,
      role: Role.SERVER,
      status: order.status,
    });

    return updatedOrder;
  }

  async forceUnclaimKitchen(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new AppError("Order not found", 404);
    if (!order.assignedKitchenId) throw new AppError("Order is not claimed.", 400);

    const staffId = order.assignedKitchenId;
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PLACED,
        assignedKitchenId: null,
        assignedKitchenName: null,
        acceptedAt: null,
        preparingAt: null,
      },
    });

    await prisma.orderAssignmentHistory.create({
      data: {
        orderId,
        staffId,
        role: Role.KITCHEN,
        action: "RELEASED",
      },
    });

    const io = getIo();
    io.to(ROOMS.kitchen).emit("order:released", {
      orderId,
      role: Role.KITCHEN,
      status: OrderStatus.PLACED,
    });
    io.to(ROOMS.server).emit("order:released", {
      orderId,
      role: Role.KITCHEN,
      status: OrderStatus.PLACED,
    });

    return updatedOrder;
  }

  async forceUnclaimWaiter(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new AppError("Order not found", 404);
    if (!order.assignedWaiterId) throw new AppError("Delivery is not claimed.", 400);

    const staffId = order.assignedWaiterId;
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        assignedWaiterId: null,
        assignedWaiterName: null,
        assignedAt: null,
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
      status: order.status,
    });

    return updatedOrder;
  }

  async forceDeliver(orderId: string, adminId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new AppError("Order not found", 404);
    if (order.status !== OrderStatus.READY && order.status !== OrderStatus.PREPARING && order.status !== OrderStatus.ACCEPTED) {
      throw new AppError("Order is not in deliverable status.", 400);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.DELIVERED,
        deliveredAt: new Date(),
        deliveredBy: "Admin",
      },
    });

    await prisma.orderAssignmentHistory.create({
      data: {
        orderId,
        staffId: adminId,
        role: Role.ADMIN,
        action: "DELIVERED",
      },
    });

    const payload = {
      orderId,
      status: OrderStatus.DELIVERED,
      deliveredAt: updatedOrder.deliveredAt,
    };
    const io = getIo();
    io.to(ROOMS.server).emit("order:status_updated", payload);
    io.to(ROOMS.kitchen).emit("order:status_updated", payload);

    return updatedOrder;
  }

  async getAssignmentHistory(orderId: string) {
    return prisma.orderAssignmentHistory.findMany({
      where: { orderId },
      orderBy: { timestamp: "desc" },
      include: {
        staff: {
          select: { name: true, role: true },
        },
      },
    });
  }
}

export const adminService = new AdminService();
