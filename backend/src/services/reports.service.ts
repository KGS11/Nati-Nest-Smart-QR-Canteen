import {
  AssistanceStatus,
  OrderItemStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  SessionStatus,
  TableStatus,
  Role,
} from "@prisma/client";
import { prisma } from "../config/db";
import { DateGroupBy, getGroupKey, getMondayOfCurrentWeek } from "../utils/date.utils";
import { getEndOfDay, getStartOfDay } from "../validators/reports.validators";

type GroupBy = "day" | "week" | "month";

const round2 = (value: number) => Math.round(value * 100) / 100;
const round1 = (value: number) => Math.round(value * 10) / 10;
const money = (value: Prisma.Decimal | number | null | undefined) => round2(Number(value ?? 0));
const minutesBetween = (start: Date, end: Date) => (end.getTime() - start.getTime()) / 60000;

const groupDateTotals = <T extends { date: Date }>(
  rows: T[],
  groupBy: DateGroupBy,
  seed: (key: string) => Record<string, unknown>,
  apply: (target: Record<string, unknown>, row: T) => void,
) => {
  const groups = new Map<string, Record<string, unknown>>();

  rows.forEach((row) => {
    const key = getGroupKey(row.date, groupBy);
    const target = groups.get(key) ?? seed(key);
    apply(target, row);
    groups.set(key, target);
  });

  return Array.from(groups.values()).sort((a, b) =>
    String(a.date).localeCompare(String(b.date)),
  );
};

export class ReportsService {
  async getRevenueSummary(params: { startDate: string; endDate: string; groupBy: GroupBy }) {
    try {
      const from = getStartOfDay(params.startDate);
      const to = getEndOfDay(params.endDate);
      const where = {
        status: PaymentStatus.COMPLETED,
        verifiedAt: { gte: from, lte: to },
      };

      const [totalRevenue, methodRevenue, payments] = await Promise.all([
        prisma.payment.aggregate({
          where,
          _sum: { totalAmount: true, tipAmount: true },
          _count: { id: true },
          _avg: { totalAmount: true },
        }),
        prisma.payment.groupBy({
          by: ["paymentMethod"],
          where,
          _sum: { totalAmount: true },
          _count: { id: true },
        }),
        prisma.payment.findMany({
          where,
          select: { totalAmount: true, tipAmount: true, paymentMethod: true, verifiedAt: true },
          orderBy: { verifiedAt: "asc" },
        }),
      ]);

      const cash = methodRevenue.find((row) => row.paymentMethod === PaymentMethod.CASH);
      const upi = methodRevenue.find((row) => row.paymentMethod === PaymentMethod.UPI);
      const breakdown = groupDateTotals(
        payments
          .filter((payment): payment is typeof payment & { verifiedAt: Date } => Boolean(payment.verifiedAt))
          .map((payment) => ({ ...payment, date: payment.verifiedAt })),
        params.groupBy,
        (key) => ({
          date: key,
          totalRevenue: 0,
          transactionCount: 0,
          cashRevenue: 0,
          upiRevenue: 0,
          totalTips: 0,
        }),
        (target, payment) => {
          const amount = Number(payment.totalAmount);
          const tip = Number(payment.tipAmount);
          target.totalRevenue = round2(Number(target.totalRevenue) + amount);
          target.totalTips = round2(Number(target.totalTips) + tip);
          target.transactionCount = Number(target.transactionCount) + 1;
          if (payment.paymentMethod === PaymentMethod.CASH) {
            target.cashRevenue = round2(Number(target.cashRevenue) + amount);
          }
          if (payment.paymentMethod === PaymentMethod.UPI) {
            target.upiRevenue = round2(Number(target.upiRevenue) + amount);
          }
        },
      );

      return {
        summary: {
          totalRevenue: money(totalRevenue._sum.totalAmount),
          totalTransactions: totalRevenue._count.id,
          averageOrderValue: money(totalRevenue._avg.totalAmount),
          cashRevenue: money(cash?._sum.totalAmount),
          upiRevenue: money(upi?._sum.totalAmount),
          cashTransactions: cash?._count.id ?? 0,
          upiTransactions: upi?._count.id ?? 0,
          totalTips: money(totalRevenue._sum.tipAmount),
        },
        breakdown,
        dateRange: { ...params },
      };
    } catch (error) {
      throw error;
    }
  }

