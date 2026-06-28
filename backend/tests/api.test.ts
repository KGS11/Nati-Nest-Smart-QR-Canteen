import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role, SessionStatus } from "@prisma/client";
import { sessionSignOptions, staffSignOptions } from "../src/utils/jwt.utils";

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
  },
  tableSession: {
    findUnique: vi.fn(),
  },
  $queryRaw: vi.fn(),
  $disconnect: vi.fn(),
};

const authLogin = vi.fn();
const authRefresh = vi.fn();
const authLogout = vi.fn();
const categoryService = {
  createCategory: vi.fn(),
  getCategories: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
};
const menuService = {
  createItem: vi.fn(),
  getItems: vi.fn(),
  updateItem: vi.fn(),
  updateAvailability: vi.fn(),
  deleteItem: vi.fn(),
};
const tableService = {
  getAllTables: vi.fn(),
  getTableById: vi.fn(),
  createTable: vi.fn(),
  updateTable: vi.fn(),
  regenerateQRCode: vi.fn(),
  updateTableStatus: vi.fn(),
  deleteTable: vi.fn(),
  getTableByNumber: vi.fn(),
};
const sessionService = {
  getOrCreateSession: vi.fn(),
  getSessionDetails: vi.fn(),
  getSessionMenu: vi.fn(),
};
const orderService = {
  createOrder: vi.fn(),
  getSessionOrders: vi.fn(),
  getOrderDetails: vi.fn(),
  cancelOrder: vi.fn(),
};
const kitchenService = {
  getActiveOrders: vi.fn(),
  getOrderDetails: vi.fn(),
  acceptOrder: vi.fn(),
  startPreparing: vi.fn(),
  markReady: vi.fn(),
};
const serverService = {
  getReadyOrders: vi.fn(),
  markDelivered: vi.fn(),
  getAssistanceRequests: vi.fn(),
  resolveAssistanceRequest: vi.fn(),
  createAssistanceRequest: vi.fn(),
  getSessionBillSummary: vi.fn(),
};
const paymentService = {
  createPaymentOnBillRequest: vi.fn(),
  verifyPayment: vi.fn(),
  getPaymentBySession: vi.fn(),
  getPendingPayments: vi.fn(),
};
const reportsService = {
  getDashboardSummary: vi.fn(),
  getRevenueSummary: vi.fn(),
  getOrderAnalytics: vi.fn(),
  getPopularItems: vi.fn(),
  getTableUtilization: vi.fn(),
  getFeedbackAnalytics: vi.fn(),
};
const cateringService = {
  createLead: vi.fn(),
  getLeads: vi.fn(),
  getLead: vi.fn(),
  updateStatus: vi.fn(),
  exportCsv: vi.fn(),
};
const dailyMenuService = {
  getTodayMenu: vi.fn(),
  getFullMenuWithStatus: vi.fn(),
  addItemToToday: vi.fn(),
  removeItemFromToday: vi.fn(),
  getRemovedItems: vi.fn(),
  restoreItem: vi.fn(),
  copyYesterdayMenu: vi.fn(),
  getHistoryMenu: vi.fn(),
};

vi.mock("../src/config/db", () => ({ prisma: mockPrisma }));
vi.mock("../src/services/auth.service", () => ({
  authService: {
    login: authLogin,
    refresh: authRefresh,
    logout: authLogout,
  },
}));
vi.mock("../src/services/category.service", () => ({ categoryService }));
vi.mock("../src/services/menu.service", () => ({ menuService }));
vi.mock("../src/services/table.service", () => ({ tableService }));
vi.mock("../src/services/session.service", () => ({ sessionService }));
vi.mock("../src/services/order.service", () => ({ orderService }));
vi.mock("../src/services/kitchen.service", () => ({ kitchenService }));
vi.mock("../src/services/server.service", () => ({ serverService }));
vi.mock("../src/services/payment.service", () => ({ paymentService }));
vi.mock("../src/services/reports.service", () => ({ reportsService }));
vi.mock("../src/services/catering.service", () => ({ cateringService }));
vi.mock("../src/services/daily-menu.service", () => ({ dailyMenuService }));

