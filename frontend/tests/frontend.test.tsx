import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCartStore } from "@/stores/cartStore";

const mocks = vi.hoisted(() => {
  const apiClient = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  const customerService = {
    getMenu: vi.fn(),
    getOrders: vi.fn(),
    getBill: vi.fn(),
    getPaymentStatus: vi.fn(),
    getFeedbackStatus: vi.fn(),
    placeOrder: vi.fn(),
    cancelOrder: vi.fn(),
    requestAssistance: vi.fn(),
    requestBill: vi.fn(),
    submitFeedback: vi.fn(),
    createCateringLead: vi.fn(),
  };
  return { apiClient, customerService };
});

vi.mock("@/lib/api-client", () => ({
  apiClient: mocks.apiClient,
  default: mocks.apiClient,
}));

vi.mock("@/services/customerService", () => ({
  customerService: mocks.customerService,
}));

vi.mock("@/hooks/useSocket", () => ({
  useSocket: () => ({ socket: null, isConnected: false }),
}));

const apiGetResponse = (url: string) => {
  if (url === "/kitchen/orders") {
    return Promise.resolve({ data: { data: { orders: [], counts: { total: 0 } } } });
  }
  if (url === "/server/orders/ready") {
    return Promise.resolve({ data: { data: { orders: [] } } });
  }
  if (url === "/server/assistance") {
    return Promise.resolve({ data: { data: { requests: [] } } });
  }
  if (url === "/payments/pending") {
    return Promise.resolve({ data: { data: { payments: [] } } });
  }
  if (url === "/categories") {
    return Promise.resolve({ data: { data: [] } });
  }
  if (String(url).startsWith("/menu-items")) {
    return Promise.resolve({
      data: { data: { items: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 1 } } },
    });
  }
  if (url === "/staff") {
    return Promise.resolve({
      data: { data: { items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } } },
    });
  }
  if (url === "/settings") {
    return Promise.resolve({
      data: {
        data: {
          businessName: "Nati Nest",
          businessPhone: "",
          businessAddress: "",
          taxRate: 0,
          notificationsEnabled: false,
          logoUrl: "",
          upiQrUrl: "",
        },
      },
    });
  }
  if (url === "/catering/enquiries") {
    return Promise.resolve({
      data: {
        data: {
          items: [
            {
              id: "lead-id",
              name: "Ravi",
              phone: "9999999999",
              eventType: "SPORTS",
              eventDate: "2026-07-01T00:00:00.000Z",
              guestCount: 50,
              location: "Main hall",
              status: "NEW",
              createdAt: "2026-06-13T00:00:00.000Z",
              updatedAt: "2026-06-13T00:00:00.000Z",
            },
          ],
        },
      },
    });
  }
  return Promise.resolve({ data: { data: {} } });
};

describe("frontend critical screens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.apiClient.get.mockImplementation(apiGetResponse);
    mocks.apiClient.post.mockResolvedValue({
      data: {
        data: {
          token: "token",
          refreshToken: "refresh-token",
          user: { id: "admin-id", name: "Admin", role: "ADMIN", phone: "9999999999" },
        },
      },
    });
    mocks.customerService.getMenu.mockResolvedValue([
      {
        id: "category-id",
        name: "Meals",
        items: [
          {
            id: "item-id",
            categoryId: "category-id",
            name: "Tea",
            description: "Hot tea",
            price: 20,
            isAvailable: true,
          },
        ],
      },
    ]);
    mocks.customerService.getOrders.mockResolvedValue({ orders: [], count: 0 });
    mocks.customerService.createCateringLead.mockResolvedValue({ id: "lead-id" });
    useCartStore.getState().clearCart();
  });

  it("renders the login page", async () => {
    const LoginPage = (await import("@/app/(auth)/login/page")).default;
    render(<LoginPage />);
    expect(screen.getByText("Staff Login")).toBeInTheDocument();
  });

  it("renders customer menu and uses the cart store", async () => {
    const CustomerMenuPage = (await import("@/app/customer/menu/page")).default;
    render(<CustomerMenuPage />);

    await waitFor(() => expect(screen.getByText("Tea")).toBeInTheDocument());
    useCartStore.getState().addItem({
      id: "item-id",
      name: "Tea",
      price: 20,
      categoryId: "category-id",
      isAvailable: true,
    });
    expect(useCartStore.getState().totalItems()).toBe(1);
    expect(useCartStore.getState().totalAmount()).toBe(20);
  });

  it("renders order tracking", async () => {
    const CustomerTrackPage = (await import("@/app/customer/track/page")).default;
    render(<CustomerTrackPage />);
    await waitFor(() => expect(screen.getByText("Your Orders")).toBeInTheDocument());
  });

  it("renders kitchen dashboard", async () => {
    const { KitchenBoard } = await import("@/components/kitchen/KitchenBoard");
    render(<KitchenBoard />);
    await waitFor(() => expect(screen.getByText("Kitchen Dashboard")).toBeInTheDocument());
  });

  it("renders server dashboard", async () => {
    const ServerBoard = (await import("@/components/server/ServerBoard")).default;
    render(<ServerBoard />);
    await waitFor(() => expect(screen.getByText("Server Dashboard")).toBeInTheDocument());
  });

  it("renders admin menu pages", async () => {
    const CategoryList = (await import("@/components/admin/menu/CategoryList")).default;
    const { unmount } = render(<CategoryList />);
    await waitFor(() => expect(screen.getByText("Menu Categories")).toBeInTheDocument());
    unmount();

    const MenuItemList = (await import("@/components/admin/menu/MenuItemList")).default;
    render(<MenuItemList />);
    await waitFor(() => expect(screen.getByText("Menu Items")).toBeInTheDocument());
  });

  it("renders admin staff", async () => {
    const AdminStaffPage = (await import("@/app/(dashboards)/admin/staff/page")).default;
    render(<AdminStaffPage />);
    await waitFor(() => expect(screen.getByText("Staff Management")).toBeInTheDocument());
  });

  it("renders admin settings", async () => {
    const AdminSettingsPage = (await import("@/app/(dashboards)/admin/settings/page")).default;
    render(<AdminSettingsPage />);
    await waitFor(() => expect(screen.getByText("Settings")).toBeInTheDocument());
    expect(screen.getByText("Save Settings")).toBeInTheDocument();
  });

  it("renders catering request and admin lead screens", async () => {
    const CustomerCateringPage = (await import("@/app/customer/catering/page")).default;
    const { unmount } = render(<CustomerCateringPage />);
    expect(screen.getByText("Plan a catering event")).toBeInTheDocument();
    unmount();

    const AdminCateringPage = (await import("@/app/(dashboards)/admin/catering/page")).default;
    render(<AdminCateringPage />);
    await waitFor(() => expect(screen.getByText("Catering Enquiries")).toBeInTheDocument());
    expect(screen.getByText("Ravi")).toBeInTheDocument();
  });
});
