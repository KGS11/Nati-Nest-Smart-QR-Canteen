"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/common/Button";
import Loader from "@/components/common/Loader";
import { useSocketContext } from "@/context/SocketContext";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/authStore";
import { useKitchenStore } from "@/stores/kitchenStore";
import { ApiResponse, ClientApiError } from "@/types/api";
import { Order } from "@/types/domain";
import {
  KitchenOrder,
  KitchenOrderItem,
  OrderCancelledPayload,
  OrderNewSocketPayload,
  OrderStatusUpdatedPayload,
} from "@/types/kitchen.types";
import { KitchenColumn } from "./KitchenColumn";
import { KitchenConnectionStatus } from "./KitchenConnectionStatus";
import { NewOrderToast } from "./NewOrderToast";
import KitchenMenuModal from "./KitchenMenuModal";

// New imports
import { useAudioAlert } from "@/hooks/useAudioAlert";
import { AudioAlert } from "./AudioAlert";
import { SummaryBar } from "./SummaryBar";
import { cn } from "@/utils/cn";
import { OrderCardSkeleton } from "@/components/ui/Skeleton";

interface KitchenOrdersResponse {
  orders: Order[];
  counts: {
    placed: number;
    accepted: number;
    preparing: number;
    total: number;
  };
}

interface SocketErrorPayload {
  message?: string;
}

const toKitchenItem = (item: Order["items"][number]): KitchenOrderItem => ({
  id: item.id,
  menuItemId: item.menuItem.id,
  name: item.menuItem.name,
  quantity: item.quantity,
  unitPrice: item.unitPrice,
  specialInstructions: item.specialInstructions ?? item.notes ?? null,
  status: item.status === "REJECTED" ? "REJECTED" : "ACTIVE",
});

const toKitchenOrder = (order: Order): KitchenOrder | null => {
  if (
    order.status !== "PLACED" &&
    order.status !== "ACCEPTED" &&
    order.status !== "PREPARING"
  ) {
    return null;
  }

  const items = order.items.map(toKitchenItem);

  return {
    id: order.id,
    status: order.status,
    tableNumber: order.session.table.tableNumber,
    placedAt: order.placedAt,
    acceptedAt: order.acceptedAt ?? null,
    preparingAt: order.preparingAt ?? null,
    readyAt: order.readyAt ?? null,
    items,
    subtotal:
      order.subtotal ??
      items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    specialNotes: (order as any).specialNotes ?? null,
    assignedKitchenId: order.assignedKitchenId ?? null,
    assignedKitchenName: order.assignedKitchenName ?? null,
  };
};

const normalizeOrders = (orders: Order[]) =>
  orders.map(toKitchenOrder).filter((order): order is KitchenOrder => order !== null);

