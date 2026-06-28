"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import { KitchenOrder } from "@/types/kitchen.types";
import { OrderItemRow } from "./OrderItemRow";
import { OrderTimer } from "./OrderTimer";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/utils/cn";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface OrderCardProps {
  order: KitchenOrder;
  onAccept?: (orderId: string) => Promise<void>;
  onAcceptAndPrepare?: (orderId: string) => Promise<void>;
  onPreparing?: (orderId: string) => Promise<void>;
  onReady?: (orderId: string) => Promise<void>;
  onRelease?: (orderId: string) => Promise<void>;
}

const accentClass: Record<KitchenOrder["status"], string> = {
  PLACED: "border-l-[6px] border-l-warning-500",
  ACCEPTED: "border-l-[6px] border-l-info-500",
  PREPARING: "border-l-[6px] border-l-info-400",
  READY: "border-l-[6px] border-l-success-500",
  PREPARED: "border-l-[6px] border-l-success-500",
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
    <Card
      className={cn(
        "rounded-2xl border bg-surface-base p-4 md:p-5 shadow-md transition-all duration-200 overflow-hidden relative",
        isAssignedToOther ? "border-l-border-default opacity-60 saturate-50" : accentClass[order.status],
        isNew && !isAssignedToOther ? "animate-pulse shadow-[0_0_0_2px_rgba(234,117,15,0.5)]" : "",
      )}
    >
      <header className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h3 className="text-display-md font-bold text-text-primary">Table {order.tableNumber}</h3>
          <div className="mt-1">
            <OrderTimer placedAt={order.placedAt} />
          </div>
        </div>
        <Badge variant="outline" className="text-label-xs text-text-tertiary">{shortId(order.id)}</Badge>
      </header>

      {hasSpecialInstructions && (
        <div className="bg-warning-500/10 border border-warning-500/20 rounded-lg p-2.5 text-label-sm text-warning-400 mt-3 flex items-center gap-2 font-medium">
          <span>📝</span> Special instructions — check items
        </div>
      )}

      {order.specialNotes && (
        <div className="bg-semantic_error-500/10 border border-semantic_error-500/20 rounded-lg p-2.5 text-label-sm text-semantic_error-400 mt-3 flex items-start gap-2 font-bold">
          <span>⚠️</span>
          <div>
            <span className="uppercase text-label-xs tracking-wider block mb-0.5 text-semantic_error-400 font-extrabold">Waiter Note</span>
            <span>{order.specialNotes}</span>
          </div>
        </div>
      )}

      {order.assignedKitchenId && (
        <div className={cn(
          "rounded-lg p-2.5 text-label-sm font-semibold mt-3 flex items-center gap-2",
          isAssignedToOther
            ? "bg-surface-raised border border-border-default text-text-secondary"
            : "bg-info-500/10 border border-info-500/20 text-info-400"
        )}>
          <span>🍳</span>
          <span>
            {isAssignedToOther
              ? `Claimed by ${order.assignedKitchenName || 'another cook'}`
              : "Claimed by me"}
          </span>
        </div>
      )}

      <div className="my-4 border-t border-border-default" />

      <div className={cn("divide-y divide-border-default", isAssignedToOther && "pointer-events-none")}>
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

      <footer className="mt-4 flex flex-wrap min-h-12 items-center justify-between gap-3">
        <span className="text-label-sm font-semibold text-text-tertiary">
          {activeItemCount} {activeItemCount === 1 ? "item" : "items"}
        </span>

        <div className="flex gap-2 w-full md:w-auto">
          {isAssignedToOther ? (
            <span className="text-label-sm font-semibold text-text-tertiary self-center italic">
              Assigned to {order.assignedKitchenName}
            </span>
          ) : (
            <>
              {order.status !== "READY" && (
                <Button
                  variant="destructive"
                  disabled={isActioning}
                  onClick={handleRejectOrder}
                  className="min-h-[48px] w-full md:w-auto text-label-md px-4"
                >
                  Reject
                </Button>
              )}

              {order.status === "PLACED" ? (
                <Button
                  variant="brand"
                  disabled={isActioning}
                  onClick={() => runAction(onAcceptAndPrepare ?? onAccept)}
                  className="min-h-[48px] w-full md:w-auto text-label-md px-6"
                >
                  {isActioning ? <Loader className="scale-50" /> : "Accept & Start"}
                </Button>
              ) : null}

              {(order.status === "ACCEPTED" || order.status === "PREPARING") && onRelease ? (
                <Button
                  variant="outline"
                  disabled={isActioning}
                  onClick={() => runAction(onRelease)}
                  className="min-h-[48px] w-full md:w-auto text-label-md px-4"
                >
                  {isActioning ? <Loader className="scale-50" /> : "Release"}
                </Button>
              ) : null}

              {(order.status === "ACCEPTED" || order.status === "PREPARING") ? (
                <Button
                  variant="brand"
                  disabled={isActioning}
                  onClick={() => runAction(onReady)}
                  className="min-h-[48px] w-full md:w-auto text-label-md px-6"
                >
                  {isActioning ? <Loader className="scale-50" /> : "Mark Prepared"}
                </Button>
              ) : null}
            </>
          )}
        </div>

        {(order.status === "READY" || order.status === "PREPARED") && !isAssignedToOther ? (
          <Badge variant="secondary">Awaiting delivery</Badge>
        ) : null}
      </footer>
    </Card>
  );
}
