import { OrderItemStatus, OrderStatus, Prisma, SessionStatus, TableStatus } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";
import { createSessionJWT } from "../utils/session.utils";
import { ROOMS } from "../sockets/rooms";
import { EVENTS } from "../sockets/events";

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
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 15000,
        },
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
        },
        select: {
          menuItemId: true,
        },
      });
      const activeMenuItemIds = new Set(activeDailyEntries.map(entry => entry.menuItemId));

      const categories = await prisma.menuCategory.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            where: {
              isAvailable: true,
              id: { in: Array.from(activeMenuItemIds) },
            },
            orderBy: { name: "asc" },
          },
        },
      });

      const mappedCategories = categories
        .map((category) => ({
          ...category,
          items: category.items.map((item) => ({
            ...item,
            price: item.price.toNumber(),
          })),
        }))
        .filter((category) => category.items.length > 0);

      return {
        categories: mappedCategories,
      };
    } catch (error) {
      throw error;
    }
  }

  async requestWaiterAssignment(sessionId: string) {
    try {
      const session = await prisma.tableSession.findUnique({
        where: { id: sessionId },
        include: {
          table: {
            select: { tableNumber: true },
          },
        },
      });

      if (!session) {
        throw new AppError("Session not found", 404);
      }

      if (session.assignedWaiterId) {
        return { alreadyAssigned: true, waiterId: session.assignedWaiterId };
      }

      const existingRequest = await prisma.waiterAssignmentRequest.findFirst({
        where: { sessionId, status: "PENDING" },
      });

      if (existingRequest) {
        return existingRequest;
      }

      const request = await prisma.waiterAssignmentRequest.create({
        data: {
          sessionId,
          status: "PENDING",
        },
      });

      const { io } = require("../index") as typeof import("../index");

      io.to(ROOMS.server).emit(EVENTS.WAITER_ASSIGNMENT_REQUEST, {
        requestId: request.id,
        sessionId,
        tableNumber: session.table.tableNumber,
        requestedAt: request.requestedAt,
      });

      return request;
    } catch (error) {
      throw error;
    }
  }

  async acceptWaiterAssignment(requestId: string, waiterId: string) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const request = await tx.waiterAssignmentRequest.findUnique({
          where: { id: requestId },
        });

        if (!request || request.status !== "PENDING") {
          return { success: false, alreadyTaken: true };
        }

        const updatedRequest = await tx.waiterAssignmentRequest.update({
          where: { id: requestId },
          data: {
            status: "ACCEPTED",
            acceptedById: waiterId,
            acceptedAt: new Date(),
          },
        });

        await tx.tableSession.update({
          where: { id: request.sessionId },
          data: {
            assignedWaiterId: waiterId,
            assignedAt: new Date(),
          },
        });

        await tx.waiterAssignmentRequest.updateMany({
          where: {
            sessionId: request.sessionId,
            status: "PENDING",
            id: { not: requestId },
          },
          data: {
            status: "EXPIRED",
          },
        });

        return { success: true, alreadyTaken: false, sessionId: request.sessionId };
      }, { timeout: 15000 });

      if (result.success) {
        const waiter = await prisma.user.findUnique({
          where: { id: waiterId },
          select: { name: true },
        });

        const session = await prisma.tableSession.findUnique({
          where: { id: result.sessionId! },
          include: { table: true },
        });

        if (session) {
          const { io } = require("../index") as typeof import("../index");

          io.to(ROOMS.server).emit(EVENTS.WAITER_ASSIGNMENT_ACCEPTED, {
            sessionId: session.id,
            tableNumber: session.table.tableNumber,
            acceptedBy: waiter?.name || "Waiter",
            waiterId,
          });

          io.to(ROOMS.waiter(waiterId)).emit(EVENTS.WAITER_ASSIGNMENT_ACCEPTED, {
            sessionId: session.id,
            tableNumber: session.table.tableNumber,
            isYours: true,
          });
        }
      }

      return { success: result.success, alreadyTaken: result.alreadyTaken };
    } catch (error) {
      throw error;
    }
  }

  async getAssignedWaiter(sessionId: string): Promise<string | null> {
    try {
      const session = await prisma.tableSession.findUnique({
        where: { id: sessionId },
        select: { assignedWaiterId: true },
      });
      return session?.assignedWaiterId || null;
    } catch (error) {
      throw error;
    }
  }

  async clearWaiterAssignment(sessionId: string): Promise<void> {
    try {
      await prisma.tableSession.update({
        where: { id: sessionId },
        data: {
          assignedWaiterId: null,
          assignedAt: null,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async getMyTables(waiterId: string) {
    try {
      const sessions = await prisma.tableSession.findMany({
        where: {
          assignedWaiterId: waiterId,
          status: SessionStatus.ACTIVE,
        },
        include: {
          table: true,
          orders: {
            where: {
              status: { not: OrderStatus.CANCELLED },
            },
          },
          assistanceRequests: {
            where: {
              status: "PENDING",
            },
          },
        },
      });

      return sessions.map((session) => ({
        sessionId: session.id,
        tableNumber: session.table.tableNumber,
        orderCount: session.orders.length,
        pendingRequestsCount: session.assistanceRequests.length,
      }));
    } catch (error) {
      throw error;
    }
  }

  async getAssignmentRequests() {
    try {
      const requests = await prisma.waiterAssignmentRequest.findMany({
        where: {
          status: "PENDING",
          session: {
            status: SessionStatus.ACTIVE,
          },
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
        orderBy: {
          requestedAt: "asc",
        },
      });

      return requests.map((req) => ({
        requestId: req.id,
        sessionId: req.sessionId,
        tableNumber: req.session.table.tableNumber,
        requestedAt: req.requestedAt,
      }));
    } catch (error) {
      throw error;
    }
  }
}

export const sessionService = new SessionService();
