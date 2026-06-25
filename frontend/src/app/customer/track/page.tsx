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

    socket.on("order:accepted", accepted);
    socket.on("order:preparing", preparing);
    socket.on("order:ready", ready);
    socket.on("order:delivered", delivered);
    socket.on("order:cancelled", cancelled);
    socket.on("order:item_rejected", itemRejected);

    return () => {
      socket.off("order:accepted", accepted);
      socket.off("order:preparing", preparing);
      socket.off("order:ready", ready);
      socket.off("order:delivered", delivered);
      socket.off("order:cancelled", cancelled);
      socket.off("order:item_rejected", itemRejected);
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader label="Tracking your orders..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 pb-28">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 font-bold text-zinc-950">
            {tableNumber ?? "--"}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-xs text-zinc-400">Nati Nest</p>
              <span
                className={cn(
                  "h-2 w-2 rounded-full inline-block",
                  isConnected ? "bg-green-500 animate-pulse" : "bg-zinc-600"
                )}
                title={isConnected ? "Connected to server" : "Offline"}
              />
            </div>
            <h1 className="text-xl font-bold text-zinc-100">Your Orders</h1>
          </div>
        </div>
        <Link
          href="/customer/menu"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-amber-400 hover:text-amber-300"
        >
          <MaterialIcon name="restaurant_menu" />
        </Link>
      </header>

      {/* Notifications */}
      <div className="space-y-4">
        {error ? <StatePanel tone="error" title="Tracking issue" message={error} /> : null}
        {message ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-400">
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
      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-900 bg-zinc-950/95 backdrop-blur-md p-4 flex gap-3 z-30 max-w-md mx-auto pb-safe">
        <button
          type="button"
          onClick={() => requestService(AssistanceType.WATER)}
          disabled={Boolean(serviceBusy)}
          className="flex-1 h-12 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 flex items-center justify-center gap-2 text-zinc-300 font-semibold active:scale-95 transition-all text-xs disabled:opacity-50"
        >
          <MaterialIcon name={serviceBusy === AssistanceType.WATER ? "sync" : "water_drop"} className={serviceBusy === AssistanceType.WATER ? "animate-spin" : ""} />
          Water 
        </button>
        <button
          type="button"
          onClick={() => requestService(AssistanceType.PLATE)}
          disabled={Boolean(serviceBusy)}
          className="flex-1 h-12 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 flex items-center justify-center gap-2 text-zinc-300 font-semibold active:scale-95 transition-all text-xs disabled:opacity-50"
        >
          <MaterialIcon name={serviceBusy === AssistanceType.PLATE ? "sync" : "restaurant"} className={serviceBusy === AssistanceType.PLATE ? "animate-spin" : ""} />
          Plate
        </button>
        <button
          type="button"
          onClick={() => requestService(AssistanceType.GENERAL)}
          disabled={Boolean(serviceBusy)}
          className="flex-1 h-12 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 flex items-center justify-center gap-2 text-zinc-300 font-semibold active:scale-95 transition-all text-xs disabled:opacity-50"
        >
          <MaterialIcon name={serviceBusy === AssistanceType.GENERAL ? "sync" : "support_agent"} className={serviceBusy === AssistanceType.GENERAL ? "animate-spin" : ""} />
          Help 
        </button>
      </div>
    </div>
  );
}
