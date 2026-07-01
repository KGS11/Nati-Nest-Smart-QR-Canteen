"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Loader from "@/components/common/Loader";
import { MaterialIcon } from "@/components/stitch/MaterialIcon";
import { StatePanel } from "@/components/stitch/StatePanel";
import { useSocket } from "@/hooks/useSocket";
import { customerService } from "@/services/customerService";
import { useSessionStore } from "@/stores/sessionStore";
import { AssistanceType } from "@/types";
import { ClientApiError } from "@/types/api";
import { Order } from "@/types/domain";

// New components
import { OrderCard } from "@/components/customer/tracking/OrderCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/utils/cn";

export default function CustomerTrackPage() {
  const router = useRouter();
  const tableNumber = useSessionStore((state) => state.tableNumber);
  const { socket, isConnected } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [serviceBusy, setServiceBusy] = useState<AssistanceType | null>(null);

  const loadOrders = useCallback(async () => {
    setError(null);
    try {
      const data = await customerService.getOrders();
      setOrders(data.orders);
    } catch (err) {
      const clientError = err as ClientApiError;
      setError(clientError.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Sync data whenever socket reconnects to catch any missed events while offline
  useEffect(() => {
    if (isConnected) {
      loadOrders();
    }
  }, [isConnected, loadOrders]);

  // Set first order as auto-expanded on load
  useEffect(() => {
    if (orders.length > 0 && !expandedId) {
      setExpandedId(orders[0].id);
    }
  }, [orders, expandedId]);

  useEffect(() => {
    if (!socket) return;

    const refreshWithMessage = (text: string) => {
      setMessage(text);
      loadOrders();
    };
    const accepted = () => refreshWithMessage("Order accepted! Kitchen is on it.");
    const preparing = () => refreshWithMessage("Your order is being prepared.");
    const ready = () => refreshWithMessage("Order is ready!");
    const delivered = () => refreshWithMessage("Enjoy your meal!");
    const cancelled = (payload: any) => refreshWithMessage(payload.reason ? `Order cancelled: ${payload.reason}` : "Your order was cancelled.");
    const itemRejected = (payload: any) => refreshWithMessage(`Item unavailable: ${payload.name}.`);
    const itemCancelled = (payload: any) => refreshWithMessage(`Restaurant adjusted your bill: ${payload.name} cancelled.`);

    socket.on("order:accepted", accepted);
    socket.on("order:preparing", preparing);
    socket.on("order:ready", ready);
    socket.on("order:delivered", delivered);
    socket.on("order:cancelled", cancelled);
    socket.on("order:item_rejected", itemRejected);
    socket.on("order:item_cancelled", itemCancelled);

    return () => {
      socket.off("order:accepted", accepted);
      socket.off("order:preparing", preparing);
      socket.off("order:ready", ready);
      socket.off("order:delivered", delivered);
      socket.off("order:cancelled", cancelled);
      socket.off("order:item_rejected", itemRejected);
      socket.off("order:item_cancelled", itemCancelled);
    };
  }, [loadOrders, socket]);

  const cancelOrder = async (orderId: string) => {
    const previousOrders = orders;
    setCancellingId(orderId);
    setError(null);
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, status: "CANCELLED" as any } : order,
      ),
    );

    try {
      await customerService.cancelOrder(orderId);
      setMessage("Order cancelled.");
    } catch (err) {
      const clientError = err as ClientApiError;
      setOrders(previousOrders);
      setError(clientError.message || "Unable to cancel order.");
    } finally {
      setCancellingId(null);
    }
  };

  const requestService = async (requestType: AssistanceType) => {
    setServiceBusy(requestType);
    setMessage(null);
    setError(null);
    try {
      const response = await customerService.requestAssistance(requestType);
      setMessage(response.message || "Request sent. A server will assist you shortly.");
    } catch (err) {
      const clientError = err as ClientApiError;
      setError(clientError.message || "Unable to send request.");
    } finally {
      setServiceBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <Loader label="Tracking your orders..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base px-4 py-6 pb-28 text-text-primary">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-500 font-bold text-surface-base">
            {tableNumber ?? "--"}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-xs text-text-secondary">Nati Nest</p>
              <span
                className={cn(
                  "h-2 w-2 rounded-full inline-block",
                  isConnected ? "bg-semantic_success-500 animate-pulse" : "bg-text-muted"
                )}
                title={isConnected ? "Connected to server" : "Offline"}
              />
            </div>
            <h1 className="text-xl font-bold text-text-primary">Your Orders</h1>
          </div>
        </div>
        <Link
          href="/customer/menu"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-raised text-accent-400 hover:text-accent-300"
        >
          <MaterialIcon name="restaurant_menu" />
        </Link>
      </header>

      {/* Notifications */}
      <div className="space-y-4">
        {error ? <StatePanel tone="error" title="Tracking issue" message={error} /> : null}
        {message ? (
          <div className="rounded-xl border border-accent-500/20 bg-accent-500/10 p-3 text-xs text-accent-500">
            {message}
          </div>
        ) : null}

        {orders.length ? (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isExpanded={expandedId === order.id}
              onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
              onCancel={cancelOrder}
              cancellingId={cancellingId}
            />
          ))
        ) : (
          <EmptyState
            icon=""
            title="No active orders"
            description="Items you place from the menu will appear here."
            action={{
              label: "Browse Menu",
              onClick: () => router.push("/customer/menu"),
            }}
          />
        )}
      </div>

      {/* Bottom Fixed Assistance Quick Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border-primary bg-surface-base/95 backdrop-blur-md p-4 flex gap-3 z-30 max-w-md mx-auto pb-safe">
        <button
          type="button"
          onClick={() => requestService(AssistanceType.WATER)}
          disabled={Boolean(serviceBusy)}
          className="flex-1 h-12 rounded-xl border border-border-primary hover:border-border-secondary bg-surface-raised/50 flex items-center justify-center gap-2 text-text-primary font-semibold active:scale-95 transition-all text-xs disabled:opacity-50"
        >
          <MaterialIcon name={serviceBusy === AssistanceType.WATER ? "sync" : "water_drop"} className={serviceBusy === AssistanceType.WATER ? "animate-spin" : ""} />
          Water 
        </button>
        <button
          type="button"
          onClick={() => requestService(AssistanceType.PLATE)}
          disabled={Boolean(serviceBusy)}
          className="flex-1 h-12 rounded-xl border border-border-primary hover:border-border-secondary bg-surface-raised/50 flex items-center justify-center gap-2 text-text-primary font-semibold active:scale-95 transition-all text-xs disabled:opacity-50"
        >
          <MaterialIcon name={serviceBusy === AssistanceType.PLATE ? "sync" : "restaurant"} className={serviceBusy === AssistanceType.PLATE ? "animate-spin" : ""} />
          Plate
        </button>
        <button
          type="button"
          onClick={() => requestService(AssistanceType.GENERAL)}
          disabled={Boolean(serviceBusy)}
          className="flex-1 h-12 rounded-xl border border-border-primary hover:border-border-secondary bg-surface-raised/50 flex items-center justify-center gap-2 text-text-primary font-semibold active:scale-95 transition-all text-xs disabled:opacity-50"
        >
          <MaterialIcon name={serviceBusy === AssistanceType.GENERAL ? "sync" : "support_agent"} className={serviceBusy === AssistanceType.GENERAL ? "animate-spin" : ""} />
          Help 
        </button>
      </div>
    </div>
  );
}
