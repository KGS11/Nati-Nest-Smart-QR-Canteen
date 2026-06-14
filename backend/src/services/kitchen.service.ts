import { OrderItemStatus, OrderStatus, Role } from "@prisma/client";
import { Server } from "socket.io";
import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";
import { ROOMS } from "../sockets/rooms";

type KitchenOrder = Awaited<ReturnType<typeof kitchenOrderById>>;

const getIo = (): Server => {
  const { io } = require("../index") as typeof import("../index");
  return io;
};

const kitchenOrderById = async (orderId: string) => {
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

const serializeOrder = <T extends NonNullable<KitchenOrder>>(order: T) => ({
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

const serializeActiveOrder = <T extends NonNullable<KitchenOrder>>(order: T) => {
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

const statusPriority: Record<string, number> = {
  [OrderStatus.PLACED]: 1,
  [OrderStatus.ACCEPTED]: 2,
  [OrderStatus.PREPARING]: 3,
};

const activeKitchenStatuses = [OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING];

export class KitchenService {
  private checkKitchenOwnership(order: { assignedKitchenId: string | null }, userId: string, role: string) {
    if (order.assignedKitchenId && order.assignedKitchenId !== userId && role !== "ADMIN") {
      throw new AppError("This order is assigned to another kitchen staff member.", 403);
    }
  }

  async getActiveOrders() {
    try {
      const orders = await prisma.order.findMany({
        where: { status: { in: activeKitchenStatuses } },
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

      return orders
        .sort((a, b) => {
          const statusSort = statusPriority[a.status] - statusPriority[b.status];
          return statusSort || a.placedAt.getTime() - b.placedAt.getTime();
        })
        .map((order) => serializeActiveOrder(order));
    } catch (error) {
      throw error;
    }
  }

  async acceptOrder(orderId: string, staffId: string, staffName: string) {
    try {
      const acceptedAt = new Date();

      const updateResult = await prisma.order.updateMany({
        where: {
          id: orderId,
          status: OrderStatus.PLACED,
          session: { status: "ACTIVE" },
        },
        data: {
          status: OrderStatus.ACCEPTED,
          acceptedAt,
          assignedKitchenId: staffId,
          assignedKitchenName: staffName,
        },
      });

      if (updateResult.count === 0) {
        const existingOrder = await prisma.order.findUnique({
          where: { id: orderId },
          include: { session: true },
        });

        if (!existingOrder) {
          throw new AppError("Order not found", 404);
        }

        if (existingOrder.session.status !== "ACTIVE") {
          throw new AppError("Cannot update order — the table session is already closed.", 409);
        }

        if (existingOrder.status !== OrderStatus.PLACED) {
          throw new AppError(`Order already claimed by ${existingOrder.assignedKitchenName || "another kitchen staff"}.`, 409);
        }

        throw new AppError("Failed to claim order.", 400);
      }

      const updatedOrder = await kitchenOrderById(orderId);
      if (!updatedOrder) {
        throw new AppError("Order not found", 404);
      }

      await prisma.orderAssignmentHistory.create({
        data: {
          orderId,
          staffId,
          role: Role.KITCHEN,
          action: "CLAIMED",
        },
      });

      const io = getIo();
      io.to(ROOMS.kitchen).emit("order:status_updated", {
        orderId: updatedOrder.id,
        status: OrderStatus.ACCEPTED,
        tableNumber: updatedOrder.session.table.tableNumber,
        acceptedAt: updatedOrder.acceptedAt,
        assignedKitchenId: staffId,
        assignedKitchenName: staffName,
      });
      io.to(ROOMS.kitchen).emit("order:claimed:kitchen", {
        orderId: updatedOrder.id,
        assignedKitchenId: staffId,
        assignedKitchenName: staffName,
        status: OrderStatus.ACCEPTED,
      });
      io.to(ROOMS.session(updatedOrder.session.id)).emit("order:accepted", {
        orderId: updatedOrder.id,
        message: "Your order has been accepted and will be prepared shortly.",
        acceptedAt: updatedOrder.acceptedAt,
      });

      return serializeOrder(updatedOrder);
    } catch (error) {
      throw error;
    }
  }

  async startPreparing(orderId: string, userId: string, role: string) {
    try {
      const order = await kitchenOrderById(orderId);

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      this.checkKitchenOwnership(order, userId, role);

      if (order.status !== OrderStatus.ACCEPTED) {
        throw new AppError("Only ACCEPTED orders can be marked as preparing.", 400);
      }

      // P2: Block operations on orders belonging to a closed session
      if (order.session.status !== "ACTIVE") {
        throw new AppError("Cannot update order — the table session is already closed.", 409);
      }

      const preparingAt = new Date();
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PREPARING, preparingAt },
        include: {
          session: { include: { table: { select: { tableNumber: true } } } },
          items: { include: { menuItem: true } },
        },
      });

      const io = getIo();
      io.to(ROOMS.kitchen).emit("order:status_updated", {
        orderId: updatedOrder.id,
        status: OrderStatus.PREPARING,
        tableNumber: updatedOrder.session.table.tableNumber,
        preparingAt: updatedOrder.preparingAt,
        assignedKitchenId: updatedOrder.assignedKitchenId,
        assignedKitchenName: updatedOrder.assignedKitchenName,
      });
      io.to(ROOMS.session(updatedOrder.session.id)).emit("order:preparing", {
        orderId: updatedOrder.id,
        message: "Your order is being prepared.",
        preparingAt: updatedOrder.preparingAt,
      });

      return serializeOrder(updatedOrder);
    } catch (error) {
      throw error;
    }
  }

  async markReady(orderId: string, userId: string, role: string) {
    try {
      const order = await kitchenOrderById(orderId);

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      this.checkKitchenOwnership(order, userId, role);

      if (order.status !== OrderStatus.PREPARING) {
        throw new AppError("Only PREPARING orders can be marked as ready.", 400);
      }

      // P2: Block operations on orders belonging to a closed session
      if (order.session.status !== "ACTIVE") {
        throw new AppError("Cannot update order — the table session is already closed.", 409);
      }

      const readyAt = new Date();
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.READY, readyAt },
        include: {
          session: { include: { table: { select: { tableNumber: true } } } },
          items: { include: { menuItem: true } },
        },
      });
      const serializedOrder = serializeOrder(updatedOrder);
      const activeItems = serializedOrder.items.filter((item) => item.status === OrderItemStatus.ACTIVE);

      const io = getIo();
      io.to(ROOMS.kitchen).emit("order:status_updated", {
        orderId: updatedOrder.id,
        status: OrderStatus.READY,
        tableNumber: updatedOrder.session.table.tableNumber,
        readyAt: updatedOrder.readyAt,
      });
      io.to(ROOMS.server).emit("order:ready", {
        orderId: updatedOrder.id,
        sessionId: updatedOrder.session.id,
        tableNumber: updatedOrder.session.table.tableNumber,
        readyAt: updatedOrder.readyAt,
        assignedKitchenId: updatedOrder.assignedKitchenId,
        assignedKitchenName: updatedOrder.assignedKitchenName,
        items: activeItems.map((item) => ({
          id: item.id,
          name: item.menuItem.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toNumber(),
          specialInstructions: item.specialInstructions,
          status: item.status,
        })),
      });
      io.to(ROOMS.session(updatedOrder.session.id)).emit("order:ready", {
        orderId: updatedOrder.id,
        message: "Your order is ready and will be delivered to your table shortly.",
        readyAt: updatedOrder.readyAt,
      });

      return serializedOrder;
    } catch (error) {
      throw error;
    }
  }

  async getOrderDetails(orderId: string) {
    try {
      const order = await kitchenOrderById(orderId);

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      // P4: Restrict kitchen view to operationally relevant statuses only
      const kitchenVisibleStatuses: OrderStatus[] = [
        OrderStatus.PLACED,
        OrderStatus.ACCEPTED,
        OrderStatus.PREPARING,
        OrderStatus.READY,
      ];

      if (!kitchenVisibleStatuses.includes(order.status)) {
        throw new AppError("Order not found", 404);
      }

      return serializeOrder(order);
    } catch (error) {
      throw error;
    }
  }

  async rejectOrderItem(orderId: string, itemId: string, reason: string, userId: string, role: string) {
    try {
      const order = await kitchenOrderById(orderId);
      if (!order) {
        throw new AppError("Order not found", 404);
      }

      this.checkKitchenOwnership(order, userId, role);

      if (order.session.status !== "ACTIVE") {
        throw new AppError("Cannot update order — the table session is already closed.", 409);
      }

      const item = order.items.find((i) => i.id === itemId);
      if (!item) {
        throw new AppError("Order item not found", 404);
      }

      if (item.status === OrderItemStatus.REJECTED) {
        throw new AppError("Item is already rejected", 400);
      }

      await prisma.orderItem.update({
        where: { id: itemId },
        data: {
          status: OrderItemStatus.REJECTED,
          rejectionReason: reason,
        },
      });

      const reloadedOrder = await kitchenOrderById(orderId);
      if (!reloadedOrder) {
        throw new AppError("Reloading order failed", 500);
      }

      const allRejected = reloadedOrder.items.every((i) => i.status === OrderItemStatus.REJECTED);
      let finalOrder = reloadedOrder;

      if (allRejected) {
        finalOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.CANCELLED,
            rejectionReason: `All items rejected: ${reason}`,
          },
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
      }

      const io = getIo();
      io.to(ROOMS.kitchen).emit("order:status_updated", {
        orderId: finalOrder.id,
        status: finalOrder.status,
        tableNumber: finalOrder.session.table.tableNumber,
      });

      io.to(ROOMS.session(finalOrder.session.id)).emit("order:item_rejected", {
        orderId: finalOrder.id,
        itemId,
        name: item.menuItem.name,
        reason,
        orderStatus: finalOrder.status,
      });

      if (finalOrder.status === OrderStatus.CANCELLED) {
        io.to(ROOMS.session(finalOrder.session.id)).emit("order:cancelled", {
          orderId: finalOrder.id,
          reason: `All items rejected: ${reason}`,
        });
      }

      return serializeOrder(finalOrder);
    } catch (error) {
      throw error;
    }
  }

  async rejectOrder(orderId: string, reason: string, userId: string, role: string) {
    try {
      const order = await kitchenOrderById(orderId);
      if (!order) {
        throw new AppError("Order not found", 404);
      }

      this.checkKitchenOwnership(order, userId, role);

      if (order.session.status !== "ACTIVE") {
        throw new AppError("Cannot update order — the table session is already closed.", 409);
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw new AppError("Order is already cancelled", 400);
      }

      await prisma.$transaction([
        prisma.orderItem.updateMany({
          where: { orderId, status: OrderItemStatus.ACTIVE },
          data: {
            status: OrderItemStatus.REJECTED,
            rejectionReason: reason,
          },
        }),
        prisma.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.CANCELLED,
            rejectionReason: reason,
          },
        }),
      ]);

      const finalOrder = await kitchenOrderById(orderId);
      if (!finalOrder) {
        throw new AppError("Reloading order failed", 500);
      }

      const io = getIo();
      io.to(ROOMS.kitchen).emit("order:status_updated", {
        orderId: finalOrder.id,
        status: finalOrder.status,
        tableNumber: finalOrder.session.table.tableNumber,
      });

      io.to(ROOMS.session(finalOrder.session.id)).emit("order:cancelled", {
        orderId: finalOrder.id,
        reason,
      });

      return serializeOrder(finalOrder);
    } catch (error) {
      throw error;
    }
  }

  async releaseOrder(orderId: string, userId: string, role: string) {
    try {
      const order = await kitchenOrderById(orderId);
      if (!order) {
        throw new AppError("Order not found", 404);
      }

      this.checkKitchenOwnership(order, userId, role);

      if (order.status !== OrderStatus.ACCEPTED && order.status !== OrderStatus.PREPARING) {
        throw new AppError("Only claimed kitchen orders can be released.", 400);
      }

      const staffId = order.assignedKitchenId!;
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PLACED,
          assignedKitchenId: null,
          assignedKitchenName: null,
          acceptedAt: null,
          preparingAt: null,
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

      return serializeOrder(updatedOrder);
    } catch (error) {
      throw error;
    }
  }
}

export const kitchenService = new KitchenService();
