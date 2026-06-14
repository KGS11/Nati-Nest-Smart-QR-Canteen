import Module from "node:module";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrderItemStatus, OrderStatus, PaymentStatus } from "@prisma/client";

const mocks = vi.hoisted(() => {
  const emit = vi.fn();
  const to = vi.fn(() => ({ emit }));
  return {
    emit,
    to,
    prisma: {
      order: {
        findUnique: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      orderItem: {
        update: vi.fn(),
        updateMany: vi.fn(),
        findMany: vi.fn(),
        groupBy: vi.fn(),
      },
      tableSession: {
        findUnique: vi.fn(),
      },
      payment: {
        findUnique: vi.fn(),
      },
      settings: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      user: {
        findMany: vi.fn(),
      },
      $transaction: vi.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
    },
  };
});

vi.mock("../src/config/db", () => ({ prisma: mocks.prisma }));

const originalLoad = (Module as unknown as { _load: typeof Module["_load"] })._load;
vi.spyOn(Module as unknown as { _load: typeof Module["_load"] }, "_load").mockImplementation(
  ((request: string, parent: NodeModule | null, isMain: boolean) => {
    if (request === "../index" && parent?.filename.includes("\\src\\services\\")) {
      return { io: { to: mocks.to } };
    }
    return originalLoad(request, parent, isMain);
  }) as typeof Module["_load"],
);

const { kitchenService } = await import("../src/services/kitchen.service");
const { settingsService } = await import("../src/services/settings.service");
const { exportService } = await import("../src/services/export.service");

const mockOrder = {
  id: "order-1",
  sessionId: "session-1",
  status: OrderStatus.PLACED,
  placedAt: new Date("2026-06-14T10:00:00Z"),
  session: {
    id: "session-1",
    status: "ACTIVE",
    table: { tableNumber: "5" },
  },
  items: [
    {
      id: "item-1",
      menuItemId: "menu-item-1",
      quantity: 2,
      unitPrice: { toNumber: () => 100, valueOf: () => 100, toString: () => "100" },
      specialInstructions: "Less spicy",
      status: OrderItemStatus.ACTIVE,
      menuItem: { id: "menu-item-1", name: "Dosa", price: { toNumber: () => 100, valueOf: () => 100, toString: () => "100" } },
    },
    {
      id: "item-2",
      menuItemId: "menu-item-2",
      quantity: 1,
      unitPrice: { toNumber: () => 50, valueOf: () => 50, toString: () => "50" },
      specialInstructions: null,
      status: OrderItemStatus.ACTIVE,
      menuItem: { id: "menu-item-2", name: "Tea", price: { toNumber: () => 50, valueOf: () => 50, toString: () => "50" } },
    },
  ],
};

describe("Kitchen Rejection Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an order item and leaves order status active if other items are active", async () => {
    mocks.prisma.order.findUnique.mockResolvedValueOnce(mockOrder);
    mocks.prisma.orderItem.update.mockResolvedValueOnce({ id: "item-1", status: OrderItemStatus.REJECTED });
    
    // Reload mocks
    const reloadedOrder = {
      ...mockOrder,
      items: [
        { ...mockOrder.items[0], status: OrderItemStatus.REJECTED },
        { ...mockOrder.items[1], status: OrderItemStatus.ACTIVE },
      ],
    };
    mocks.prisma.order.findUnique.mockResolvedValueOnce(reloadedOrder);

    const result = await kitchenService.rejectOrderItem("order-1", "item-1", "Out of stock");

    expect(mocks.prisma.orderItem.update).toHaveBeenCalledWith({
      where: { id: "item-1" },
      data: { status: OrderItemStatus.REJECTED, rejectionReason: "Out of stock" },
    });
    expect(result.status).toBe(OrderStatus.PLACED);
    expect(mocks.emit).toHaveBeenCalledWith("order:item_rejected", expect.objectContaining({
      itemId: "item-1",
      reason: "Out of stock",
    }));
  });

  it("cancels the entire order if all items in it are rejected", async () => {
    mocks.prisma.order.findUnique.mockResolvedValueOnce(mockOrder);
    mocks.prisma.orderItem.update.mockResolvedValueOnce({ id: "item-1", status: OrderItemStatus.REJECTED });
    
    const reloadedOrder = {
      ...mockOrder,
      items: [
        { ...mockOrder.items[0], status: OrderItemStatus.REJECTED },
        { ...mockOrder.items[1], status: OrderItemStatus.REJECTED },
      ],
    };
    mocks.prisma.order.findUnique.mockResolvedValueOnce(reloadedOrder);

    // Cancel mock
    mocks.prisma.order.update.mockResolvedValueOnce({
      ...reloadedOrder,
      status: OrderStatus.CANCELLED,
    });

    const result = await kitchenService.rejectOrderItem("order-1", "item-1", "Out of stock");

    expect(mocks.prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "order-1" },
      data: { status: OrderStatus.CANCELLED, rejectionReason: "All items rejected: Out of stock" },
    }));
    expect(result.status).toBe(OrderStatus.CANCELLED);
  });

  it("rejects all active items and cancels the entire order in rejectOrder", async () => {
    mocks.prisma.order.findUnique.mockResolvedValueOnce(mockOrder);
    
    const cancelledOrder = {
      ...mockOrder,
      status: OrderStatus.CANCELLED,
      items: mockOrder.items.map((i) => ({ ...i, status: OrderItemStatus.REJECTED })),
    };
    mocks.prisma.order.findUnique.mockResolvedValueOnce(cancelledOrder);

    const result = await kitchenService.rejectOrder("order-1", "Kitchen Closed");

    expect(mocks.prisma.orderItem.updateMany).toHaveBeenCalledWith({
      where: { orderId: "order-1", status: OrderItemStatus.ACTIVE },
      data: { status: OrderItemStatus.REJECTED, rejectionReason: "Kitchen Closed" },
    });
    expect(result.status).toBe(OrderStatus.CANCELLED);
  });
});

