import Module from "node:module";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentStatus } from "@prisma/client";

const mocks = vi.hoisted(() => {
  const emit = vi.fn();
  const to = vi.fn(() => ({ emit }));
  return {
    emit,
    to,
    prisma: {
      payment: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        aggregate: vi.fn(),
        groupBy: vi.fn(),
        findMany: vi.fn(),
      },
      order: {
        findUnique: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      tableSession: {
        findUnique: vi.fn(),
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

const { paymentService } = await import("../src/services/payment.service");
const { serverService } = await import("../src/services/server.service");
const { reportsService } = await import("../src/services/reports.service");

describe("Waiter Tipping and Order Notes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates the tip amount on payment session", async () => {
    const decimal = (value: number) => ({
      toNumber: () => value,
      valueOf: () => value,
    });

    const mockPayment = {
      id: "payment-123",
      sessionId: "session-123",
      totalAmount: decimal(100),
      tipAmount: decimal(0),
      status: PaymentStatus.PENDING,
    };

    const mockSession = {
      id: "session-123",
      table: { tableNumber: "5" },
    };

    mocks.prisma.payment.findUnique.mockResolvedValueOnce(mockPayment);
    mocks.prisma.tableSession.findUnique.mockResolvedValueOnce(mockSession);
    mocks.prisma.order.findMany.mockResolvedValueOnce([]);
    mocks.prisma.payment.update.mockResolvedValueOnce({
      ...mockPayment,
      tipAmount: decimal(20),
    });

    const result = await paymentService.setTipAmount("session-123", 20);

    expect(mocks.prisma.payment.findUnique).toHaveBeenCalledWith({
      where: { sessionId: "session-123" },
    });
    expect(mocks.prisma.payment.update).toHaveBeenCalledWith({
      where: { id: "payment-123" },
      data: {
        tipAmount: expect.any(Object),
        totalAmount: expect.any(Object),
      },
    });
    expect(result.tipAmount).toBe(20);
    expect(mocks.to).toHaveBeenCalledWith("server");
    expect(mocks.emit).toHaveBeenCalledWith("payment:tip_updated", {
      paymentId: "payment-123",
      tipAmount: 20,
    });
  });

  it("updates special notes on active order", async () => {
    const mockOrder = {
      id: "order-123",
      specialNotes: null,
    };

    mocks.prisma.order.findUnique.mockResolvedValueOnce(mockOrder);
    mocks.prisma.order.update.mockResolvedValueOnce({
      id: "order-123",
      specialNotes: "No spices",
    });

    const result = await serverService.updateOrderNotes("order-123", "No spices");

    expect(mocks.prisma.order.findUnique).toHaveBeenCalledWith({
      where: { id: "order-123" },
    });
    expect(mocks.prisma.order.update).toHaveBeenCalledWith({
      where: { id: "order-123" },
      data: { specialNotes: "No spices" },
    });
    expect(result.specialNotes).toBe("No spices");
    expect(mocks.to).toHaveBeenCalledWith("kitchen");
    expect(mocks.to).toHaveBeenCalledWith("server");
    expect(mocks.emit).toHaveBeenCalledWith("order:notes_updated", {
      orderId: "order-123",
      specialNotes: "No spices",
    });
  });
});
