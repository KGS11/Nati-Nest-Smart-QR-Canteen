import { OrderItemStatus, OrderStatus } from "@prisma/client";
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

  async acceptOrder(orderId: string) {
    try {
      const order = await kitchenOrderById(orderId);

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      if (order.status !== OrderStatus.PLACED) {
        throw new AppError("Only orders in PLACED status can be accepted.", 400);
      }

      // P2: Block operations on orders belonging to a closed session
      if (order.session.status !== "ACTIVE") {
        throw new AppError("Cannot update order — the table session is already closed.", 409);
      }

      const acceptedAt = new Date();
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.ACCEPTED, acceptedAt },
        include: {
          session: { include: { table: { select: { tableNumber: true } } } },
          items: { include: { menuItem: true } },
        },
      });

      const io = getIo();
      io.to(ROOMS.kitchen).emit("order:status_updated", {
        orderId: updatedOrder.id,
        status: OrderStatus.ACCEPTED,
        tableNumber: updatedOrder.session.table.tableNumber,
        acceptedAt: updatedOrder.acceptedAt,
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

  async startPreparing(orderId: string) {
    try {
      const order = await kitchenOrderById(orderId);

      if (!order) {
        throw new AppError("Order not found", 404);
      }

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

  async markReady(orderId: string) {
    try {
      const order = await kitchenOrderById(orderId);

      if (!order) {
        throw new AppError("Order not found", 404);
      }

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
        tableNumber: updatedOrder.session.table.tableNumber,
        readyAt: updatedOrder.readyAt,
        items: activeItems.map((item) => ({
          id: item.id,
          name: item.menuItem.name,
          quantity: item.quantity,
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
}

export const kitchenService = new KitchenService();
