import { OrderItemStatus, OrderStatus, Prisma, SessionStatus } from "@prisma/client";
import { Server } from "socket.io";
import { prisma } from "../config/db";
import { ROOMS } from "../sockets/rooms";
import { AppError } from "../utils/AppError";
import { CreateOrderInput } from "../validators/order.validators";

type OrderWithRelations = Awaited<ReturnType<typeof findOrderById>>;

const getIo = (): Server => {
  const { io } = require("../index") as typeof import("../index");
  return io;
};

const findOrderById = (orderId: string) =>
  prisma.order.findUnique({
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
        orderBy: { createdAt: "asc" },
      },
    },
  });

const money = (value: Prisma.Decimal | number) => Math.round(Number(value) * 100) / 100;

const serializeOrder = <T extends NonNullable<OrderWithRelations>>(order: T) => {
  const activeItems = order.items.filter((item) => item.status === OrderItemStatus.ACTIVE);
  const totalAmount = activeItems.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0,
  );

  return {
    ...order,
    items: order.items.map((item) => ({
      ...item,
      unitPrice: money(item.unitPrice),
      menuItem: {
        ...item.menuItem,
        price: money(item.menuItem.price),
      },
    })),
    itemCount: activeItems.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: money(totalAmount),
  };
};

const assertActiveSession = async (sessionId: string) => {
  const session = await prisma.tableSession.findUnique({
    where: { id: sessionId },
    include: {
      table: {
        select: { tableNumber: true },
      },
    },
  });

  if (!session) {
    throw new AppError("Session not found.", 404);
  }

  if (session.status !== SessionStatus.ACTIVE) {
    throw new AppError("Session has ended. Please scan QR again.", 401);
  }

  return session;
};

export class OrderService {
  async createOrder(sessionId: string, data: CreateOrderInput) {
    try {
      const session = await assertActiveSession(sessionId);
      const menuItemIds = data.items.map((item) => item.menuItemId);
      const uniqueMenuItemIds = Array.from(new Set(menuItemIds));

      if (uniqueMenuItemIds.length !== menuItemIds.length) {
        throw new AppError("Duplicate menu items are not allowed in one order.", 400);
      }

      const menuItems = await prisma.menuItem.findMany({
        where: { id: { in: uniqueMenuItemIds } },
      });
      const menuItemMap = new Map(menuItems.map((item) => [item.id, item]));
      const missingIds = uniqueMenuItemIds.filter((menuItemId) => !menuItemMap.has(menuItemId));

      if (missingIds.length) {
        throw new AppError("One or more menu items were not found.", 404);
      }

      const unavailableItem = menuItems.find((item) => !item.isAvailable);
      if (unavailableItem) {
        throw new AppError(`${unavailableItem.name} is currently unavailable.`, 409);
      }

      const getTodayDate = () => {
        const today = new Date();
        const todayStr = new Intl.DateTimeFormat("en-CA", {
          timeZone: process.env.APP_TIMEZONE ?? "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }).format(today);
        return new Date(`${todayStr}T00:00:00.000Z`);
      };

      const today = getTodayDate();
      const activeDailyEntries = await prisma.dailyMenu.findMany({
        where: {
          menuDate: today,
          removedAt: null,
          menuItemId: { in: uniqueMenuItemIds },
        },
        select: {
          menuItemId: true,
        },
      });
      const activeMenuItemIds = new Set(activeDailyEntries.map(entry => entry.menuItemId));

      for (const item of menuItems) {
        if (!activeMenuItemIds.has(item.id)) {
          throw new AppError(`${item.name} is no longer available today.`, 400);
        }
      }

      const createdOrder = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            sessionId,
            status: OrderStatus.PLACED,
          },
        });

        await tx.orderItem.createMany({
          data: data.items.map((item) => {
            const menuItem = menuItemMap.get(item.menuItemId)!;
            return {
              orderId: order.id,
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              unitPrice: menuItem.price,
              specialInstructions: item.specialInstructions ?? null,
              status: OrderItemStatus.ACTIVE,
            };
          }),
        });

        return tx.order.findUniqueOrThrow({
          where: { id: order.id },
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
              orderBy: { createdAt: "asc" },
            },
          },
        });
      });

      const serializedOrder = serializeOrder(createdOrder);
      getIo().to(ROOMS.kitchen).emit("order:new", {
        orderId: serializedOrder.id,
        tableNumber: session.table.tableNumber,
        sessionId,
        itemCount: serializedOrder.itemCount,
        placedAt: serializedOrder.placedAt,
      });

      return serializedOrder;
    } catch (error) {
      throw error;
    }
  }

  async getSessionOrders(sessionId: string) {
    try {
      await assertActiveSession(sessionId);
      const orders = await prisma.order.findMany({
        where: { sessionId },
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
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { placedAt: "desc" },
      });

      return orders.map(serializeOrder);
    } catch (error) {
      throw error;
    }
  }

  async getOrderDetails(sessionId: string, orderId: string) {
    try {
      await assertActiveSession(sessionId);
      const order = await findOrderById(orderId);

      if (!order || order.sessionId !== sessionId) {
        throw new AppError("Order not found.", 404);
      }

      return serializeOrder(order);
    } catch (error) {
      throw error;
    }
  }

  async cancelOrder(sessionId: string, orderId: string) {
    try {
      await assertActiveSession(sessionId);
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, sessionId: true, status: true },
      });

      if (!order || order.sessionId !== sessionId) {
        throw new AppError("Order not found.", 404);
      }

      if (order.status !== OrderStatus.PLACED) {
        throw new AppError("Only placed orders can be cancelled.", 400);
      }

      const cancelledOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
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
            orderBy: { createdAt: "asc" },
          },
        },
      });

      getIo().to(ROOMS.kitchen).emit("order:status_updated", {
        orderId: cancelledOrder.id,
        status: OrderStatus.CANCELLED,
        tableNumber: cancelledOrder.session.table.tableNumber,
      });

      return serializeOrder(cancelledOrder);
    } catch (error) {
      throw error;
    }
  }
}

export const orderService = new OrderService();
