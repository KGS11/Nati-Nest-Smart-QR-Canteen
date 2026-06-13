import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrderItemStatus, OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { AppError } from "../src/utils/AppError";
import { generateCSV, parseDateRange } from "../src/utils/excel.util";

const mocks = vi.hoisted(() => ({
  prisma: {
    order: { findMany: vi.fn() },
    payment: { findMany: vi.fn() },
    feedback: { findMany: vi.fn() },
    tableSession: { findMany: vi.fn() },
    cateringLead: { findMany: vi.fn() },
  },
}));

vi.mock("../src/config/db", () => ({ prisma: mocks.prisma }));

const { exportService } = await import("../src/services/export.service");

const decimal = (value: number) => ({
  toString: () => String(value),
  valueOf: () => value,
});

describe("export utilities and service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses custom date ranges and rejects missing custom dates", () => {
    const range = parseDateRange({
      filter: "custom",
      startDate: "2026-06-01",
      endDate: "2026-06-13",
    });

    expect(range.from.getFullYear()).toBe(2026);
    expect(range.from.getMonth()).toBe(5);
    expect(range.from.getDate()).toBe(1);
    expect(range.from.getHours()).toBe(0);
    expect(range.to.getFullYear()).toBe(2026);
    expect(range.to.getMonth()).toBe(5);
    expect(range.to.getDate()).toBe(13);
    expect(range.to.getHours()).toBe(23);
    expect(() => parseDateRange({ filter: "custom" })).toThrow(AppError);
  });

  it("generates escaped CSV values", () => {
    const csv = generateCSV(
      [{ header: "Name", key: "name", width: 12 }],
      [{ name: 'Dosa "Special"' }],
    );

    expect(csv).toContain('"Dosa ""Special"""');
  });

  it("exports orders as CSV with line totals and excludes rejected items from totals", async () => {
    mocks.prisma.order.findMany.mockResolvedValue([
      {
        id: "order-12345678",
        sessionId: "session-12345678",
        status: OrderStatus.PLACED,
        placedAt: new Date("2026-06-13T10:00:00.000Z"),
        session: { table: { tableNumber: "5" } },
        items: [
          {
            quantity: 2,
            unitPrice: decimal(80),
            status: OrderItemStatus.ACTIVE,
            menuItem: { name: "Masala Dosa" },
          },
          {
            quantity: 1,
            unitPrice: decimal(40),
            status: OrderItemStatus.REJECTED,
            menuItem: { name: "Tea" },
          },
        ],
      },
    ]);

    const result = await exportService.exportOrders({ filter: "today", format: "csv" });

    expect(result.contentType).toBe("text/csv");
    expect(String(result.content)).toContain("Masala Dosa");
    expect(String(result.content)).toContain("160");
  });

  it("exports orders as an xlsx buffer", async () => {
    mocks.prisma.order.findMany.mockResolvedValue([]);

    const result = await exportService.exportOrders({ filter: "today", format: "xlsx" });

    expect(Buffer.isBuffer(result.content)).toBe(true);
    expect(result.filename).toBe("orders-export.xlsx");
  });

  it("exports payments and labels unverified payments as Pending", async () => {
    mocks.prisma.payment.findMany.mockResolvedValue([
      {
        id: "payment-12345678",
        sessionId: "session-12345678",
        totalAmount: decimal(150),
        paymentMethod: PaymentMethod.CASH,
        status: PaymentStatus.PENDING,
        createdAt: new Date("2026-06-13T10:00:00.000Z"),
        verifiedAt: null,
        verifiedBy: null,
        session: { table: { tableNumber: "5" } },
      },
    ]);

    const result = await exportService.exportPayments({ filter: "today", format: "csv" });

    expect(String(result.content)).toContain("Pending");
  });

  it("groups revenue by date and payment method", async () => {
    mocks.prisma.payment.findMany.mockResolvedValue([
      {
        totalAmount: decimal(100),
        paymentMethod: PaymentMethod.CASH,
        status: PaymentStatus.COMPLETED,
        verifiedAt: new Date("2026-06-13T10:00:00.000Z"),
        session: { table: { tableNumber: "5" } },
      },
      {
        totalAmount: decimal(50),
        paymentMethod: PaymentMethod.UPI,
        status: PaymentStatus.COMPLETED,
        verifiedAt: new Date("2026-06-13T11:00:00.000Z"),
        session: { table: { tableNumber: "6" } },
      },
    ]);

    const result = await exportService.exportRevenue({ filter: "today", format: "csv" });

    expect(String(result.content)).toContain("150");
    expect(String(result.content)).toContain("100");
    expect(String(result.content)).toContain("50");
  });
});
