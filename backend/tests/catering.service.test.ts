import Module from "node:module";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CateringLeadStatus } from "@prisma/client";

const mocks = vi.hoisted(() => {
  const emit = vi.fn();
  const to = vi.fn(() => ({ emit }));
  return {
    emit,
    to,
    prisma: {
      tableSession: { findUnique: vi.fn() },
      cateringLead: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
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

const { cateringService } = await import("../src/services/catering.service");

const lead = {
  id: "lead-1",
  sessionId: "session-1",
  name: "Ravi",
  phone: "9999999999",
  eventType: "SPORTS",
  eventDate: new Date("2026-07-01T00:00:00.000Z"),
  guestCount: 50,
  location: "Main hall",
  notes: null,
  preferredContactTime: "MORNING",
  status: CateringLeadStatus.NEW,
  adminNotes: null,
  createdAt: new Date("2026-06-13T10:00:00.000Z"),
  updatedAt: new Date("2026-06-13T10:00:00.000Z"),
};

describe("catering service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.tableSession.findUnique.mockResolvedValue({
      id: "session-1",
      table: { tableNumber: "5" },
    });
  });

  it("creates a catering lead and emits lead:new plus catering:new", async () => {
    mocks.prisma.cateringLead.create.mockResolvedValue(lead);

    const result = await cateringService.createLead("session-1", {
      name: "Ravi",
      phone: "9999999999",
      eventType: "SPORTS",
      eventDate: "2026-07-01",
      guestCount: 50,
      location: "Main hall",
      notes: undefined,
      preferredContactTime: "MORNING",
    });

    expect(mocks.prisma.cateringLead.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sessionId: "session-1",
        eventDate: expect.any(Date),
      }),
    });
    expect(result.name).toBe("Ravi");
    expect(mocks.emit).toHaveBeenCalledWith("lead:new", expect.objectContaining({ name: "Ravi" }));
    expect(mocks.emit).toHaveBeenCalledWith("catering:new", expect.objectContaining({ name: "Ravi" }));
  });

  it("returns paginated leads and applies status/search filters", async () => {
    mocks.prisma.cateringLead.findMany.mockResolvedValue([lead]);
    mocks.prisma.cateringLead.count.mockResolvedValue(1);

    const result = await cateringService.getLeads({
      status: CateringLeadStatus.NEW,
      search: "Ravi",
      page: 1,
      limit: 20,
    });

    expect(mocks.prisma.cateringLead.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        status: CateringLeadStatus.NEW,
        OR: expect.any(Array),
      }),
    }));
    expect(result.pagination.total).toBe(1);
    expect(result.items[0].name).toBe("Ravi");
  });

  it("updates lead status successfully", async () => {
    mocks.prisma.cateringLead.findUnique.mockResolvedValue(lead);
    mocks.prisma.cateringLead.update.mockResolvedValue({
      ...lead,
      status: CateringLeadStatus.CONTACTED,
    });

    const result = await cateringService.updateStatus("lead-1", {
      status: CateringLeadStatus.CONTACTED,
    });

    expect(result.status).toBe(CateringLeadStatus.CONTACTED);
  });

  it("throws 404 when updating a missing lead", async () => {
    mocks.prisma.cateringLead.findUnique.mockResolvedValue(null);

    await expect(cateringService.updateStatus("missing", {
      status: CateringLeadStatus.CONTACTED,
    })).rejects.toMatchObject({ statusCode: 404 });
  });
});