describe("Dynamic UPI QR Settings Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.payment.findUnique.mockResolvedValue(null);
  });

  it("generates a dynamic UPI QR Code when upi_id is configured", async () => {
    mocks.prisma.tableSession.findUnique.mockResolvedValueOnce({
      id: "session-1",
      table: { tableNumber: "3" },
    });
    mocks.prisma.order.findMany.mockResolvedValueOnce([mockOrder]);
    
    mocks.prisma.settings.findMany.mockResolvedValueOnce([
      { key: "upi_id", value: "test@upi" },
      { key: "business_name", value: "Nati Nest" },
    ]);

    const result = await settingsService.getDynamicUpiQr("session-1");

    expect(result.qrType).toBe("dynamic");
    expect(result.amount).toBe(250); // 100 * 2 + 50
    expect(result.upiLink).toContain("test@upi");
  });

  it("falls back to static upi_qr_url if upi_id setting is missing", async () => {
    mocks.prisma.tableSession.findUnique.mockResolvedValueOnce({
      id: "session-1",
      table: { tableNumber: "3" },
    });
    mocks.prisma.order.findMany.mockResolvedValueOnce([mockOrder]);
    
    mocks.prisma.settings.findMany.mockResolvedValueOnce([
      { key: "upi_id", value: "" },
      { key: "upi_qr_url", value: "https://cloudinary.com/qr.png" },
    ]);

    const result = await settingsService.getDynamicUpiQr("session-1");

    expect(result.qrType).toBe("static");
    expect(result.qrDataUrl).toBe("https://cloudinary.com/qr.png");
  });
});

describe("Staff Activity Export Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("compiles staff metrics in date range and generates export", async () => {
    const mockUser = {
      name: "Ramesh",
      phone: "8888888888",
      role: "SERVER",
      paymentsVerified: [{ totalAmount: { toNumber: () => 350, valueOf: () => 350, toString: () => "350" } }],
      assistanceResolved: [1, 2],
      dailyMenuAdded: [1],
      dailyMenuRemoved: [1, 2, 3],
    };
    mocks.prisma.user.findMany.mockResolvedValueOnce([mockUser]);

    const result = await exportService.exportStaffActivity({
      filter: "today",
      format: "csv",
    });

    expect(result.contentType).toBe("text/csv");
    expect(result.content).toContain("Ramesh");
    expect(result.content).toContain("SERVER");
    expect(result.content).toContain("350");
  });
});
