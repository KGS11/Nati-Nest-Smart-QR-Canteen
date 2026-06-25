"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import { KitchenOrder } from "@/types/kitchen.types";
import { OrderItemRow } from "./OrderItemRow";
import { OrderTimer } from "./OrderTimer";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/utils/cn";

interface OrderCardProps {
  order: KitchenOrder;
  onAccept?: (orderId: string) => Promise<void>;
  onAcceptAndPrepare?: (orderId: string) => Promise<void>;
  onPreparing?: (orderId: string) => Promise<void>;
  onReady?: (orderId: string) => Promise<void>;
  onRelease?: (orderId: string) => Promise<void>;
}

const accentClass: Record<KitchenOrder["status"], string> = {
  PLACED: "border-l-amber-500",
  ACCEPTED: "border-l-blue-500",
  PREPARING: "border-l-blue-400",
  READY: "border-l-green-500",
  PREPARED: "border-l-green-500",
};

const shortId = (orderId: string) => `#${orderId.replace(/-/g, "").slice(-4).toUpperCase()}`;

export function OrderCard({ order, onAccept, onAcceptAndPrepare, onPreparing, onReady, onRelease }: OrderCardProps) {
  const { user } = useAuthStore();
  const [isActioning, setIsActioning] = useState(false);
  const [isNew, setIsNew] = useState(
    Date.now() - new Date(order.placedAt).getTime() < 3000,
  );

  const isAssignedToMe = !order.assignedKitchenId || order.assignedKitchenId === user?.id;
  const isAssignedToOther = !!(order.assignedKitchenId && order.assignedKitchenId !== user?.id);

  useEffect(() => {
    if (!isNew) return;
    const timeoutId = window.setTimeout(() => setIsNew(false), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [isNew]);

  const runAction = async (action?: (orderId: string) => Promise<void>) => {
    if (!action || isActioning) return;
    setIsActioning(true);
    try {
      await action(order.id);
    } finally {
      setIsActioning(false);
    }
  };

  const handleRejectOrder = async () => {
    if (isActioning) return;
    const reason = window.prompt(
      `Enter reason for rejecting Table ${order.tableNumber} order:\n- Out of Stock\n- Ingredients Finished\n- Kitchen Closed\n- Other`
    );
    if (reason === null) return;
    if (reason.trim() === "") {
      alert("Rejection reason is required.");
      return;
    }

    setIsActioning(true);
    try {
      const { apiClient } = await import("@/lib/api-client");
      await apiClient.patch(`/kitchen/orders/${order.id}/reject`, { reason });
    } catch (err) {
      alert("Failed to reject order.");
    } finally {
      setIsActioning(false);
    }
  };

  const handleRejectItem = async (itemId: string, reason: string) => {
    setIsActioning(true);
    try {
      const { apiClient } = await import("@/lib/api-client");
      await apiClient.patch(`/kitchen/orders/${order.id}/items/${itemId}/reject`, { reason });
    } catch (err) {
      alert("Failed to reject order item.");
    } finally {
      setIsActioning(false);
    }
  };

  const activeItemCount = order.items
    .filter((item) => item.status === "ACTIVE")
    .reduce((sum, item) => sum + item.quantity, 0);

  const hasSpecialInstructions = order.items.some(
    (item) => item.specialInstructions && item.specialInstructions.trim() !== "",
  );

  return (
    <article
      className={cn(
        "rounded-xl border border-l-4 border-zinc-800 bg-zinc-900 p-4 md:p-5 shadow-lg shadow-black/20 transition-all duration-200",
        isAssignedToOther ? "border-l-zinc-700 opacity-60 saturate-50" : accentClass[order.status],
        isNew && !isAssignedToOther ? "animate-pulse ring-2 ring-amber-500/50" : "",
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-amber-400">Table {order.tableNumber}</h3>
          <div className="mt-1">
            <OrderTimer placedAt={order.placedAt} />
          </div>
        </div>
        <span className="text-xs font-semibold text-zinc-500">{shortId(order.id)}</span>
      </header>

      {hasSpecialInstructions && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-xs text-amber-400 mt-3 flex items-center gap-1.5 font-medium">
          <span>📝</span> Special instructions — check items below
        </div>
      )}

      {order.specialNotes && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 text-xs text-red-400 mt-3 flex items-start gap-1.5 font-bold">
          <span>⚠️</span>
          <div>
            <span className="uppercase text-[9px] tracking-wider block mb-0.5 text-red-500 font-extrabold">Waiter Note</span>
            <span>{order.specialNotes}</span>
          </div>
        </div>
      )}

      {order.assignedKitchenId && (
        <div className={cn(
          "rounded-xl p-2.5 text-xs font-semibold mt-3 flex items-center gap-1.5",
          isAssignedToOther
            ? "bg-zinc-800/50 border border-zinc-700 text-zinc-400"
            : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
        )}>
          <span>🍳</span>
          <span>
            {isAssignedToOther
              ? `Claimed by ${order.assignedKitchenName || 'another cook'}`
              : "Claimed by me"}
          </span>
        </div>
      )}

      <div className="my-4 border-t border-zinc-800" />

      <div className={cn("divide-y divide-zinc-800", isAssignedToOther && "pointer-events-none")}>
        {order.items.map((item) => (
          <OrderItemRow
            key={item.id}
            item={item}
            orderStatus={order.status}
            onReject={
              order.status !== "READY" && order.status !== "PREPARED" && item.status !== "REJECTED" && isAssignedToMe
                ? (reason) => handleRejectItem(item.id, reason)
                : undefined
            }
          />
        ))}
      </div>

      <footer className="mt-4 flex min-h-12 items-center justify-between gap-3">
        <span className="text-xs font-semibold text-zinc-400">
          {activeItemCount} {activeItemCount === 1 ? "item" : "items"}
        </span>

        <div className="flex gap-2">
          {isAssignedToOther ? (
            <span className="text-xs font-semibold text-zinc-500 self-center italic">
              Assigned to {order.assignedKitchenName}
            </span>
          ) : (
            <>
              {order.status !== "READY" && (
                <button
                  type="button"
                  disabled={isActioning}
                  onClick={handleRejectOrder}
                  className="min-h-[52px] md:min-h-[56px] rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-sm font-bold text-red-400 hover:bg-red-500/20 active:scale-[0.98] disabled:opacity-60"
                >
                  Reject
                </button>
              )}

              {order.status === "PLACED" ? (
                <button
                  type="button"
                  disabled={isActioning}
                  onClick={() => runAction(onAcceptAndPrepare ?? onAccept)}
                  className="min-h-[52px] md:min-h-[56px] rounded-lg bg-amber-500 px-4 text-sm font-bold text-zinc-950 active:scale-[0.98] disabled:opacity-60"
                >
                  {isActioning ? <Loader className="scale-50" /> : "Accept & Start Preparing"}
                </button>
              ) : null}

              {(order.status === "ACCEPTED" || order.status === "PREPARING") && onRelease ? (
                <button
                  type="button"
                  disabled={isActioning}
                  onClick={() => runAction(onRelease)}
                  className="min-h-[52px] md:min-h-[56px] rounded-lg border border-zinc-700 bg-zinc-800/30 px-3 text-sm font-bold text-zinc-350 hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60"
                >
                  {isActioning ? <Loader className="scale-50" /> : "Release"}
                </button>
              ) : null}

              {(order.status === "ACCEPTED" || order.status === "PREPARING") ? (
                <button
                  type="button"
                  disabled={isActioning}
                  onClick={() => runAction(onReady)}
                  className="min-h-[52px] md:min-h-[56px] rounded-lg bg-green-500 px-4 text-sm font-bold text-zinc-950 active:scale-[0.98] disabled:opacity-60"
                >
                  {isActioning ? <Loader className="scale-50" /> : "Mark Prepared"}
                </button>
              ) : null}
            </>
          )}
        </div>

        {(order.status === "READY" || order.status === "PREPARED") && !isAssignedToOther ? (
          <span className="text-xs font-semibold text-zinc-500">Awaiting delivery</span>
        ) : null}
      </footer>
    </article>
  );
}
