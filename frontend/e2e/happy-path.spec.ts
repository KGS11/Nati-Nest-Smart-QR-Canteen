import { expect, Page, test } from "@playwright/test";

const hasSeededE2e =
  Boolean(process.env.E2E_TABLE_ID) &&
  Boolean(process.env.E2E_ADMIN_PHONE) &&
  Boolean(process.env.E2E_ADMIN_PASSWORD);

const apiResponse = (data: unknown, message = "OK") => ({
  success: true,
  message,
  data,
});

async function seedMockCustomerSession(page: Page) {
  await page.evaluate(() => {
    sessionStorage.setItem(
      "nati-nest-customer-session",
      JSON.stringify({
        state: {
          sessionToken: "mock-session-token",
          sessionId: "mock-session-id",
          tableNumber: "5",
        },
        version: 0,
      }),
    );
  });
}

async function seedMockStaffAuth(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem(
      "nati-nest-staff-auth",
      JSON.stringify({
        state: {
          token: "mock-admin-token",
          refreshToken: "mock-refresh-token",
          user: {
            id: "admin-1",
            name: "Admin",
            phone: "9999999999",
            role: "ADMIN",
            isActive: true,
          },
          isAuthenticated: true,
        },
        version: 0,
      }),
    );
  });
}

async function installMockApi(page: Page) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api/, "");
    const method = request.method();

    if (path.startsWith("/customer/scan/")) {
      return route.fulfill({
        json: apiResponse({
          sessionToken: "mock-session-token",
          sessionId: "mock-session-id",
          tableNumber: "5",
          isNew: true,
        }),
      });
    }

    if (path === "/customer/menu") {
      return route.fulfill({
        json: apiResponse({
          categories: [
            {
              id: "cat-1",
              name: "Snacks",
              items: [
                {
                  id: "item-1",
                  categoryId: "cat-1",
                  name: "Masala Dosa",
                  description: "Crisp dosa with chutney",
                  price: 80,
                  isAvailable: true,
                  isPopular: true,
                  category: { id: "cat-1", name: "Snacks" },
                },
              ],
            },
          ],
        }),
      });
    }

    if (path === "/customer/orders" && method === "POST") {
      return route.fulfill({
        status: 201,
        json: apiResponse({
          order: {
            id: "order-1",
            status: "PLACED",
            placedAt: new Date().toISOString(),
            session: { table: { tableNumber: "5" } },
            items: [],
          },
        }),
      });
    }

    if (path === "/customer/orders") {
      return route.fulfill({
        json: apiResponse({
          count: 1,
          orders: [
            {
              id: "order-1",
              status: "PLACED",
              placedAt: new Date().toISOString(),
              session: { table: { tableNumber: "5" } },
              items: [
                {
                  id: "oi-1",
                  quantity: 1,
                  unitPrice: 80,
                  specialInstructions: "Less spicy",
                  status: "ACTIVE",
                  menuItem: { id: "item-1", name: "Masala Dosa" },
                },
              ],
            },
          ],
        }),
      });
    }

    if (path === "/customer/bill") {
      return route.fulfill({
        json: apiResponse({
          tableNumber: "5",
          totalAmount: 80,
          itemBreakdown: [{ name: "Masala Dosa", quantity: 1, unitPrice: 80, subtotal: 80 }],
        }),
      });
    }

    if (path === "/payments/status") {
      return route.fulfill({ json: apiResponse({ payment: null }) });
    }

    if (path === "/customer/assistance" || path === "/payments/request-bill") {
      return route.fulfill({
        status: method === "POST" ? 201 : 200,
        json: apiResponse({
          payment: { id: "payment-1", totalAmount: 80, status: "PENDING" },
          billSummary: {
            tableNumber: "5",
            totalAmount: 80,
            itemBreakdown: [{ name: "Masala Dosa", quantity: 1, unitPrice: 80, subtotal: 80 }],
          },
        }, "Request sent"),
      });
    }

    if (path === "/settings/upi-qr") {
      return route.fulfill({ json: apiResponse({ upiQrUrl: "" }) });
    }

    if (path === "/feedback/status") {
      return route.fulfill({ json: apiResponse({ submitted: false, feedback: null }) });
    }

    if (path === "/feedback" && method === "POST") {
      return route.fulfill({
        status: 201,
        json: apiResponse({
          feedback: { id: "feedback-1", rating: 5, comment: null, createdAt: new Date().toISOString() },
        }),
      });
    }

    if (path === "/auth/login") {
      return route.fulfill({
        json: apiResponse({
          token: "mock-admin-token",
          refreshToken: "mock-refresh-token",
          user: { id: "admin-1", name: "Admin", phone: "9999999999", role: "ADMIN", isActive: true },
        }),
      });
    }

    if (path === "/reports/dashboard") {
      return route.fulfill({
        json: apiResponse({
          today: { orders: 1, revenue: 80 },
          thisWeek: { orders: 1, revenue: 80 },
          allTime: {
            totalOrders: 1,
            totalRevenue: 80,
            totalTables: 8,
            totalFeedback: 1,
            overallAvgRating: 5,
          },
          liveStatus: {
            pendingOrders: 0,
            preparingOrders: 0,
            readyOrders: 0,
            occupiedTables: 1,
            activeSessions: 1,
          },
        }),
      });
    }

    if (path === "/reports/popular-items") {
      return route.fulfill({
        json: apiResponse({
          items: [
            {
              menuItemId: "item-1",
              name: "Masala Dosa",
              totalQuantitySold: 1,
              totalRevenue: 80,
            },
          ],
        }),
      });
    }

    if (path === "/kitchen/orders") {
      return route.fulfill({ json: apiResponse({ orders: [], counts: { placed: 0, accepted: 0, preparing: 0, total: 0 } }) });
    }

    if (path === "/server/orders/ready") {
      return route.fulfill({ json: apiResponse({ orders: [], count: 0 }) });
    }

    if (path === "/server/assistance") {
      return route.fulfill({ json: apiResponse({ requests: [] }) });
    }

    if (path === "/payments/pending") {
      return route.fulfill({ json: apiResponse({ payments: [], count: 0 }) });
    }

    return route.fulfill({ json: apiResponse({}) });
  });
}