  async getOrderAnalytics(params: { startDate: string; endDate: string; groupBy: GroupBy }) {
    try {
      const from = getStartOfDay(params.startDate);
      const to = getEndOfDay(params.endDate);
      const placedAt = { gte: from, lte: to };

      const [ordersByStatusRows, timedOrders, hourlyOrders, dailyOrders, totalOrders] =
        await Promise.all([
          prisma.order.groupBy({
            by: ["status"],
            where: { placedAt },
            _count: { id: true },
          }),
          prisma.order.findMany({
            where: {
              placedAt,
              acceptedAt: { not: null },
              readyAt: { not: null },
              status: { in: [OrderStatus.READY, OrderStatus.DELIVERED, OrderStatus.PAID] },
            },
            select: { acceptedAt: true, readyAt: true, placedAt: true },
          }),
          prisma.order.findMany({
            where: { placedAt },
            select: { placedAt: true },
          }),
          prisma.order.findMany({
            where: { placedAt },
            select: { status: true, placedAt: true },
            orderBy: { placedAt: "asc" },
          }),
          prisma.order.count({ where: { placedAt } }),
        ]);

      const ordersByStatus = Object.values(OrderStatus).reduce(
        (acc, status) => ({ ...acc, [status]: 0 }),
        {} as Record<OrderStatus, number>,
      );
      ordersByStatusRows.forEach((row) => {
        ordersByStatus[row.status] = row._count.id;
      });

      const completedOrders =
        ordersByStatus[OrderStatus.DELIVERED] + ordersByStatus[OrderStatus.PAID];
      const cancelledOrders = ordersByStatus[OrderStatus.CANCELLED];
      const avgAcceptance = timedOrders.length
        ? timedOrders.reduce(
            (sum, order) => sum + minutesBetween(order.placedAt, order.acceptedAt!),
            0,
          ) / timedOrders.length
        : 0;
      const avgPreparation = timedOrders.length
        ? timedOrders.reduce(
            (sum, order) => sum + minutesBetween(order.acceptedAt!, order.readyAt!),
            0,
          ) / timedOrders.length
        : 0;
      const avgTotal = timedOrders.length
        ? timedOrders.reduce((sum, order) => sum + minutesBetween(order.placedAt, order.readyAt!), 0) /
          timedOrders.length
        : 0;

      const hourly = new Map<number, number>();
      hourlyOrders.forEach((order) => {
        const hour = order.placedAt.getHours();
        hourly.set(hour, (hourly.get(hour) ?? 0) + 1);
      });
      const peakHours = Array.from(hourly.entries())
        .map(([hour, orderCount]) => ({
          hour,
          label: `${String(hour).padStart(2, "0")}:00`,
          orderCount,
        }))
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, 3);

      const breakdown = groupDateTotals(
        dailyOrders.map((order) => ({ ...order, date: order.placedAt })),
        params.groupBy,
        (key) => ({
          date: key,
          totalOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          completionRate: 0,
        }),
        (target, order) => {
          target.totalOrders = Number(target.totalOrders) + 1;
          if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.PAID) {
            target.completedOrders = Number(target.completedOrders) + 1;
          }
          if (order.status === OrderStatus.CANCELLED) {
            target.cancelledOrders = Number(target.cancelledOrders) + 1;
          }
          target.completionRate = round2(
            (Number(target.completedOrders) / Number(target.totalOrders)) * 100,
          );
        },
      );

