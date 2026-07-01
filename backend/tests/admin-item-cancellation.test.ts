import Module from "node:module";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrderItemStatus, OrderStatus, PaymentStatus } from "@prisma/client";

const mocks = vi.hoisted(() => {
  const emit = vi.fn();
  const to = vi.fn(() => ({ emit }));

  const tx = {
    order: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    orderItem: {
      update: vi.fn(),
    },
    payment: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    paymentAdjustment: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };

  return {
    emit,
    to,
    tx,
    prisma: {
      order: {
        findMany: vi.fn(),
      },
      $transaction: vi.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx)),
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

const { adminService } = await import("../src/services/admin.service");

const decimal = (value: number) => ({
  toNumber: () => value,
  valueOf: () => value,
  toString: () => String(value),
});

const baseOrder = {
  id: "order-1",
  sessionId: "session-1",
  status: OrderStatus.DELIVERED,
  session: {
    id: "session-1",
    table: { tableNumber: "T01" },
  },
  items: [
    {
      id: "order-item-1",
      orderId: "order-1",
      menuItemId: "menu-item-1",
      quantity: 2,
      unitPrice: decimal(100),
      status: OrderItemStatus.ACTIVE,
      cancellationReason: null,
      cancellationNotes: null,
      cancelledAt: null,
      menuItem: { id: "menu-item-1", name: "Dosa", price: decimal(100) },
    },
    {
      id: "order-item-2",
      orderId: "order-1",
      menuItemId: "menu-item-2",
      quantity: 1,
      unitPrice: decimal(50),
      status: OrderItemStatus.ACTIVE,
      cancellationReason: null,
      cancellationNotes: null,
      cancelledAt: null,
      menuItem: { id: "menu-item-2", name: "Tea", price: decimal(50) },
    },
  ],
};

const sessionOrdersBefore = [
  {
    status: OrderStatus.DELIVERED,
    items: baseOrder.items,
  },
];

const sessionOrdersAfter = [
  {
    status: OrderStatus.DELIVERED,
    items: [
      { ...baseOrder.items[0], status: OrderItemStatus.CANCELLED_BY_ADMIN },
      baseOrder.items[1],
    ],
  },
];

describe("admin order item cancellation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tx.order.findUnique.mockResolvedValue(baseOrder);
    mocks.tx.order.findMany
      .mockResolvedValueOnce(sessionOrdersBefore)
      .mockResolvedValueOnce(sessionOrdersAfter);
    mocks.tx.orderItem.update.mockResolvedValue({
      ...baseOrder.items[0],
      status: OrderItemStatus.CANCELLED_BY_ADMIN,
      cancellationReason: "TASTE_ISSUE",
      cancellationNotes: "Owner approved",
      cancelledAt: new Date("2026-07-01T10:00:00.000Z"),
      cancelledBy: { id: "admin-1", name: "Admin" },
    });
  });

  it("cancels an active delivered item and recalculates a pending payment", async () => {
    mocks.tx.payment.findUnique.mockResolvedValue({
      id: "payment-1",
      sessionId: "session-1",
      status: PaymentStatus.PENDING,
      totalAmount: decimal(250),
    });
    mocks.tx.payment.update.mockResolvedValue({
      id: "payment-1",
      status: PaymentStatus.PENDING,
      totalAmount: decimal(50),
    });

    const result = await adminService.cancelOrderItem(
      "order-1",
      "order-item-1",
      { reason: "TASTE_ISSUE", notes: "Owner approved" },
      { userId: "admin-1", name: "Admin" },
      "127.0.0.1",
    );

    expect(mocks.tx.orderItem.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "order-item-1" },
      data: expect.objectContaining({
        status: OrderItemStatus.CANCELLED_BY_ADMIN,
        cancellationReason: "TASTE_ISSUE",
      }),
    }));
    expect(mocks.tx.payment.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "payment-1" },
      data: expect.objectContaining({ totalAmount: expect.anything() }),
    }));
    expect(mocks.tx.paymentAdjustment.create).not.toHaveBeenCalled();
    expect(mocks.tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: "ORDER_ITEM_CANCELLED_BY_ADMIN",
        actorId: "admin-1",
      }),
    }));
    expect(result.amountDeducted).toBe(200);
    expect(result.newTotal).toBe(50);
    expect(mocks.emit).toHaveBeenCalledWith("order:item_cancelled", expect.objectContaining({
      itemId: "order-item-1",
      reason: "TASTE_ISSUE",
    }));
  });

  it("creates a refund-pending adjustment for completed payments without rewriting payment history", async () => {
    mocks.tx.payment.findUnique.mockResolvedValue({
      id: "payment-1",
      sessionId: "session-1",
      status: PaymentStatus.COMPLETED,
      totalAmount: decimal(250),
    });
    mocks.tx.paymentAdjustment.create.mockResolvedValue({
      id: "adjustment-1",
      amount: decimal(200),
      status: "REFUND_PENDING",
    });

    const result = await adminService.cancelOrderItem(
      "order-1",
      "order-item-1",
      { reason: "POOR_QUALITY" },
      { userId: "admin-1", name: "Admin" },
    );

    expect(mocks.tx.payment.update).not.toHaveBeenCalled();
    expect(mocks.tx.paymentAdjustment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        paymentId: "payment-1",
        orderItemId: "order-item-1",
        status: "REFUND_PENDING",
      }),
    }));
    expect(result.adjustment).toEqual(expect.objectContaining({
      id: "adjustment-1",
      status: "REFUND_PENDING",
    }));
  });

  it("rejects duplicate restaurant cancellations", async () => {
    mocks.tx.order.findUnique.mockResolvedValue({
      ...baseOrder,
      items: [{ ...baseOrder.items[0], status: OrderItemStatus.CANCELLED_BY_ADMIN }],
    });

    await expect(
      adminService.cancelOrderItem(
        "order-1",
        "order-item-1",
        { reason: "OTHER" },
        { userId: "admin-1", name: "Admin" },
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("rejects cancellation before delivery", async () => {
    mocks.tx.order.findUnique.mockResolvedValue({
      ...baseOrder,
      status: OrderStatus.PREPARING,
    });

    await expect(
      adminService.cancelOrderItem(
        "order-1",
        "order-item-1",
        { reason: "OTHER" },
        { userId: "admin-1", name: "Admin" },
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
