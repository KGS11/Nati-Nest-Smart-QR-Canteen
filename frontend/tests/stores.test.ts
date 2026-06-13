import { describe, expect, it, beforeEach } from "vitest";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useKitchenStore } from "@/stores/kitchenStore";
import { useServerStore } from "@/stores/serverStore";
import { Role } from "@/types";

const menuItem = {
  id: "item-1",
  categoryId: "category-1",
  name: "Masala Tea",
  description: "Hot tea",
  price: 25,
  isAvailable: true,
};

const kitchenOrder = {
  id: "order-1",
  orderNumber: "0043",
  status: "PLACED",
  tableNumber: "5",
  itemCount: 2,
  totalAmount: 50,
  placedAt: "2026-06-12T10:00:00.000Z",
  session: { id: "session-1", table: { tableNumber: "5" } },
  items: [],
};

const readyOrder = {
  id: "order-1",
  orderNumber: "0043",
  tableNumber: "5",
  sessionId: "session-1",
  itemCount: 2,
  placedAt: "2026-06-12T10:00:00.000Z",
  readyAt: "2026-06-12T10:10:00.000Z",
  items: [],
};

describe("Zustand stores", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useAuthStore.setState({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
    useKitchenStore.setState({
      orders: [],
      isLoading: false,
      error: null,
      isConnected: false,
      newOrderAlert: null,
    });
    useServerStore.setState({
      readyOrders: [],
      assistanceRequests: [],
      pendingPayments: [],
      isLoading: false,
      error: null,
      isConnected: false,
      activeModal: null,
    });
  });

  it("updates cart quantities, instructions, totals, and removal", () => {
    const cart = useCartStore.getState();

    cart.addItem(menuItem);
    cart.addItem(menuItem);
    cart.updateInstructions("item-1", "Less sugar");

    expect(useCartStore.getState().items).toEqual([
      expect.objectContaining({ id: "item-1", quantity: 2, instructions: "Less sugar" }),
    ]);
    expect(useCartStore.getState().totalItems()).toBe(2);
    expect(useCartStore.getState().totalAmount()).toBe(50);

    useCartStore.getState().updateQuantity("item-1", 0);
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("stores and clears staff access and refresh tokens", () => {
    useAuthStore
      .getState()
      .login("access-token", { id: "admin-id", name: "Admin", role: Role.ADMIN, phone: "999", isActive: true }, "refresh-token");

    expect(useAuthStore.getState()).toMatchObject({
      token: "access-token",
      refreshToken: "refresh-token",
      isAuthenticated: true,
    });

    useAuthStore.getState().logout();

    expect(useAuthStore.getState()).toMatchObject({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  });

  it("keeps kitchen orders deduplicated and filters by status", () => {
    useKitchenStore.getState().addOrder(kitchenOrder as never);
    useKitchenStore.getState().addOrder({ ...kitchenOrder, itemCount: 3 } as never);
    useKitchenStore.getState().updateOrderStatus("order-1", "READY" as never, {
      readyAt: "2026-06-12T10:12:00.000Z",
    });

    expect(useKitchenStore.getState().orders).toHaveLength(1);
    expect(useKitchenStore.getState().orders[0]).toMatchObject({
      itemCount: 3,
      status: "READY",
    });
    expect(useKitchenStore.getState().getOrdersByStatus(["READY" as never])).toHaveLength(1);
  });

  it("deduplicates server realtime entities and manages modal state", () => {
    const store = useServerStore.getState();

    store.addReadyOrder(readyOrder as never);
    store.addReadyOrder({ ...readyOrder, itemCount: 4 } as never);
    store.addAssistanceRequest({
      id: "assist-1",
      tableNumber: "5",
      requestType: "WATER",
      createdAt: "2026-06-12T10:00:00.000Z",
      sessionId: "session-1",
    } as never);
    store.addAssistanceRequest({
      id: "assist-1",
      tableNumber: "5",
      requestType: "BILL",
      createdAt: "2026-06-12T10:01:00.000Z",
      sessionId: "session-1",
    } as never);
    store.addPendingPayment({
      id: "payment-1",
      tableNumber: "5",
      sessionId: "session-1",
      amount: 120,
      requestedAt: "2026-06-12T10:00:00.000Z",
    } as never);
    store.addPendingPayment({
      id: "payment-1",
      tableNumber: "5",
      sessionId: "session-1",
      amount: 140,
      requestedAt: "2026-06-12T10:01:00.000Z",
    } as never);
    store.openModal({ type: "bill", sessionId: "session-1", tableNumber: "5" });

    expect(useServerStore.getState().readyOrders).toEqual([
      expect.objectContaining({ id: "order-1", itemCount: 4 }),
    ]);
    expect(useServerStore.getState().assistanceRequests).toEqual([
      expect.objectContaining({ id: "assist-1", requestType: "BILL" }),
    ]);
    expect(useServerStore.getState().pendingPayments).toEqual([
      expect.objectContaining({ id: "payment-1", amount: 140 }),
    ]);
    expect(useServerStore.getState().activeModal).toMatchObject({ type: "bill" });

    useServerStore.getState().closeModal();
    expect(useServerStore.getState().activeModal).toBeNull();
  });
});