const { app } = await import("../src/index");

const adminToken = jwt.sign(
  { userId: "admin-id", role: Role.ADMIN },
  process.env.JWT_SECRET!,
  staffSignOptions("15m"),
);
const kitchenToken = jwt.sign(
  { userId: "kitchen-id", role: Role.KITCHEN },
  process.env.JWT_SECRET!,
  staffSignOptions("15m"),
);
const serverToken = jwt.sign(
  { userId: "server-id", role: Role.SERVER },
  process.env.JWT_SECRET!,
  staffSignOptions("15m"),
);
const sessionToken = jwt.sign(
  { sessionId: "session-id", tableId: "table-id", tableNumber: "T1" },
  process.env.SESSION_JWT_SECRET!,
  sessionSignOptions("12h"),
);

const auth = (token: string) => `Bearer ${token}`;
const id = "11111111-1111-4111-8111-111111111111";

describe("Nati Nest backend API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.user.findUnique.mockImplementation(({ where }: { where: { id?: string } }) => ({
      id: where.id ?? "admin-id",
      name: "Staff",
      role:
        where.id === "kitchen-id" ? Role.KITCHEN : where.id === "server-id" ? Role.SERVER : Role.ADMIN,
      isActive: true,
    }));
    mockPrisma.tableSession.findUnique.mockResolvedValue({
      id: "session-id",
      tableId: "table-id",
      status: SessionStatus.ACTIVE,
    });
    mockPrisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
  });

  it("reports health with database connectivity", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
      database: "connected",
    });
  });

  it("reports degraded health when database connectivity fails", async () => {
    mockPrisma.$queryRaw.mockRejectedValueOnce(new Error("database down"));

    const response = await request(app).get("/health");

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      status: "degraded",
      database: "disconnected",
    });
  });

  it("authenticates successful and failed login attempts with safe messages", async () => {
    authLogin.mockResolvedValueOnce({
      token: "token",
      refreshToken: "refresh-token",
      user: { id: "admin-id", name: "Admin", phone: "9999999999", role: Role.ADMIN },
    });

    await request(app)
      .post("/api/auth/login")
      .send({ phone: "9999999999", password: "admin123" })
      .expect(200)
      .expect((response) => {
        expect(response.body.data.token).toBe("token");
        expect(response.body.data.refreshToken).toBe("refresh-token");
      });

    authLogin.mockRejectedValueOnce(Object.assign(new Error("Invalid credentials"), { statusCode: 401 }));
    await request(app)
      .post("/api/auth/login")
      .send({ phone: "9999999999", password: "wrong" })
      .expect(401)
      .expect((response) => {
        expect(response.body.message).toBe("Invalid credentials");
      });

    authLogin.mockRejectedValueOnce(Object.assign(new Error("Account inactive"), { statusCode: 403 }));
    await request(app)
      .post("/api/auth/login")
      .send({ phone: "9999999999", password: "admin123" })
      .expect(403)
      .expect((response) => {
        expect(response.body.message).toBe("Account inactive");
      });
  });

  it("does not expose Prisma or database errors on login", async () => {
    authLogin.mockRejectedValueOnce(
      Object.assign(new Error("PrismaClientInitializationError: Can't reach database server at db:5432"), {
        name: "PrismaClientInitializationError",
      }),
    );

    await request(app)
      .post("/api/auth/login")
      .send({ phone: "9999999999", password: "admin123" })
      .expect(500)
      .expect((response) => {
        expect(response.body.message).toBe("Server unavailable");
        expect(response.body.message).not.toContain("Prisma");
        expect(response.body.message).not.toContain("database server");
      });

    authLogin.mockRejectedValueOnce(new Error("Unexpected low-level stack details"));

    await request(app)
      .post("/api/auth/login")
      .send({ phone: "9999999999", password: "admin123" })
      .expect(500)
      .expect((response) => {
        expect(response.body.message).toBe("Unexpected error");
        expect(response.body.message).not.toContain("low-level");
      });
  });

  it("supports refresh token rotation and logout revocation endpoints", async () => {
    authRefresh.mockResolvedValueOnce({
      token: "new-token",
      refreshToken: "rotated-refresh-token",
      user: { id: "admin-id", name: "Admin", phone: "9999999999", role: Role.ADMIN },
    });
    authLogout.mockResolvedValueOnce({ revoked: true });

    await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "old-refresh-token" })
      .expect(200)
      .expect((response) => {
        expect(response.body.data.token).toBe("new-token");
        expect(response.body.data.refreshToken).toBe("rotated-refresh-token");
      });

    expect(authRefresh).toHaveBeenCalledWith("old-refresh-token");

    await request(app)
      .post("/api/auth/logout")
      .send({ refreshToken: "rotated-refresh-token" })
      .expect(200)
      .expect((response) => expect(response.body.data.revoked).toBe(true));

    expect(authLogout).toHaveBeenCalledWith("rotated-refresh-token");
  });

  it("rejects missing refresh token requests", async () => {
    await request(app).post("/api/auth/refresh").send({}).expect(400);
    await request(app).post("/api/auth/logout").send({}).expect(400);
  });

  it("enforces RBAC protection", async () => {
    await request(app).get("/api/staff").expect(401);
    await request(app).get("/api/staff").set("Authorization", auth(serverToken)).expect(403);
  });

  it("supports category CRUD routes", async () => {
    categoryService.createCategory.mockResolvedValue({ id, name: "Meals" });
    categoryService.getCategories.mockResolvedValue([{ id, name: "Meals" }]);
    categoryService.updateCategory.mockResolvedValue({ id, name: "Lunch" });
    categoryService.deleteCategory.mockResolvedValue(undefined);

    await request(app).post("/api/categories").set("Authorization", auth(adminToken)).send({ name: "Meals" }).expect(201);
    await request(app).get("/api/categories").expect(200);
    await request(app).put(`/api/categories/${id}`).set("Authorization", auth(adminToken)).send({ name: "Lunch" }).expect(200);
    await request(app).delete(`/api/categories/${id}`).set("Authorization", auth(adminToken)).expect(200);
  });

  it("supports menu item CRUD, image upload, and availability", async () => {
    menuService.createItem.mockResolvedValue({ id, name: "Tea" });
    menuService.getItems.mockResolvedValue({ items: [{ id, name: "Tea" }], pagination: { total: 1 } });
    menuService.updateItem.mockResolvedValue({ id, name: "Masala Tea" });
    menuService.updateAvailability.mockResolvedValue({ id, isAvailable: false });
    menuService.deleteItem.mockResolvedValue(undefined);

    await request(app)
      .post("/api/menu-items")
      .set("Authorization", auth(adminToken))
      .field("name", "Tea")
      .field("categoryId", id)
      .field("price", "20")
      .attach(
        "image",
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        { filename: "tea.png", contentType: "image/png" },
      )
      .expect(201);
    await request(app).get("/api/menu-items").expect(200);
    await request(app).put(`/api/menu-items/${id}`).set("Authorization", auth(adminToken)).field("name", "Masala Tea").expect(200);
    await request(app).patch(`/api/menu-items/${id}/availability`).set("Authorization", auth(adminToken)).send({ isAvailable: false }).expect(200);
    await request(app).delete(`/api/menu-items/${id}`).set("Authorization", auth(adminToken)).expect(200);
  });

  it("supports table CRUD and QR generation", async () => {
    tableService.createTable.mockResolvedValue({ id, tableNumber: "T1", qrCodeUrl: "data:image/png;base64,qr" });
    tableService.getAllTables.mockResolvedValue([{ id, tableNumber: "T1" }]);
    tableService.updateTable.mockResolvedValue({ id, tableNumber: "T2" });
    tableService.regenerateQRCode.mockResolvedValue({ id, qrCodeUrl: "data:image/png;base64,new" });
    tableService.deleteTable.mockResolvedValue(undefined);

    await request(app).post("/api/tables").set("Authorization", auth(adminToken)).send({ tableNumber: "T1" }).expect(201);
    await request(app).get("/api/tables").set("Authorization", auth(adminToken)).expect(200);
    await request(app).put(`/api/tables/${id}`).set("Authorization", auth(adminToken)).send({ tableNumber: "T2" }).expect(200);
    await request(app).patch(`/api/tables/${id}/qr`).set("Authorization", auth(adminToken)).expect(200);
    await request(app).delete(`/api/tables/${id}`).set("Authorization", auth(adminToken)).expect(200);
  });

  it("supports customer session, order placement, cancellation, and bill generation", async () => {
    sessionService.getOrCreateSession.mockResolvedValue({
      isNew: true,
      sessionToken: "session-token",
      session: { id: "session-id" },
      tableNumber: "T1",
    });
    orderService.createOrder.mockResolvedValue({ id, status: "PLACED" });
    orderService.cancelOrder.mockResolvedValue({ id, status: "CANCELLED" });
    serverService.getSessionBillSummary.mockResolvedValue({ totalAmount: 100, itemBreakdown: [] });

    await request(app).get("/api/customer/scan/table-id").expect(200);
    await request(app)
      .post("/api/customer/orders")
      .set("Authorization", auth(sessionToken))
      .send({ items: [{ menuItemId: id, quantity: 1 }] })
      .expect(201);
    await request(app).patch(`/api/customer/orders/${id}/cancel`).set("Authorization", auth(sessionToken)).expect(200);
    await request(app).get("/api/customer/bill").set("Authorization", auth(sessionToken)).expect(200);
  });

  it("supports kitchen order workflow", async () => {
    kitchenService.acceptOrder.mockResolvedValue({ id, status: "ACCEPTED" });
    kitchenService.startPreparing.mockResolvedValue({ id, status: "PREPARING" });
    kitchenService.markReady.mockResolvedValue({ id, status: "READY" });

    await request(app).patch(`/api/kitchen/orders/${id}/accept`).set("Authorization", auth(kitchenToken)).expect(200);
    await request(app).patch(`/api/kitchen/orders/${id}/preparing`).set("Authorization", auth(kitchenToken)).expect(200);
    await request(app).patch(`/api/kitchen/orders/${id}/ready`).set("Authorization", auth(kitchenToken)).expect(200);
  });

  it("supports server delivery and assistance resolution", async () => {
    serverService.markDelivered.mockResolvedValue({ id, status: "DELIVERED" });
    serverService.resolveAssistanceRequest.mockResolvedValue({ id, status: "RESOLVED" });

    await request(app).patch(`/api/server/orders/${id}/deliver`).set("Authorization", auth(serverToken)).expect(200);
    await request(app).patch(`/api/server/assistance/${id}/resolve`).set("Authorization", auth(serverToken)).expect(200);
  });

  it("supports customer assistance requests including PLATE type", async () => {
    serverService.createAssistanceRequest.mockResolvedValue({
      id: "assistance-1",
      requestType: "PLATE",
      status: "PENDING",
    });

    await request(app)
      .post("/api/customer/assistance")
      .set("Authorization", auth(sessionToken))
      .send({ requestType: "PLATE" })
      .expect(201);
  });

  it("supports payment request and verification", async () => {
    paymentService.createPaymentOnBillRequest.mockResolvedValue({
      isNew: true,
      payment: { id, totalAmount: 100, status: "PENDING" },
      billSummary: { totalAmount: 100 },
    });
    paymentService.verifyPayment.mockResolvedValue({
      payment: { id, session: { table: { tableNumber: "T1" } } },
    });

    await request(app).post("/api/payments/request-bill").set("Authorization", auth(sessionToken)).expect(201);
    await request(app).patch(`/api/payments/${id}/verify`).set("Authorization", auth(serverToken)).send({ paymentMethod: "CASH" }).expect(200);
  });

  it("supports reports dashboard, revenue, and orders", async () => {
    reportsService.getDashboardSummary.mockResolvedValue({ today: { orders: 1 } });
    reportsService.getRevenueSummary.mockResolvedValue({ summary: { totalRevenue: 100 } });
    reportsService.getOrderAnalytics.mockResolvedValue({ summary: { totalOrders: 1 } });

    await request(app).get("/api/reports/dashboard").set("Authorization", auth(adminToken)).expect(200);
    await request(app)
      .get("/api/reports/revenue")
      .query({ startDate: "2026-06-11", endDate: "2026-06-11", groupBy: "day" })
      .set("Authorization", auth(adminToken))
      .expect(200);
    await request(app)
      .get("/api/reports/orders")
      .query({ startDate: "2026-06-11", endDate: "2026-06-11", groupBy: "day" })
      .set("Authorization", auth(adminToken))
      .expect(200);
  });

  it("supports customer catering leads and admin follow-up", async () => {
    cateringService.createLead.mockResolvedValue({ id, name: "Ravi", status: "NEW" });
    cateringService.getLeads.mockResolvedValue({
      items: [{ id, name: "Ravi", phone: "9999999999", status: "NEW" }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    cateringService.getLead.mockResolvedValue({ id, name: "Ravi", status: "NEW" });
    cateringService.updateStatus.mockResolvedValue({ id, name: "Ravi", status: "CONTACTED" });
    cateringService.exportCsv.mockResolvedValue("Name,Phone\nRavi,9999999999");

    await request(app)
      .post("/api/catering/leads")
      .set("Authorization", auth(sessionToken))
      .send({
        name: "Ravi",
        phone: "9999999999",
        eventType: "SPORTS",
        eventDate: "2026-07-01",
        guestCount: 50,
        location: "Main hall",
      })
      .expect(201);

    await request(app).get("/api/catering/leads").set("Authorization", auth(adminToken)).expect(200);
    await request(app).get(`/api/catering/leads/${id}`).set("Authorization", auth(adminToken)).expect(200);
    await request(app)
      .patch(`/api/catering/leads/${id}/status`)
      .set("Authorization", auth(adminToken))
      .send({ status: "CONTACTED" })
      .expect(200);
    await request(app)
      .get("/api/catering/leads/export")
      .set("Authorization", auth(adminToken))
      .expect(200)
      .expect((response) => expect(response.text).toContain("Ravi"));
  });

  it("manages daily menu configuration and session history", async () => {
    dailyMenuService.getTodayMenu.mockResolvedValue({ date: "2026-06-13", items: [], count: 0 });
    dailyMenuService.getFullMenuWithStatus.mockResolvedValue({ date: "2026-06-13", categories: [] });
    dailyMenuService.addItemToToday.mockResolvedValue({ id, name: "Special Rice", addedAt: new Date() });
    dailyMenuService.removeItemFromToday.mockResolvedValue({ id, name: "Special Rice", removedAt: new Date() });
    dailyMenuService.getRemovedItems.mockResolvedValue({ date: "2026-06-13", items: [], count: 0 });
    dailyMenuService.restoreItem.mockResolvedValue({ id, name: "Special Rice", addedAt: new Date() });
    dailyMenuService.copyYesterdayMenu.mockResolvedValue({ copied: 5, skipped: 0, items: [] });
    dailyMenuService.getHistoryMenu.mockResolvedValue({ date: "2026-06-12", items: [], count: 0 });

    await request(app)
      .get("/api/daily-menu/today")
      .set("Authorization", auth(adminToken))
      .expect(200);

    await request(app)
      .get("/api/daily-menu/full")
      .set("Authorization", auth(adminToken))
      .expect(200);

    await request(app)
      .post("/api/daily-menu/add")
      .set("Authorization", auth(adminToken))
      .send({ menuItemId: id })
      .expect(201);

    await request(app)
      .delete(`/api/daily-menu/remove/${id}`)
      .set("Authorization", auth(adminToken))
      .send({ reason: "Out of stock", reasonType: "OUT_OF_STOCK" })
      .expect(200);

    await request(app)
      .get("/api/daily-menu/removed")
      .set("Authorization", auth(adminToken))
      .expect(200);

    await request(app)
      .post(`/api/daily-menu/restore/${id}`)
      .set("Authorization", auth(adminToken))
      .expect(200);

    await request(app)
      .post("/api/daily-menu/copy-yesterday")
      .set("Authorization", auth(adminToken))
      .expect(200);

    await request(app)
      .get("/api/daily-menu/history/2026-06-12")
      .set("Authorization", auth(adminToken))
      .expect(200);
  });
});
