import {
  AssistanceStatus,
  CateringLeadStatus,
  OrderItemStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "../config/db";
import {
  ExcelCellValue,
  ExcelColumn,
  ExcelSheetData,
  generateCSV,
  generateExcelBuffer,
  parseDateRange,
} from "../utils/excel.util";
import { AppError } from "../utils/AppError";

export type ExportFormat = "csv" | "xlsx";
export type ExportType = "orders" | "payments" | "revenue" | "feedback" | "tables" | "catering" | "staff";

export interface ExportParams {
  filter?: string;
  startDate?: string;
  endDate?: string;
  format: ExportFormat;
}

export interface ExportResult {
  content: Buffer | string;
  contentType: string;
  filename: string;
}

const money = (value: Prisma.Decimal | number | null | undefined) =>
  Math.round(Number(value ?? 0) * 100) / 100;

const shortId = (id: string) => id.slice(-8).toUpperCase();

const dateKey = (date: Date) => date.toISOString().slice(0, 10);

const sendSheet = async (
  type: ExportType,
  params: ExportParams,
  sheet: ExcelSheetData,
): Promise<ExportResult> => {
  if (params.format === "csv") {
    return {
      content: generateCSV(sheet.columns, sheet.rows),
      contentType: "text/csv",
      filename: `${type}-export.csv`,
    };
  }

  return {
    content: await generateExcelBuffer([sheet], `Nati Nest ${type} export`),
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    filename: `${type}-export.xlsx`,
  };
};

export class ExportService {
  async exportOrders(params: ExportParams) {
    const { from, to } = parseDateRange(params);
    const orders = await prisma.order.findMany({
      where: { placedAt: { gte: from, lte: to } },
      include: {
        session: { include: { table: true } },
        items: { include: { menuItem: true } },
      },
      orderBy: { placedAt: "desc" },
    });

    const columns: ExcelColumn[] = [
      { header: "Order ID", key: "orderId", width: 12 },
      { header: "Table", key: "tableNumber", width: 10 },
      { header: "Session", key: "sessionId", width: 12 },
      { header: "Item Name", key: "itemName", width: 25 },
      { header: "Qty", key: "quantity", width: 8 },
      { header: "Unit Price Rs", key: "unitPrice", width: 14 },
      { header: "Line Total Rs", key: "lineTotal", width: 14 },
      { header: "Order Status", key: "status", width: 14 },
      { header: "Item Status", key: "itemStatus", width: 12 },
      { header: "Date", key: "placedAt", width: 18 },
    ];

    const rows = orders.flatMap((order) =>
      order.items.map<Record<string, ExcelCellValue>>((item) => {
        const unitPrice = money(item.unitPrice);
        return {
          orderId: shortId(order.id),
          tableNumber: order.session.table.tableNumber,
          sessionId: shortId(order.sessionId),
          itemName: item.menuItem.name,
          quantity: item.quantity,
          unitPrice,
          lineTotal: money(unitPrice * item.quantity),
          status: order.status,
          itemStatus: item.status,
          placedAt: order.placedAt,
        };
      }),
    );

    const activeRows = rows.filter((row) => row.itemStatus === OrderItemStatus.ACTIVE);
    return sendSheet("orders", params, {
      sheetName: "Orders",
      columns,
      rows,
      totals: {
        quantity: activeRows.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0),
        lineTotal: activeRows.reduce((sum, row) => sum + Number(row.lineTotal ?? 0), 0),
      },
    });
  }

  async exportPayments(params: ExportParams) {
    const { from, to } = parseDateRange(params);
    const payments = await prisma.payment.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: {
        session: { include: { table: true } },
        verifiedBy: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const columns: ExcelColumn[] = [
      { header: "Payment ID", key: "paymentId", width: 12 },
      { header: "Table", key: "tableNumber", width: 10 },
      { header: "Session", key: "sessionId", width: 12 },
      { header: "Amount Rs", key: "totalAmount", width: 14 },
      { header: "Method", key: "paymentMethod", width: 10 },
      { header: "Status", key: "status", width: 12 },
      { header: "Verified By", key: "verifiedBy", width: 18 },
      { header: "Created At", key: "createdAt", width: 18 },
      { header: "Verified At", key: "verifiedAt", width: 18 },
    ];

    const rows = payments.map<Record<string, ExcelCellValue>>((payment) => ({
      paymentId: shortId(payment.id),
      tableNumber: payment.session.table.tableNumber,
      sessionId: shortId(payment.sessionId),
      totalAmount: money(payment.totalAmount),
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      verifiedBy: payment.verifiedBy?.name ?? "Pending",
      createdAt: payment.createdAt,
      verifiedAt: payment.verifiedAt,
    }));

    return sendSheet("payments", params, {
      sheetName: "Payments",
      columns,
      rows,
      totals: {
        totalAmount: payments
          .filter((payment) => payment.status === PaymentStatus.COMPLETED)
          .reduce((sum, payment) => sum + money(payment.totalAmount), 0),
      },
    });
  }

  async exportRevenue(params: ExportParams) {
    const { from, to } = parseDateRange(params);
    const payments = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.COMPLETED,
        verifiedAt: { gte: from, lte: to },
      },
      include: { session: { include: { table: true } } },
      orderBy: { verifiedAt: "asc" },
    });

    const grouped = new Map<
      string,
      { date: string; cashRevenue: number; upiRevenue: number; totalRevenue: number; transactionCount: number }
    >();

    payments.forEach((payment) => {
      if (!payment.verifiedAt) return;
      const key = dateKey(payment.verifiedAt);
      const row = grouped.get(key) ?? {
        date: key,
        cashRevenue: 0,
        upiRevenue: 0,
        totalRevenue: 0,
        transactionCount: 0,
      };
      const amount = money(payment.totalAmount);
      row.totalRevenue = money(row.totalRevenue + amount);
      row.transactionCount += 1;
      if (payment.paymentMethod === PaymentMethod.CASH) row.cashRevenue = money(row.cashRevenue + amount);
      if (payment.paymentMethod === PaymentMethod.UPI) row.upiRevenue = money(row.upiRevenue + amount);
      grouped.set(key, row);
    });

    const rows = Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
    const columns: ExcelColumn[] = [
      { header: "Date", key: "date", width: 14 },
      { header: "Cash Revenue Rs", key: "cashRevenue", width: 16 },
      { header: "UPI Revenue Rs", key: "upiRevenue", width: 16 },
      { header: "Total Revenue Rs", key: "totalRevenue", width: 16 },
      { header: "Transactions", key: "transactionCount", width: 14 },
    ];

    return sendSheet("revenue", params, {
      sheetName: "Revenue",
      columns,
      rows,
      totals: {
        cashRevenue: rows.reduce((sum, row) => sum + row.cashRevenue, 0),
        upiRevenue: rows.reduce((sum, row) => sum + row.upiRevenue, 0),
        totalRevenue: rows.reduce((sum, row) => sum + row.totalRevenue, 0),
        transactionCount: rows.reduce((sum, row) => sum + row.transactionCount, 0),
      },
    });
  }

  async exportFeedback(params: ExportParams) {
    const { from, to } = parseDateRange(params);
    const feedback = await prisma.feedback.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { session: { include: { table: true } } },
      orderBy: { createdAt: "desc" },
    });
    const columns: ExcelColumn[] = [
      { header: "Feedback ID", key: "feedbackId", width: 12 },
      { header: "Table", key: "tableNumber", width: 10 },
      { header: "Rating", key: "rating", width: 10 },
      { header: "Comment", key: "comment", width: 40 },
      { header: "Created At", key: "createdAt", width: 18 },
    ];
    const rows = feedback.map<Record<string, ExcelCellValue>>((item) => ({
      feedbackId: shortId(item.id),
      tableNumber: item.session.table.tableNumber,
      rating: item.rating,
      comment: item.comment,
      createdAt: item.createdAt,
    }));

    return sendSheet("feedback", params, {
      sheetName: "Feedback",
      columns,
      rows,
      totals: { rating: rows.reduce((sum, row) => sum + Number(row.rating ?? 0), 0) },
    });
  }

  async exportTables(params: ExportParams) {
    const { from, to } = parseDateRange(params);
    const sessions = await prisma.tableSession.findMany({
      where: { openedAt: { gte: from, lte: to } },
      include: {
        table: true,
        payment: true,
        orders: true,
      },
      orderBy: { openedAt: "desc" },
    });
    const columns: ExcelColumn[] = [
      { header: "Table", key: "tableNumber", width: 10 },
      { header: "Session", key: "sessionId", width: 12 },
      { header: "Status", key: "status", width: 12 },
      { header: "Orders", key: "orderCount", width: 10 },
      { header: "Revenue Rs", key: "revenue", width: 14 },
      { header: "Opened At", key: "openedAt", width: 18 },
      { header: "Closed At", key: "closedAt", width: 18 },
    ];
    const rows = sessions.map<Record<string, ExcelCellValue>>((session) => ({
      tableNumber: session.table.tableNumber,
      sessionId: shortId(session.id),
      status: session.status,
      orderCount: session.orders.length,
      revenue: session.payment?.status === PaymentStatus.COMPLETED ? money(session.payment.totalAmount) : 0,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
    }));

    return sendSheet("tables", params, {
      sheetName: "Tables",
      columns,
      rows,
      totals: {
        orderCount: rows.reduce((sum, row) => sum + Number(row.orderCount ?? 0), 0),
        revenue: rows.reduce((sum, row) => sum + Number(row.revenue ?? 0), 0),
      },
    });
  }

  async exportCatering(params: ExportParams) {
    const { from, to } = parseDateRange(params);
    const leads = await prisma.cateringLead.findMany({
      where: { createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: "desc" },
    });
    const columns: ExcelColumn[] = [
      { header: "Lead ID", key: "leadId", width: 12 },
      { header: "Name", key: "name", width: 24 },
      { header: "Phone", key: "phone", width: 14 },
      { header: "Event Type", key: "eventType", width: 16 },
      { header: "Event Date", key: "eventDate", width: 18 },
      { header: "Guests", key: "guestCount", width: 10 },
      { header: "Location", key: "location", width: 24 },
      { header: "Status", key: "status", width: 14 },
      { header: "Notes", key: "notes", width: 40 },
      { header: "Created At", key: "createdAt", width: 18 },
    ];
    const rows = leads.map<Record<string, ExcelCellValue>>((lead) => ({
      leadId: shortId(lead.id),
      name: lead.name,
      phone: lead.phone,
      eventType: lead.eventType,
      eventDate: lead.eventDate,
      guestCount: lead.guestCount,
      location: lead.location,
      status: lead.status,
      notes: lead.notes,
      createdAt: lead.createdAt,
    }));

    return sendSheet("catering", params, {
      sheetName: "Catering",
      columns,
      rows,
      totals: {
        guestCount: leads
          .filter((lead) => lead.status !== CateringLeadStatus.LOST)
          .reduce((sum, lead) => sum + lead.guestCount, 0),
      },
    });
  }

  async exportStaffActivity(params: ExportParams) {
    const { from, to } = parseDateRange(params);

    const users = await prisma.user.findMany({
      include: {
        paymentsVerified: {
          where: {
            status: PaymentStatus.COMPLETED,
            verifiedAt: { gte: from, lte: to },
          },
        },
        assistanceResolved: {
          where: {
            status: AssistanceStatus.RESOLVED,
            resolvedAt: { gte: from, lte: to },
          },
        },
        dailyMenuAdded: {
          where: {
            addedAt: { gte: from, lte: to },
          },
        },
        dailyMenuRemoved: {
          where: {
            removedAt: { gte: from, lte: to },
          },
        },
      },
    });

    const columns: ExcelColumn[] = [
      { header: "Staff Name", key: "name", width: 20 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Role", key: "role", width: 12 },
      { header: "Payments Verified", key: "paymentsVerifiedCount", width: 18 },
      { header: "Verified Amount Rs", key: "paymentsVerifiedAmount", width: 20 },
      { header: "Assistance Resolved", key: "assistanceResolvedCount", width: 20 },
      { header: "Daily Menu Added", key: "dailyMenuAddedCount", width: 18 },
      { header: "Daily Menu Removed", key: "dailyMenuRemovedCount", width: 20 },
    ];

    const rows = users.map<Record<string, ExcelCellValue>>((u) => {
      const verifiedAmount = u.paymentsVerified.reduce((sum, p) => sum + money(p.totalAmount), 0);
      return {
        name: u.name,
        phone: u.phone,
        role: u.role,
        paymentsVerifiedCount: u.paymentsVerified.length,
        paymentsVerifiedAmount: money(verifiedAmount),
        assistanceResolvedCount: u.assistanceResolved.length,
        dailyMenuAddedCount: u.dailyMenuAdded.length,
        dailyMenuRemovedCount: u.dailyMenuRemoved.length,
      };
    });

    return sendSheet("staff", params, {
      sheetName: "Staff Activity",
      columns,
      rows,
      totals: {
        paymentsVerifiedCount: rows.reduce((sum, r) => sum + Number(r.paymentsVerifiedCount), 0),
        paymentsVerifiedAmount: rows.reduce((sum, r) => sum + Number(r.paymentsVerifiedAmount), 0),
        assistanceResolvedCount: rows.reduce((sum, r) => sum + Number(r.assistanceResolvedCount), 0),
        dailyMenuAddedCount: rows.reduce((sum, r) => sum + Number(r.dailyMenuAddedCount), 0),
        dailyMenuRemovedCount: rows.reduce((sum, r) => sum + Number(r.dailyMenuRemovedCount), 0),
      },
    });
  }

  async export(type: ExportType, params: ExportParams) {
    switch (type) {
      case "orders":
        return this.exportOrders(params);
      case "payments":
        return this.exportPayments(params);
      case "revenue":
        return this.exportRevenue(params);
      case "feedback":
        return this.exportFeedback(params);
      case "tables":
        return this.exportTables(params);
      case "catering":
        return this.exportCatering(params);
      case "staff":
        return this.exportStaffActivity(params);
      default:
        throw new AppError("Unsupported export type", 400);
    }
  }
}

export const exportService = new ExportService();