export function KitchenBoard() {
  const { socket, isConnected } = useSocketContext();
  const { user, token, logout } = useAuthStore();
  const [actionError, setActionError] = useState<string | null>(null);

  // Audio & flash state
  const { isEnabled, setEnabled, playNewOrderAlert } = useAudioAlert();
  const [flashIncoming, setFlashIncoming] = useState(false);
  const [activeTab, setActiveTab] = useState<"PLACED" | "IN_PROGRESS">("PLACED");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"available" | "my-orders">("available");

  const isConnectedStore = useKitchenStore((s) => s.isConnected);
  const isLoading = useKitchenStore((s) => s.isLoading);
  const error = useKitchenStore((s) => s.error);
  const newOrderAlert = useKitchenStore((s) => s.newOrderAlert);
  const orders = useKitchenStore((s) => s.orders);

  const setConnected = useKitchenStore((s) => s.setConnected);
  const setLoading = useKitchenStore((s) => s.setLoading);
  const setError = useKitchenStore((s) => s.setError);
  const setOrders = useKitchenStore((s) => s.setOrders);
  const removeOrder = useKitchenStore((s) => s.removeOrder);
  const updateOrderStatus = useKitchenStore((s) => s.updateOrderStatus);
  const setNewOrderAlert = useKitchenStore((s) => s.setNewOrderAlert);
  const getOrdersByStatus = useKitchenStore((s) => s.getOrdersByStatus);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<ApiResponse<KitchenOrdersResponse>>("/kitchen/orders");
      setOrders(normalizeOrders(response.data.data.orders));
    } catch (error) {
      const clientError = error as ClientApiError;
      setError(clientError.message || "Unable to load kitchen orders.");
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setConnected(isConnected);
  }, [isConnected, setConnected]);

  useEffect(() => {
    if (!socket) return;

    const joinKitchen = () => {
      if (token) {
        socket.emit("kitchen:join", { staffToken: token });
      }
    };

    const handleJoined = () => setConnected(true);
    const handleError = (payload: SocketErrorPayload) => {
      setConnected(false);
      setActionError(payload.message || "Kitchen socket error.");
    };
    const handleNewOrder = (payload: OrderNewSocketPayload) => {
      setNewOrderAlert({ orderId: payload.orderId, tableNumber: payload.tableNumber });
      playNewOrderAlert();
      setFlashIncoming(true);
      setTimeout(() => setFlashIncoming(false), 500);
      fetchOrders();
    };
    const handleStatusUpdated = (payload: OrderStatusUpdatedPayload & { assignedKitchenId?: string | null; assignedKitchenName?: string | null }) => {
      if (
        payload.status === "PREPARED" ||
        payload.status === "READY" ||
        payload.status === "DELIVERED" ||
        payload.status === "PAID" ||
        payload.status === "CANCELLED"
      ) {
        removeOrder(payload.orderId);
        return;
      }

      updateOrderStatus(payload.orderId, payload.status, {
        acceptedAt: payload.acceptedAt,
        preparingAt: payload.preparingAt,
        readyAt: payload.readyAt,
        assignedKitchenId: payload.assignedKitchenId,
        assignedKitchenName: payload.assignedKitchenName,
      });
    };
    const handleCancelled = (payload: OrderCancelledPayload) => {
      removeOrder(payload.orderId);
    };
    const handleClaimedKitchen = (payload: {
      orderId: string;
      assignedKitchenId: string;
      assignedKitchenName: string;
      status: KitchenOrder["status"];
    }) => {
      updateOrderStatus(payload.orderId, payload.status, {
        assignedKitchenId: payload.assignedKitchenId,
        assignedKitchenName: payload.assignedKitchenName,
      });
    };
    const handleReleased = (payload: {
      orderId: string;
      role: string;
      status: KitchenOrder["status"];
    }) => {
      if (payload.role === "KITCHEN") {
        updateOrderStatus(payload.orderId, payload.status, {
          assignedKitchenId: null,
          assignedKitchenName: null,
          acceptedAt: null,
          preparingAt: null,
        });
      }
    };
    const handleConnect = () => {
      setConnected(true);
      joinKitchen();
      fetchOrders();
    };
    const handleDisconnect = () => setConnected(false);

    const handleNotesUpdated = () => {
      fetchOrders();
    };

    joinKitchen();
    socket.on("kitchen:joined", handleJoined);
    socket.on("error", handleError);
    socket.on("order:new", handleNewOrder);
    socket.on("order:status_updated", handleStatusUpdated);
    socket.on("order:cancelled", handleCancelled);
    socket.on("order:auto_cancelled", handleCancelled);
    socket.on("order:notes_updated", handleNotesUpdated);
    socket.on("order:claimed:kitchen", handleClaimedKitchen);
    socket.on("order:released", handleReleased);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("kitchen:joined", handleJoined);
      socket.off("error", handleError);
      socket.off("order:new", handleNewOrder);
      socket.off("order:status_updated", handleStatusUpdated);
      socket.off("order:cancelled", handleCancelled);
      socket.off("order:auto_cancelled", handleCancelled);
      socket.off("order:notes_updated", handleNotesUpdated);
      socket.off("order:claimed:kitchen", handleClaimedKitchen);
      socket.off("order:released", handleReleased);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [fetchOrders, socket, token, setConnected, setNewOrderAlert, removeOrder, updateOrderStatus]);

  useEffect(() => {
    if (!newOrderAlert) return;
    const timeoutId = window.setTimeout(() => setNewOrderAlert(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [newOrderAlert, setNewOrderAlert]);

  useEffect(() => {
    if (!actionError) return;
    const timeoutId = window.setTimeout(() => setActionError(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [actionError]);

  const allIncoming = getOrdersByStatus(["PLACED"]);
  const allPreparing = getOrdersByStatus(["ACCEPTED", "PREPARING"]);

  const incoming = viewMode === "available" ? allIncoming : [];
  const preparing = viewMode === "available"
    ? allPreparing
    : allPreparing.filter((o) => o.assignedKitchenId === user?.id);

  const myActiveClaimsCount = useMemo(() => {
    return allPreparing.filter((o) => o.assignedKitchenId === user?.id).length;
  }, [allPreparing, user?.id]);

  // Browser tab title update
  useEffect(() => {
    const totalPending = allIncoming.length + allPreparing.length;
    document.title = totalPending > 0
      ? `(${totalPending}) Kitchen — Nati Nest`
      : "Kitchen — Nati Nest";
  }, [allIncoming.length, allPreparing.length]);

  const updateWithOptimism = async (
    orderId: string,
    status: KitchenOrder["status"],
    timestamps: Partial<Pick<KitchenOrder, "acceptedAt" | "preparingAt" | "readyAt" | "assignedKitchenId" | "assignedKitchenName">>,
    request: () => Promise<unknown>,
    errorMessage: string,
  ) => {
    const previousOrders = useKitchenStore.getState().orders;

    try {
      updateOrderStatus(orderId, status, timestamps);
      await request();
    } catch (error) {
      const clientError = error as ClientApiError;
      setOrders(previousOrders);
      setActionError(clientError.message || errorMessage);
    }
  };

  const handleAccept = (orderId: string) =>
    updateWithOptimism(
      orderId,
      "ACCEPTED",
      {
        acceptedAt: new Date().toISOString(),
        assignedKitchenId: user?.id,
        assignedKitchenName: user?.name,
      },
      () => apiClient.patch(`/kitchen/orders/${orderId}/accept`),
      "Failed to accept order.",
    );

  const handleAcceptAndPrepare = (orderId: string) =>
    updateWithOptimism(
      orderId,
      "PREPARING",
      {
        acceptedAt: new Date().toISOString(),
        preparingAt: new Date().toISOString(),
        assignedKitchenId: user?.id,
        assignedKitchenName: user?.name,
      },
      () => apiClient.patch(`/kitchen/orders/${orderId}/accept-and-prepare`),
      "Failed to accept order.",
    );

  const handlePrepared = (orderId: string) =>
    updateWithOptimism(
      orderId,
      "PREPARED",
      { readyAt: new Date().toISOString() },
      () => apiClient.patch(`/kitchen/orders/${orderId}/prepared`),
      "Failed to mark order prepared.",
    );

  const handleRelease = (orderId: string) =>
    updateWithOptimism(
      orderId,
      "PLACED",
      {
        assignedKitchenId: null,
        assignedKitchenName: null,
        acceptedAt: null,
        preparingAt: null,
      },
      () => apiClient.patch(`/kitchen/orders/${orderId}/release`),
      "Failed to release order.",
    );

  const columns = useMemo(
    () => [
      {
        title: "New Orders",
        orders: incoming,
        accentColor: "amber" as const,
        emptyMessage: "No new orders",
        onAccept: handleAccept,
        onAcceptAndPrepare: handleAcceptAndPrepare,
      },
      {
        title: "In Progress",
        orders: preparing,
        accentColor: "blue" as const,
        emptyMessage: "Nothing cooking",
        onReady: handlePrepared,
        onRelease: handleRelease,
      },
    ],
    [incoming, preparing, user?.id],
  );

  return (
    <div className="min-h-screen bg-zinc-955 text-zinc-100">
      {/* Mobile/Tablet Portrait Layout */}
      <div className="flex h-screen flex-col md:hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4">
          <h1 className="text-lg font-bold text-zinc-100">Kitchen</h1>
          <div className="flex items-center gap-3">
            <AudioAlert isEnabled={isEnabled} onToggle={setEnabled} />
            <Button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="min-h-10 text-xs px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold border-0"
            >
              Menu
            </Button>
            <Button type="button" variant="secondary" onClick={logout} className="min-h-10 text-xs px-3 py-1">
              Logout
            </Button>
          </div>
        </header>

        {/* View Mode Switcher for Mobile */}
        <div className="flex bg-zinc-900 px-4 py-2 border-b border-zinc-855 shrink-0 gap-2">
          <button
            onClick={() => setViewMode("available")}
            className={cn(
              "flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all",
              viewMode === "available"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "border-zinc-800 text-zinc-400 hover:text-zinc-300"
            )}
          >
            Available
          </button>
          <button
            onClick={() => setViewMode("my-orders")}
            className={cn(
              "flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all",
              viewMode === "my-orders"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "border-zinc-800 text-zinc-400 hover:text-zinc-300"
            )}
          >
            My Claims ({myActiveClaimsCount})
          </button>
        </div>

        {/* Horizontal Tab Bar */}
        <div className="grid grid-cols-2 bg-zinc-900 border-b border-zinc-800 shrink-0 text-center text-sm font-semibold relative z-10">
          <button
            onClick={() => setActiveTab("PLACED")}
            className={cn(
              "py-3 border-b-2 transition-colors focus:outline-none",
              activeTab === "PLACED" ? "border-amber-500 text-amber-400" : "border-transparent text-zinc-500"
            )}
          >
            New Orders ({incoming.length})
          </button>
          <button
            onClick={() => setActiveTab("IN_PROGRESS")}
            className={cn(
              "py-3 border-b-2 transition-colors focus:outline-none",
              activeTab === "IN_PROGRESS" ? "border-amber-500 text-amber-400" : "border-transparent text-zinc-500"
            )}
          >
            In Progress ({preparing.length})
          </button>
        </div>

        {/* Active Column */}
        <div className="flex-1 overflow-hidden p-3 flex flex-col">
          {isLoading ? (
            <div className="flex-1 space-y-4 overflow-y-auto">
              <OrderCardSkeleton />
              <OrderCardSkeleton />
              <OrderCardSkeleton />
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <p className="text-red-450 text-sm text-center">{error}</p>
              <Button type="button" onClick={fetchOrders} className="mt-4 min-h-10">
                Retry
              </Button>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col">
              {activeTab === "PLACED" && (
                <KitchenColumn
                  title="New Orders"
                  orders={incoming}
                  accentColor="amber"
                  emptyMessage={viewMode === "my-orders" ? "Claimed orders will show here" : "No new orders"}
                  onAccept={handleAccept}
                  flash={flashIncoming}
                />
              )}
              {activeTab === "IN_PROGRESS" && (
                <KitchenColumn
                  title="In Progress"
                  orders={preparing}
                  accentColor="blue"
                  emptyMessage="Nothing cooking"
                  onReady={handlePrepared}
                  onRelease={handleRelease}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop/Landscape Tablet Layout */}
      <div className="hidden md:flex h-screen flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-zinc-100">Kitchen Dashboard</h1>
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850">
              <button
                type="button"
                onClick={() => setViewMode("available")}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                  viewMode === "available"
                    ? "bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20"
                    : "text-zinc-400 hover:text-zinc-300"
                )}
              >
                Available Orders
              </button>
              <button
                type="button"
                onClick={() => setViewMode("my-orders")}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                  viewMode === "my-orders"
                    ? "bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20"
                    : "text-zinc-400 hover:text-zinc-300"
                )}
              >
                My Claims ({myActiveClaimsCount})
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <AudioAlert isEnabled={isEnabled} onToggle={setEnabled} />
            <Button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="min-h-12 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold border-0"
            >
              Manage Menu
            </Button>
            <KitchenConnectionStatus isConnected={isConnectedStore} />
            <span className="text-sm font-medium text-zinc-400">{user?.name ?? "Kitchen Staff"}</span>
            <Button type="button" variant="secondary" onClick={logout} className="min-h-12">
              Logout
            </Button>
          </div>
        </header>

        <SummaryBar
          placedCount={allIncoming.length}
          preparingCount={allPreparing.length}
          readyCount={0}
          totalCount={allIncoming.length + allPreparing.length}
        />

        {isLoading ? (
          <main className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4">
            <div className="flex-1 space-y-4">
              <div className="h-6 w-24 bg-zinc-800 rounded animate-pulse mb-3" />
              <OrderCardSkeleton />
              <OrderCardSkeleton />
            </div>
            <div className="flex-1 space-y-4">
              <div className="h-6 w-24 bg-zinc-800 rounded animate-pulse mb-3" />
              <OrderCardSkeleton />
              <OrderCardSkeleton />
            </div>
          </main>
        ) : null}

        {!isLoading && error ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
              <p className="text-red-450">{error}</p>
              <Button type="button" onClick={fetchOrders} className="mt-4 min-h-12">
                Retry
              </Button>
            </div>
          </div>
        ) : null}

        {!isLoading && !error ? (
          <main className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4">
            {columns.map((column) => (
              <KitchenColumn
                key={column.title}
                title={column.title}
                orders={column.orders}
                accentColor={column.accentColor}
                emptyMessage={column.emptyMessage}
                onAccept={column.onAccept}
                onReady={column.onReady}
                onRelease={column.onRelease}
                flash={column.title === "New Orders" ? flashIncoming : undefined}
              />
            ))}
          </main>
        ) : null}
      </div>

      {newOrderAlert ? (
        <NewOrderToast
          tableNumber={newOrderAlert.tableNumber}
          onDismiss={() => setNewOrderAlert(null)}
        />
      ) : null}

      {actionError ? (
        <button
          type="button"
          onClick={() => setActionError(null)}
          className="fixed bottom-4 left-1/2 z-50 min-h-12 -translate-x-1/2 rounded-lg border border-red-500/30 bg-red-950 px-4 text-sm font-semibold text-red-300 shadow-xl"
        >
          {actionError}
        </button>
      ) : null}

      {isMenuOpen && (
        <KitchenMenuModal onClose={() => setIsMenuOpen(false)} />
      )}
    </div>
  );
}
