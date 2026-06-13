import { OrderItemStatus, Prisma, SessionStatus, TableStatus } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";
import { createSessionJWT } from "../utils/session.utils";

export class SessionService {
  async getOrCreateSession(tableId: string) {
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          let table = await tx.restaurantTable.findUnique({
            where: { id: tableId },
          });

          if (!table) {
            table = await tx.restaurantTable.findUnique({
              where: { tableNumber: tableId },
            });
          }

          if (!table) {
            throw new AppError("Table not found", 404);
          }

          const actualTableId = table.id;

          const existingSession = await tx.tableSession.findFirst({
            where: { tableId: actualTableId, status: SessionStatus.ACTIVE },
          });

          if (existingSession) {
            return { session: existingSession, isNew: false, table };
          }

          const session = await tx.tableSession.create({
            data: { tableId: actualTableId, status: SessionStatus.ACTIVE },
          });

          await tx.restaurantTable.update({
            where: { id: actualTableId },
            data: { status: TableStatus.OCCUPIED },
          });

          return { session, isNew: true, table };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      const sessionToken = createSessionJWT({
        sessionId: result.session.id,
        tableId: result.table.id,
        tableNumber: result.table.tableNumber,
      });

      return {
        session: result.session,
        isNew: result.isNew,
        sessionToken,
        tableNumber: result.table.tableNumber,
      };
    } catch (error) {
      throw error;
    }
  }

  async getSessionDetails(sessionId: string) {
    try {
      const session = await prisma.tableSession.findUnique({
        where: { id: sessionId },
        include: {
          table: true,
          orders: {
            include: {
              items: {
                include: { menuItem: true },
              },
            },
          },
        },
      });

      if (!session) {
        throw new AppError("Session not found", 404);
      }

      let totalAmount = 0;
      let itemCount = 0;

      const orders = session.orders.map((order) => ({
        ...order,
        items: order.items.map((item) => {
          if (item.status !== OrderItemStatus.REJECTED) {
            totalAmount += item.unitPrice.toNumber() * item.quantity;
            itemCount += item.quantity;
          }

          return {
            ...item,
            unitPrice: item.unitPrice.toNumber(),
            menuItem: {
              ...item.menuItem,
              price: item.menuItem.price.toNumber(),
            },
          };
        }),
      }));

      return {
        ...session,
        orders,
        totalAmount: Math.round(totalAmount * 100) / 100,
        itemCount,
      };
    } catch (error) {
      throw error;
    }
  }

  async getSessionMenu(sessionId: string) {
    try {
      const session = await prisma.tableSession.findUnique({
        where: { id: sessionId },
        select: { id: true, status: true },
      });

      if (!session) {
        throw new AppError("Session not found", 404);
      }

      if (session.status !== SessionStatus.ACTIVE) {
        throw new AppError("Session has ended. Please scan QR again.", 401);
      }

      const categories = await prisma.menuCategory.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            where: { isAvailable: true },
            orderBy: { name: "asc" },
          },
        },
      });

      return {
        categories: categories.map((category) => ({
          ...category,
          items: category.items.map((item) => ({
            ...item,
            price: item.price.toNumber(),
          })),
        })),
      };
    } catch (error) {
      throw error;
    }
  }
}

export const sessionService = new SessionService();
