import Module from "node:module";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrderStatus, Role } from "@prisma/client";

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
        create: vi.fn(),
        findMany: vi.fn(),
        updateMany: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      orderAssignmentHistory: {
        create: vi.fn(),
      },
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
const { serverService } = await import("../src/services/server.service");
const { adminService } = await import("../src/services/admin.service");

describe("Multi-Waiter & Multi-Kitchen Order Ownership & Assignment System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Kitchen Staff Order Claim & Release", () => {
    it("allows a cook to claim and accept a placed order", async () => {
      const mockOrder = {
        id: "order-123",
        status: OrderStatus.PLACED,
        assignedKitchenId: null,
        session: { id: "session-123", status: "ACTIVE", table: { tableNumber: "5" } },
        items: [],
      };

      mocks.prisma.order.updateMany.mockResolvedValueOnce({ count: 1 });
      mocks.prisma.order.findUnique.mockResolvedValueOnce({
        ...mockOrder,
        status: OrderStatus.ACCEPTED,
        assignedKitchenId: "cook-456",
        assignedKitchenName: "Cook John",
      });

      const result = await kitchenService.acceptOrder("order-123", "cook-456", "Cook John");

      expect(mocks.prisma.order.updateMany).toHaveBeenCalledWith({
        where: {
          id: "order-123",
          status: OrderStatus.PLACED,
          session: { status: "ACTIVE" },
        },
        data: {
          status: OrderStatus.ACCEPTED,
          assignedKitchenId: "cook-456",
          assignedKitchenName: "Cook John",
          acceptedAt: expect.any(Date),
        },
      });
      expect(mocks.prisma.order.findUnique).toHaveBeenCalledWith(expect.any(Object));
      expect(mocks.prisma.orderAssignmentHistory.create).toHaveBeenCalledWith({
        data: {
          orderId: "order-123",
          staffId: "cook-456",
          role: Role.KITCHEN,
          action: "CLAIMED",
        },
      });
      expect(mocks.to).toHaveBeenCalledWith("kitchen");
      expect(mocks.emit).toHaveBeenCalledWith("order:claimed:kitchen", {
        orderId: "order-123",
        assignedKitchenId: "cook-456",
        assignedKitchenName: "Cook John",
        status: OrderStatus.ACCEPTED,
      });
    });

    it("allows a cook to release their own accepted order", async () => {
      const mockOrder = {
        id: "order-123",
        status: OrderStatus.ACCEPTED,
        assignedKitchenId: "cook-456",
        assignedKitchenName: "Cook John",
        session: { id: "session-123", status: "ACTIVE", table: { tableNumber: "5" } },
        items: [],
      };

      mocks.prisma.order.findUnique.mockResolvedValueOnce(mockOrder);
      mocks.prisma.order.update.mockResolvedValueOnce({
        ...mockOrder,
        status: OrderStatus.PLACED,
        assignedKitchenId: null,
        assignedKitchenName: null,
      });

      const result = await kitchenService.releaseOrder("order-123", "cook-456", "KITCHEN");

      expect(mocks.prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-123" },
        data: {
          status: OrderStatus.PLACED,
          assignedKitchenId: null,
          assignedKitchenName: null,
          acceptedAt: null,
          preparingAt: null,
        },
        include: expect.any(Object),
      });
      expect(mocks.to).toHaveBeenCalledWith("kitchen");
      expect(mocks.emit).toHaveBeenCalledWith("order:released", {
        orderId: "order-123",
        role: Role.KITCHEN,
        status: OrderStatus.PLACED,
      });
    });

    it("prevents another cook from modifying or releasing a claimed order", async () => {
      const mockOrder = {
        id: "order-123",
        status: OrderStatus.ACCEPTED,
        assignedKitchenId: "cook-456",
        assignedKitchenName: "Cook John",
      };

      mocks.prisma.order.findUnique.mockResolvedValueOnce(mockOrder);

      await expect(
        kitchenService.releaseOrder("order-123", "cook-789", "KITCHEN")
      ).rejects.toThrow("This order is assigned to another kitchen staff member.");
    });
  });

  describe("Waiter Delivery Claim & Release", () => {
    it("allows a waiter to claim a ready delivery", async () => {
      const mockOrder = {
        id: "order-789",
        status: OrderStatus.READY,
        assignedWaiterId: null,
        session: { id: "session-123", status: "ACTIVE", table: { tableNumber: "5" } },
        items: [],
      };

      mocks.prisma.order.updateMany.mockResolvedValueOnce({ count: 1 });
      mocks.prisma.order.findUnique.mockResolvedValueOnce({
        ...mockOrder,
        id: "order-789",
        assignedWaiterId: "waiter-111",
        assignedWaiterName: "Waiter Sam",
      });

      const result = await serverService.claimDelivery("order-789", "waiter-111", "Waiter Sam");

      expect(mocks.prisma.order.updateMany).toHaveBeenCalledWith({
        where: {
          id: "order-789",
          status: OrderStatus.READY,
          assignedWaiterId: null,
        },
        data: {
          assignedWaiterId: "waiter-111",
          assignedWaiterName: "Waiter Sam",
          assignedAt: expect.any(Date),
        },
      });
      expect(mocks.prisma.order.findUnique).toHaveBeenCalledWith(expect.any(Object));
      expect(mocks.to).toHaveBeenCalledWith("server");
      expect(mocks.emit).toHaveBeenCalledWith("order:claimed:waiter", {
        orderId: "order-789",
        assignedWaiterId: "waiter-111",
        assignedWaiterName: "Waiter Sam",
        status: OrderStatus.READY,
      });
    });
  });

  describe("Admin Assignment Override Controls", () => {
    it("allows an admin to reassign kitchen staff", async () => {
      const mockOrder = {
        id: "order-123",
        status: OrderStatus.ACCEPTED,
        assignedKitchenId: "cook-456",
        acceptedAt: new Date("2026-06-14T00:00:00.000Z"),
      };
      const mockStaff = {
        id: "cook-888",
        name: "Cook Bob",
        role: Role.KITCHEN,
        isActive: true,
      };

      mocks.prisma.order.findUnique.mockResolvedValueOnce(mockOrder);
      mocks.prisma.user.findUnique.mockResolvedValueOnce(mockStaff);
      mocks.prisma.order.update.mockResolvedValueOnce({
        ...mockOrder,
        assignedKitchenId: "cook-888",
        assignedKitchenName: "Cook Bob",
      });

      const result = await adminService.reassignKitchen("order-123", "cook-888");

      expect(mocks.prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-123" },
        data: expect.objectContaining({
          assignedKitchenId: "cook-888",
          assignedKitchenName: "Cook Bob",
        }),
      });
      expect(mocks.to).toHaveBeenCalledWith("kitchen");
      expect(mocks.emit).toHaveBeenCalledWith("order:reassigned", {
        orderId: "order-123",
        assignedKitchenId: "cook-888",
        assignedKitchenName: "Cook Bob",
        role: Role.KITCHEN,
        status: OrderStatus.ACCEPTED,
      });
    });
  });
});
