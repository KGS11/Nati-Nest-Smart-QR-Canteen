import Module from "node:module";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DailyMenuRemovalReason } from "@prisma/client";

const mocks = vi.hoisted(() => {
  const emit = vi.fn();
  const to = vi.fn(() => ({ emit }));
  return {
    emit,
    to,
    prisma: {
      dailyMenu: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      menuItem: {
        findUnique: vi.fn(),
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

const { dailyMenuService } = await import("../src/services/daily-menu.service");

describe("daily menu service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes a menu item from today's menu with reason details", async () => {
    const entry = {
      id: "entry-1",
      menuItemId: "item-1",
      menuDate: new Date(),
      addedById: "user-1",
      removedAt: null,
      menuItem: {
        name: "Mock Item",
      },
    };

    mocks.prisma.dailyMenu.findUnique.mockResolvedValue(entry);
    mocks.prisma.dailyMenu.update.mockResolvedValue({
      ...entry,
      removedAt: new Date(),
      removedById: "user-1",
      removalReason: "Sold out",
      removalReasonType: DailyMenuRemovalReason.OUT_OF_STOCK,
    });

    const result = await dailyMenuService.removeItemFromToday(
      "item-1",
      "user-1",
      "Sold out",
      DailyMenuRemovalReason.OUT_OF_STOCK
    );

    expect(mocks.prisma.dailyMenu.update).toHaveBeenCalledWith({
      where: { id: "entry-1" },
      data: expect.objectContaining({
        removalReason: "Sold out",
        removalReasonType: DailyMenuRemovalReason.OUT_OF_STOCK,
        removedById: "user-1",
      }),
    });
    expect(result.name).toBe("Mock Item");
  });

  it("fetches soft-deleted/removed items", async () => {
    const entry = {
      id: "entry-1",
      menuItemId: "item-1",
      menuItem: {
        name: "Mock Item",
        description: "Tasty",
        price: { toNumber: () => 120 },
        imageUrl: null,
        isPopular: false,
        category: { id: "cat-1", name: "Starters" },
      },
      addedAt: new Date(),
      addedBy: { name: "Admin" },
      removedAt: new Date(),
      removedBy: { name: "Admin" },
      removalReason: "Machine broken",
      removalReasonType: DailyMenuRemovalReason.MACHINE_PROBLEM,
    };

    mocks.prisma.dailyMenu.findMany.mockResolvedValue([entry]);

    const result = await dailyMenuService.getRemovedItems();

    expect(mocks.prisma.dailyMenu.findMany).toHaveBeenCalled();
    expect(result.items[0].name).toBe("Mock Item");
    expect(result.items[0].removalReasonType).toBe(DailyMenuRemovalReason.MACHINE_PROBLEM);
  });

  it("restores a removed item to today's menu", async () => {
    const entry = {
      id: "entry-1",
      menuItemId: "item-1",
      removedAt: new Date(),
      menuItem: {
        name: "Mock Item",
        isAvailable: true,
      },
    };

    mocks.prisma.dailyMenu.findUnique.mockResolvedValue(entry);
    mocks.prisma.dailyMenu.update.mockResolvedValue({
      ...entry,
      removedAt: null,
    });

    const result = await dailyMenuService.restoreItem("entry-1", "user-1");

    expect(mocks.prisma.dailyMenu.update).toHaveBeenCalledWith({
      where: { id: "entry-1" },
      data: expect.objectContaining({
        removedAt: null,
        removedById: null,
        removalReason: null,
        removalReasonType: null,
        addedById: "user-1",
      }),
    });
    expect(result.name).toBe("Mock Item");
  });
});