      return {
        summary: {
          totalOrders,
          completedOrders,
          cancelledOrders,
          cancellationRate: totalOrders ? round2((cancelledOrders / totalOrders) * 100) : 0,
          avgAcceptanceTimeMinutes: round1(avgAcceptance),
          avgPreparationTimeMinutes: round1(avgPreparation),
          avgTotalTimeMinutes: round1(avgTotal),
          ordersByStatus,
        },
        peakHours,
        breakdown,
        dateRange: { ...params },
      };
    } catch (error) {
      throw error;
    }
  }

  async getPopularItems(params: {
    startDate: string;
    endDate: string;
    limit: number;
    categoryId?: string;
  }) {
    try {
      const from = getStartOfDay(params.startDate);
      const to = getEndOfDay(params.endDate);
      const where: Prisma.OrderItemWhereInput = {
        status: OrderItemStatus.ACTIVE,
        order: {
          placedAt: { gte: from, lte: to },
          status: { not: OrderStatus.CANCELLED },
        },
        ...(params.categoryId ? { menuItem: { categoryId: params.categoryId } } : {}),
      };

      const itemStats = await prisma.orderItem.groupBy({
        by: ["menuItemId"],
        where,
        _sum: { quantity: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: params.limit,
      });
      const menuItemIds = itemStats.map((item) => item.menuItemId);

      const [menuItems, revenueItems] = await Promise.all([
        prisma.menuItem.findMany({
          where: { id: { in: menuItemIds } },
          include: { category: { select: { name: true } } },
        }),
        prisma.orderItem.findMany({
          where: { ...where, menuItemId: { in: menuItemIds } },
          select: { menuItemId: true, quantity: true, unitPrice: true },
        }),
      ]);

      const menuItemMap = new Map(menuItems.map((item) => [item.id, item]));
      const revenueMap = new Map<string, number>();
      revenueItems.forEach((item) => {
        revenueMap.set(
          item.menuItemId,
          (revenueMap.get(item.menuItemId) ?? 0) + Number(item.unitPrice) * item.quantity,
        );
      });

      return {
        items: itemStats.map((item, index) => {
          const menuItem = menuItemMap.get(item.menuItemId);
          return {
            rank: index + 1,
            menuItemId: item.menuItemId,
            name: menuItem?.name ?? "Unknown item",
            categoryName: menuItem?.category.name ?? "Unknown category",
            totalQuantitySold: item._sum.quantity ?? 0,
            totalOrders: item._count.id,
            totalRevenue: money(revenueMap.get(item.menuItemId)),
            isAvailable: menuItem?.isAvailable ?? false,
          };
        }),
        totalUniqueItems: itemStats.length,
        dateRange: { startDate: params.startDate, endDate: params.endDate },
        filteredByCategory: params.categoryId ?? null,
      };
    } catch (error) {
      throw error;
    }
  }

  async getTableUtilization(params: { startDate: string; endDate: string }) {
    try {
      const from = getStartOfDay(params.startDate);
      const to = getEndOfDay(params.endDate);

      const [tables, sessions] = await Promise.all([
        prisma.restaurantTable.findMany({ orderBy: { tableNumber: "asc" } }),
        prisma.tableSession.findMany({
          where: { openedAt: { gte: from, lte: to } },
          include: {
            table: { select: { tableNumber: true } },
            payment: { select: { totalAmount: true, status: true } },
            orders: {
              where: { status: { not: OrderStatus.CANCELLED } },
              select: { id: true },
            },
          },
        }),
      ]);

      const tableRows = tables.map((table) => {
        const tableSessions = sessions.filter((session) => session.tableId === table.id);
        const completedSessions = tableSessions.filter(
          (session) => session.payment?.status === PaymentStatus.COMPLETED,
        );
        const totalRevenue = completedSessions.reduce(
          (sum, session) => sum + Number(session.payment?.totalAmount ?? 0),
          0,
        );
        const totalOrders = tableSessions.reduce((sum, session) => sum + session.orders.length, 0);
        const durations = tableSessions
          .filter(
            (session) =>
              session.status === SessionStatus.CLOSED && Boolean(session.openedAt && session.closedAt),
          )
          .map((session) => minutesBetween(session.openedAt, session.closedAt!));

        return {
          tableId: table.id,
          tableNumber: table.tableNumber,
          totalSessions: tableSessions.length,
          completedSessions: completedSessions.length,
          totalRevenue: money(totalRevenue),
          avgSessionRevenue: completedSessions.length
            ? money(totalRevenue / completedSessions.length)
            : 0,
          avgOrdersPerSession: tableSessions.length ? round2(totalOrders / tableSessions.length) : 0,
          avgSessionDurationMinutes: durations.length
            ? round1(durations.reduce((sum, duration) => sum + duration, 0) / durations.length)
            : 0,
        };
      });

      const closedDurations = sessions
        .filter(
          (session) =>
            session.status === SessionStatus.CLOSED && Boolean(session.openedAt && session.closedAt),
        )
        .map((session) => minutesBetween(session.openedAt, session.closedAt!));
      const mostUtilized = [...tableRows].sort((a, b) => b.totalSessions - a.totalSessions)[0];
      const highestRevenue = [...tableRows].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];

      return {
        summary: {
          totalTables: tables.length,
          totalSessions: sessions.length,
          totalCompletedSessions: sessions.filter(
            (session) => session.payment?.status === PaymentStatus.COMPLETED,
          ).length,
          mostUtilizedTable: mostUtilized
            ? { tableNumber: mostUtilized.tableNumber, sessionCount: mostUtilized.totalSessions }
            : null,
          highestRevenueTable: highestRevenue
            ? { tableNumber: highestRevenue.tableNumber, totalRevenue: highestRevenue.totalRevenue }
            : null,
          overallAvgSessionDurationMinutes: closedDurations.length
            ? round1(closedDurations.reduce((sum, duration) => sum + duration, 0) / closedDurations.length)
            : 0,
        },
        tables: tableRows.sort((a, b) => b.totalSessions - a.totalSessions),
        dateRange: { ...params },
      };
    } catch (error) {
      throw error;
    }
  }

  async getFeedbackAnalytics(params: { startDate: string; endDate: string }) {
    try {
      const from = getStartOfDay(params.startDate);
      const to = getEndOfDay(params.endDate);
      const createdAt = { gte: from, lte: to };

      const [overall, distribution, closedSessions, recentComments] = await Promise.all([
        prisma.feedback.aggregate({
          where: { createdAt },
          _avg: { rating: true },
          _count: { id: true },
          _min: { rating: true },
          _max: { rating: true },
        }),
        prisma.feedback.groupBy({
          by: ["rating"],
          where: { createdAt },
          _count: { id: true },
        }),
        prisma.tableSession.count({
          where: { status: SessionStatus.CLOSED, closedAt: { gte: from, lte: to } },
        }),
        prisma.feedback.findMany({
          where: { createdAt, comment: { not: null } },
          include: {
            session: {
              include: {
                table: { select: { tableNumber: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

      const totalFeedback = overall._count.id;
      const ratingDistribution = [1, 2, 3, 4, 5].reduce(
        (acc, rating) => {
          const count = distribution.find((row) => row.rating === rating)?._count.id ?? 0;
          return {
            ...acc,
            [rating]: {
              count,
              percentage: totalFeedback ? round1((count / totalFeedback) * 100) : 0,
            },
          };
        },
        {} as Record<1 | 2 | 3 | 4 | 5, { count: number; percentage: number }>,
      );

      return {
        summary: {
          totalFeedback,
          averageRating: overall._avg.rating ? round2(overall._avg.rating) : 0,
          minRating: overall._min.rating ?? 0,
          maxRating: overall._max.rating ?? 0,
          feedbackSubmissionRate: closedSessions
            ? round2((totalFeedback / closedSessions) * 100)
            : 0,
          totalClosedSessions: closedSessions,
        },
        ratingDistribution,
        recentComments: recentComments.map((feedback) => ({
          rating: feedback.rating,
          comment: feedback.comment,
          tableNumber: feedback.session.table.tableNumber,
          createdAt: feedback.createdAt,
        })),
        dateRange: { ...params },
      };
    } catch (error) {
      throw error;
    }
  }

  async getDashboardSummary() {
    try {
      const today = new Date().toISOString().split("T")[0];
      const todayStart = getStartOfDay(today);
      const todayEnd = getEndOfDay(today);
      const weekStart = getMondayOfCurrentWeek();

      const [
        todayRevenue,
        todayOrders,
        todayNewSessions,
        todayFeedback,
        activeSessions,
        occupiedTables,
        pendingOrders,
        preparingOrders,
        readyOrders,
        pendingPayments,
        pendingAssistance,
        weekRevenue,
        weekOrders,
        weekSessions,
        allTimeRevenue,
        allTimeOrders,
        allTimeSessions,
        allTimeItems,
        allTimeTables,
        allTimeFeedback,
      ] = await Promise.all([
        prisma.payment.aggregate({
          where: { status: PaymentStatus.COMPLETED, verifiedAt: { gte: todayStart, lte: todayEnd } },
          _sum: { totalAmount: true },
        }),
        prisma.order.count({ where: { placedAt: { gte: todayStart, lte: todayEnd } } }),
        prisma.tableSession.count({ where: { openedAt: { gte: todayStart, lte: todayEnd } } }),
        prisma.feedback.aggregate({
          where: { createdAt: { gte: todayStart, lte: todayEnd } },
          _count: { id: true },
          _avg: { rating: true },
        }),
        prisma.tableSession.count({ where: { status: SessionStatus.ACTIVE } }),
        prisma.restaurantTable.count({ where: { status: TableStatus.OCCUPIED } }),
        prisma.order.count({ where: { status: OrderStatus.PLACED } }),
        prisma.order.count({ where: { status: { in: [OrderStatus.ACCEPTED, OrderStatus.PREPARING] } } }),
        prisma.order.count({ where: { status: OrderStatus.READY } }),
        prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
        prisma.assistanceRequest.count({ where: { status: AssistanceStatus.PENDING } }),
        prisma.payment.aggregate({
          where: { status: PaymentStatus.COMPLETED, verifiedAt: { gte: weekStart, lte: todayEnd } },
          _sum: { totalAmount: true },
        }),
        prisma.order.count({ where: { placedAt: { gte: weekStart, lte: todayEnd } } }),
        prisma.tableSession.count({ where: { openedAt: { gte: weekStart, lte: todayEnd } } }),
        prisma.payment.aggregate({
          where: { status: PaymentStatus.COMPLETED },
          _sum: { totalAmount: true },
        }),
        prisma.order.count(),
        prisma.tableSession.count(),
        prisma.menuItem.count(),
        prisma.restaurantTable.count(),
        prisma.feedback.aggregate({
          _count: { id: true },
          _avg: { rating: true },
        }),
      ]);

      return {
        today: {
          revenue: money(todayRevenue._sum.totalAmount),
          orders: todayOrders,
          newSessions: todayNewSessions,
          feedbackCount: todayFeedback._count.id,
          avgRating: todayFeedback._avg.rating ? round2(todayFeedback._avg.rating) : 0,
        },
        liveStatus: {
          activeSessions,
          occupiedTables,
          pendingOrders,
          preparingOrders,
          readyOrders,
          pendingPayments,
          pendingAssistanceRequests: pendingAssistance,
        },
        thisWeek: {
          revenue: money(weekRevenue._sum.totalAmount),
          orders: weekOrders,
          newSessions: weekSessions,
        },
        allTime: {
          totalRevenue: money(allTimeRevenue._sum.totalAmount),
          totalOrders: allTimeOrders,
          totalSessions: allTimeSessions,
          totalMenuItems: allTimeItems,
          totalTables: allTimeTables,
          totalFeedback: allTimeFeedback._count.id,
          overallAvgRating: allTimeFeedback._avg.rating ? round2(allTimeFeedback._avg.rating) : 0,
        },
        generatedAt: new Date(),
      };
    } catch (error) {
      throw error;
    }
  }

  async getTipsReport(params: { startDate: string; endDate: string }) {
    try {
      const from = getStartOfDay(params.startDate);
      const to = getEndOfDay(params.endDate);

      const where = {
        status: PaymentStatus.COMPLETED,
        verifiedAt: { gte: from, lte: to },
      };

      const [totalTipsAgg, waiterTipsRows, dailyTipsRows] = await Promise.all([
        prisma.payment.aggregate({
          where,
          _sum: { tipAmount: true },
          _count: { id: true },
        }),
        prisma.payment.groupBy({
          by: ["verifiedById"],
          where: {
            ...where,
            verifiedById: { not: null },
          },
          _sum: { tipAmount: true },
          _count: { id: true },
        }),
        prisma.payment.findMany({
          where,
          select: { tipAmount: true, verifiedAt: true },
          orderBy: { verifiedAt: "asc" },
        }),
      ]);

      const verifiedByIds = waiterTipsRows
        .map((row) => row.verifiedById)
        .filter((id): id is string => id !== null);

      const waiters = await prisma.user.findMany({
        where: { id: { in: verifiedByIds } },
        select: { id: true, name: true, phone: true },
      });

      const waiterMap = new Map(waiters.map((w) => [w.id, w]));

      const waiterTips = waiterTipsRows.map((row) => {
        const waiter = row.verifiedById ? waiterMap.get(row.verifiedById) : null;
        return {
          waiterId: row.verifiedById,
          waiterName: waiter?.name ?? "Unknown Waiter",
          waiterPhone: waiter?.phone ?? "",
          tipAmount: money(row._sum.tipAmount),
          transactionCount: row._count.id,
        };
      });

      const dailyTips = groupDateTotals(
        dailyTipsRows
          .filter((row): row is typeof row & { verifiedAt: Date } => Boolean(row.verifiedAt))
          .map((row) => ({ ...row, date: row.verifiedAt })),
        "day",
        (key) => ({
          date: key,
          tipAmount: 0,
          transactionCount: 0,
        }),
        (target, row) => {
          const tip = Number(row.tipAmount);
          target.tipAmount = round2(Number(target.tipAmount) + tip);
          target.transactionCount = Number(target.transactionCount) + 1;
        },
      );

      return {
        totalTips: money(totalTipsAgg._sum.tipAmount),
        transactionCount: totalTipsAgg._count.id,
        tipsByWaiter: waiterTips.sort((a, b) => b.tipAmount - a.tipAmount),
        tipsByDate: dailyTips,
      };
    } catch (error) {
      throw error;
    }
  }

  async getWaiterPerformanceReport() {
    try {
      const waiters = await prisma.user.findMany({
        where: { role: Role.SERVER },
        select: { id: true, name: true, phone: true, isActive: true },
      });

      const performance = await Promise.all(
        waiters.map(async (waiter) => {
          const completedOrders = await prisma.order.findMany({
            where: {
              assignedWaiterId: waiter.id,
              status: { in: [OrderStatus.DELIVERED, OrderStatus.PAID] },
            },
            select: { readyAt: true, deliveredAt: true },
          });

          const activeCount = await prisma.order.count({
            where: {
              assignedWaiterId: waiter.id,
              status: OrderStatus.READY,
            },
          });

          const tipsAgg = await prisma.payment.aggregate({
            where: {
              verifiedById: waiter.id,
              status: PaymentStatus.COMPLETED,
            },
            _sum: { tipAmount: true },
          });

          let totalDeliveryMinutes = 0;
          let countedDeliveries = 0;

          completedOrders.forEach((o) => {
            if (o.readyAt && o.deliveredAt) {
              const diff = (o.deliveredAt.getTime() - o.readyAt.getTime()) / 60000;
              totalDeliveryMinutes += diff;
              countedDeliveries += 1;
            }
          });

          const avgDeliveryTime = countedDeliveries > 0 ? round1(totalDeliveryMinutes / countedDeliveries) : 0;

          return {
            waiterId: waiter.id,
            waiterName: waiter.name,
            waiterPhone: waiter.phone,
            isActive: waiter.isActive,
            ordersDelivered: completedOrders.length,
            tipsEarned: money(tipsAgg._sum.tipAmount),
            avgDeliveryTime,
            activeOrders: activeCount,
            completedOrders: completedOrders.length,
          };
        })
      );

      return performance;
    } catch (error) {
      throw error;
    }
  }

  async getKitchenPerformanceReport() {
    try {
      const staffList = await prisma.user.findMany({
        where: { role: Role.KITCHEN },
        select: { id: true, name: true, phone: true, isActive: true },
      });

      const performance = await Promise.all(
        staffList.map(async (staff) => {
          const preparedOrders = await prisma.order.findMany({
            where: {
              assignedKitchenId: staff.id,
              status: { in: [OrderStatus.READY, OrderStatus.DELIVERED, OrderStatus.PAID] },
            },
            select: { acceptedAt: true, readyAt: true },
          });

          const activeCount = await prisma.order.count({
            where: {
              assignedKitchenId: staff.id,
              status: { in: [OrderStatus.ACCEPTED, OrderStatus.PREPARING] },
            },
          });

          let totalPrepMinutes = 0;
          let countedPrep = 0;

          preparedOrders.forEach((o) => {
            if (o.acceptedAt && o.readyAt) {
              const diff = (o.readyAt.getTime() - o.acceptedAt.getTime()) / 60000;
              totalPrepMinutes += diff;
              countedPrep += 1;
            }
          });

          const avgPrepTime = countedPrep > 0 ? round1(totalPrepMinutes / countedPrep) : 0;

          return {
            staffId: staff.id,
            staffName: staff.name,
            staffPhone: staff.phone,
            isActive: staff.isActive,
            ordersAccepted: preparedOrders.length + activeCount,
            ordersPrepared: preparedOrders.length,
            avgPreparationTime: avgPrepTime,
            activeOrders: activeCount,
            completedOrders: preparedOrders.length,
          };
        })
      );

      return performance;
    } catch (error) {
      throw error;
    }
  }
}

export const reportsService = new ReportsService();
