import { beforeEach, describe, expect, it, vi } from "vitest";
import Module from "node:module";
import {
  OrderItemStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  SessionStatus,
  TableStatus,
} from "@prisma/client";

const mocks = vi.hoisted(() => {
  const emit = vi.fn();
  const to = vi.fn(() => ({ emit }));

  const tx = {
    order: {
      create: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    orderItem: {
      createMany: vi.fn(),
    },
    restaurantTable: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    tableSession: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    refreshToken: {
      update: vi.fn(),
      create: vi.fn(),
    },
    waiterAssignmentRequest: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  };

  const prisma = {
    tableSession: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    restaurantTable: {
      update: vi.fn(),
    },
    menuItem: {
      findMany: vi.fn(),
    },
    dailyMenu: {
      findMany: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    orderItem: {
      createMany: vi.fn(),
    },
    payment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    waiterAssignmentRequest: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    assistanceRequest: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(async (arg: unknown) => {
      if (typeof arg === "function") {
        return (arg as (transaction: typeof tx) => unknown)(tx);
      }
      return Promise.all(arg as Promise<unknown>[]);
    }),
  };

  return { emit, to, tx, prisma };
});

vi.mock("../src/config/db", () => ({ prisma: mocks.prisma }));
vi.mock("../src/index", () => ({ io: { to: mocks.to } }));

const originalLoad = (Module as unknown as { _load: typeof Module["_load"] })._load;
vi.spyOn(Module as unknown as { _load: typeof Module["_load"] }, "_load").mockImplementation(
  (function (this: any, request: string, parent: NodeModule | null, isMain: boolean) {
    if (request === "../index" && parent?.filename.includes("\\src\\services\\")) {
      return { io: { to: mocks.to } };
    }
    return originalLoad.apply(this, arguments as any);
  }) as any,
);

const { orderService } = await import("../src/services/order.service");
const { paymentService } = await import("../src/services/payment.service");
const { sessionService } = await import("../src/services/session.service");

const decimal = (value: number) => ({
  toNumber: () => value,
  valueOf: () => value,
});

const activeSession = {
  id: "session-1",
  tableId: "table-1",
  status: SessionStatus.ACTIVE,
  table: { tableNumber: "5" },
};

const menuItem = {
  id: "item-1",
  name: "Masala Dosa",
  price: decimal(80),
  isAvailable: true,
};

const orderWithItems = {
  id: "order-1",
  sessionId: "session-1",
  status: OrderStatus.PLACED,
  placedAt: new Date("2026-06-13T10:00:00.000Z"),
  session: activeSession,
  items: [
    {
      id: "order-item-1",
      orderId: "order-1",
      menuItemId: "item-1",
      quantity: 2,
      unitPrice: decimal(80),
      status: OrderItemStatus.ACTIVE,
      specialInstructions: "Less spicy",
      createdAt: new Date("2026-06-13T10:00:00.000Z"),
      menuItem,
    },
  ],
};

describe("order, payment, and session services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-jwt-secret-with-more-than-32-characters";
    mocks.prisma.tableSession.findUnique.mockResolvedValue(activeSession);
    mocks.prisma.dailyMenu.findMany.mockResolvedValue([
      { menuItemId: "item-1" },
      { menuItemId: "item-2" },
    ]);
    mocks.prisma.waiterAssignmentRequest.findFirst.mockResolvedValue(null);
    mocks.prisma.waiterAssignmentRequest.create.mockResolvedValue({
      id: "req-1",
      sessionId: "session-1",
      status: "PENDING",
      requestedAt: new Date(),
    });
  });

  it("creates an order transaction using database prices and emits order:new", async () => {
    mocks.prisma.menuItem.findMany.mockResolvedValue([menuItem]);
    mocks.tx.order.create.mockResolvedValue({ id: "order-1" });
    mocks.tx.order.findUniqueOrThrow.mockResolvedValue(orderWithItems);

    const order = await orderService.createOrder("session-1", {
      items: [{ menuItemId: "item-1", quantity: 2, specialInstructions: "Less spicy" }],
    });

    expect(mocks.prisma.$transaction).toHaveBeenCalled();
    expect(mocks.tx.orderItem.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          orderId: "order-1",
          menuItemId: "item-1",
          quantity: 2,
          unitPrice: menuItem.price,
        }),
      ],
    });
    expect(order.totalAmount).toBe(160);
    expect(order.itemCount).toBe(2);
    expect(mocks.to).toHaveBeenCalledWith("kitchen");
    expect(mocks.emit).toHaveBeenCalledWith("order:new", expect.objectContaining({
      orderId: "order-1",
      tableNumber: "5",
      sessionId: "session-1",
      itemCount: 2,
    }));
  });

  it("rejects unavailable menu items before creating an order", async () => {
    mocks.prisma.menuItem.findMany.mockResolvedValue([{ ...menuItem, isAvailable: false }]);

    await expect(
      orderService.createOrder("session-1", {
        items: [{ menuItemId: "item-1", quantity: 1 }],
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("cancels only PLACED orders and emits a kitchen status update", async () => {
    mocks.prisma.order.findUnique.mockResolvedValue({
      id: "order-1",
      sessionId: "session-1",
      status: OrderStatus.PLACED,
    });
    mocks.prisma.order.update.mockResolvedValue({
      ...orderWithItems,
      status: OrderStatus.CANCELLED,
    });

    const order = await orderService.cancelOrder("session-1", "order-1");

    expect(order.status).toBe(OrderStatus.CANCELLED);
    expect(mocks.prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "order-1" },
      data: { status: OrderStatus.CANCELLED },
    }));
    expect(mocks.emit).toHaveBeenCalledWith("order:status_updated", expect.objectContaining({
      orderId: "order-1",
      status: OrderStatus.CANCELLED,
    }));
  });

  it("blocks cancellation after the kitchen accepts an order", async () => {
    mocks.prisma.order.findUnique.mockResolvedValue({
      id: "order-1",
      sessionId: "session-1",
      status: OrderStatus.ACCEPTED,
    });

    await expect(orderService.cancelOrder("session-1", "order-1")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("returns an existing pending payment on duplicate bill request", async () => {
    mocks.prisma.payment.findUnique.mockResolvedValue({
      id: "payment-1",
      sessionId: "session-1",
      status: PaymentStatus.PENDING,
      totalAmount: decimal(160),
    });
    mocks.prisma.order.findMany.mockResolvedValue([{ ...orderWithItems, status: OrderStatus.DELIVERED }]);

    const result = await paymentService.createPaymentOnBillRequest("session-1");

    expect(result.isNew).toBe(false);
    expect(result.payment.totalAmount).toBe(160);
    expect(mocks.prisma.payment.create).not.toHaveBeenCalled();
  });

  it("rejects bill requests when the session has no billable orders", async () => {
    mocks.prisma.payment.findUnique.mockResolvedValue(null);
    mocks.prisma.order.findMany.mockResolvedValue([]);

    await expect(paymentService.createPaymentOnBillRequest("session-1")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("verifies payment, closes session, frees table, and marks delivered orders paid", async () => {
    mocks.prisma.payment.findUnique.mockResolvedValue({
      id: "payment-1",
      status: PaymentStatus.PENDING,
      session: { id: "session-1", tableId: "table-1", table: { tableNumber: "5" } },
    });
    mocks.prisma.payment.update.mockResolvedValue({
      id: "payment-1",
      status: PaymentStatus.COMPLETED,
      totalAmount: decimal(160),
      verifiedAt: new Date("2026-06-13T10:10:00.000Z"),
      session: { id: "session-1", tableId: "table-1", table: { tableNumber: "5" } },
      verifiedBy: { name: "Server" },
    });
    mocks.prisma.tableSession.update.mockResolvedValue({ id: "session-1", status: SessionStatus.CLOSED });
    mocks.prisma.restaurantTable.update.mockResolvedValue({ id: "table-1", status: TableStatus.AVAILABLE });
    mocks.prisma.order.updateMany.mockResolvedValue({ count: 1 });

    const result = await paymentService.verifyPayment("payment-1", "staff-1", PaymentMethod.CASH);

    expect(result.payment.status).toBe(PaymentStatus.COMPLETED);
    expect(mocks.prisma.tableSession.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "session-1" },
      data: expect.objectContaining({ status: SessionStatus.CLOSED }),
    }));
    expect(mocks.prisma.restaurantTable.update).toHaveBeenCalledWith({
      where: { id: "table-1" },
      data: { status: TableStatus.AVAILABLE },
    });
    expect(mocks.prisma.order.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        sessionId: "session-1",
        status: { in: [OrderStatus.DELIVERED, OrderStatus.READY, OrderStatus.PREPARED] },
      },
      data: expect.objectContaining({ status: OrderStatus.PAID }),
    }));
  });

  it("creates a new table session in a serializable transaction", async () => {
    const table = { id: "table-1", tableNumber: "5", status: TableStatus.AVAILABLE };
    const session = { id: "session-1", tableId: "table-1", status: SessionStatus.ACTIVE };
    mocks.tx.restaurantTable.findUnique.mockResolvedValueOnce(table);
    mocks.tx.tableSession.findFirst.mockResolvedValue(null);
    mocks.tx.tableSession.create.mockResolvedValue(session);
    mocks.tx.restaurantTable.update.mockResolvedValue({ ...table, status: TableStatus.OCCUPIED });

    const result = await sessionService.getOrCreateSession("table-1");

    expect(result.isNew).toBe(true);
    expect(result.tableNumber).toBe("5");
    expect(result.sessionToken).toEqual(expect.any(String));
    expect(mocks.prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({
      isolationLevel: "Serializable",
    }));
  });

  it("reuses an existing active session instead of creating a duplicate", async () => {
    const table = { id: "table-1", tableNumber: "5", status: TableStatus.OCCUPIED };
    const session = { id: "session-1", tableId: "table-1", status: SessionStatus.ACTIVE };
    mocks.tx.restaurantTable.findUnique.mockResolvedValueOnce(table);
    mocks.tx.tableSession.findFirst.mockResolvedValue(session);

    const result = await sessionService.getOrCreateSession("table-1");

    expect(result.isNew).toBe(false);
    expect(mocks.tx.tableSession.create).not.toHaveBeenCalled();
    expect(mocks.tx.restaurantTable.update).not.toHaveBeenCalled();
  });
});