test.describe("Nati Nest happy path", () => {
  test("customer order, payment, feedback, and staff dashboards", async ({ page }) => {
    if (!hasSeededE2e) {
      await installMockApi(page);
    }

    const tableId = process.env.E2E_TABLE_ID ?? "mock-table-id";
    const adminPhone = process.env.E2E_ADMIN_PHONE ?? "9999999999";
    const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "admin123";

    await page.goto(`/scan/${tableId}`);
    await expect(page.getByText(/Opening Nati Nest|Table 5/i)).toBeVisible();
    await page.waitForURL("**/customer/menu");
    if (!hasSeededE2e) {
      await seedMockCustomerSession(page);
    }

    await page.getByRole("button", { name: /^add$/i }).first().click();
    await page.getByRole("button", { name: /view cart/i }).click();
    await page.getByRole("button", { name: /place order/i }).click();
    await page.getByRole("button", { name: /confirm/i }).click();
    await page.waitForURL("**/customer/track");
    await expect(page.getByText(/Your Orders/i)).toBeVisible();

    if (!hasSeededE2e) {
      await seedMockCustomerSession(page);
    }
    await page.goto("/customer/bill");
    await expect(page.getByText(/Your Bill/i)).toBeVisible();
    await page.waitForTimeout(1000);
    await page.getByText("Pay with Cash").first().click();
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByRole("button", { name: /notify waiter/i }).click();
    await expect(page.getByText(/Waiter has been notified|Payment Pending/i)).toBeVisible();

    if (!hasSeededE2e) {
      await seedMockCustomerSession(page);
    }
    await page.goto("/customer/feedback");
    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: /5 star/i }).click();
    await page.getByRole("button", { name: /submit feedback/i }).click();
    await expect(page.getByText(/Thank you|great rating/i)).toBeVisible();

    if (!hasSeededE2e) {
      await seedMockStaffAuth(page);
      await page.goto("/admin");
    } else {
      await page.goto("/login");
      await page.getByLabel(/phone/i).fill(adminPhone);
      await page.getByRole("textbox", { name: /staff password/i }).fill(adminPassword);
      await page.getByRole("button", { name: /sign in|login/i }).click();
      await page.waitForURL("**/admin");
    }
    await expect(page.getByText("Admin Panel")).toBeVisible();

    await page.goto("/kitchen");
    await expect(page.getByRole("heading", { name: "Kitchen Dashboard" })).toBeVisible();

    await page.goto("/server");
    await expect(page.getByText(/Waiter Dashboard/i)).toBeVisible();
  });
});
