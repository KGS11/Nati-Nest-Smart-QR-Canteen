"use client";

import { Order } from "@/types/domain";
import { Badge } from "@/components/ui/Badge";
import { OrderStatusTimeline } from "./OrderStatusTimeline";
import { cn } from "@/utils/cn";
import { MaterialIcon } from "@/components/stitch/MaterialIcon";
import Link from "next/link";

interface OrderCardProps {
  order: Order;
  isExpanded: boolean;
  onToggle: () => void;
  onCancel?: (orderId: string) => void;
  cancellingId?: string | null;
}

export function OrderCard({
  order,
  isExpanded,
  onToggle,
  onCancel,
  cancellingId,
}: OrderCardProps) {
  const shortId = order.id.slice(-6).toUpperCase();
  const status = order.status;

  const borderStyles = {
    PLACED: "border-l-4 border-l-border-strong",
    ACCEPTED: "border-l-4 border-l-info-500",
    PREPARING: "border-l-4 border-l-accent-500",
    READY: "border-l-4 border-l-semantic_success-500",
    PREPARED: "border-l-4 border-l-semantic_success-500",
    DELIVERED: "border-l-4 border-l-semantic_success-400",
    PAID: "border-l-4 border-l-semantic_success-500",
    CANCELLED: "border-l-4 border-l-red-500",
  };

  const getBadgeVariant = (status: string): "default" | "brand" | "secondary" | "outline" | "destructive" | "success" | "warning" => {
    switch (status) {
      case "PLACED":
        return "default";
      case "ACCEPTED":
        return "brand";
      case "PREPARING":
        return "warning";
      case "READY":
      case "PREPARED":
      case "DELIVERED":
      case "PAID":
        return "success";
      case "CANCELLED":
        return "destructive";
      default:
        return "default";
    }
  };

  const totalItemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      className={cn(
        "bg-surface-raised border border-border-primary rounded-2xl overflow-hidden transition-all shadow-sm mb-4",
        borderStyles[status] || "border-l-4 border-l-border-primary"
      )}
    >
      <div
        onClick={onToggle}
        className="p-4 flex justify-between items-center cursor-pointer select-none hover:bg-surface-overlay/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm text-text-primary">
            Order #{shortId}
          </span>
          <Badge variant={getBadgeVariant(status)} className={status === "PREPARING" ? "animate-pulse" : undefined}>
            {status}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary font-medium">
            {totalItemCount} {totalItemCount === 1 ? "item" : "items"}
          </span>
          <span
            className={cn(
              "text-text-secondary transition-transform duration-200",
              isExpanded && "rotate-180"
            )}
          >
            <MaterialIcon name="keyboard_arrow_down" className="text-xl" />
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-border-primary bg-surface-raised/50 space-y-6">
          <OrderStatusTimeline
            status={status}
            placedAt={order.placedAt}
            acceptedAt={order.acceptedAt ?? null}
            preparingAt={order.preparingAt ?? null}
            readyAt={order.readyAt ?? null}
            deliveredAt={order.deliveredAt ?? null}
          />

          <div className="border-t border-border-primary pt-4">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              Items Ordered
            </h4>
            <div className="space-y-3">
              {order.items.map((item) => {
                const isItemRejected = item.status === "REJECTED";
                const isAdminCancelled = item.status === "CANCELLED_BY_ADMIN";
                const itemAmount = Number(item.originalAmount ?? Number(item.unitPrice) * item.quantity);
                return (
                  <div key={item.id} className="space-y-2">
                    <div className="flex justify-between items-start text-xs text-text-secondary">
                      <div className="min-w-0 pr-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              "font-medium",
                              (isItemRejected || isAdminCancelled)
                                ? "text-red-400/70 line-through"
                                : "text-text-primary",
                            )}
                          >
                            {item.menuItem?.name}
                          </span>
                          {isItemRejected && (
                            <span className="rounded bg-red-950 px-1.5 py-0.5 text-[9px] font-bold text-red-400 uppercase tracking-wide">
                              Unavailable
                            </span>
                          )}
                          {isAdminCancelled && (
                            <span className="rounded bg-red-950 px-1.5 py-0.5 text-[9px] font-bold text-red-400 uppercase tracking-wide">
                              Cancelled by Restaurant
                            </span>
                          )}
                        </div>
                        {item.specialInstructions && (
                          <p className="text-[10px] text-text-tertiary italic mt-0.5">
                            Note: "{item.specialInstructions}"
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-text-secondary font-medium whitespace-nowrap",
                          isAdminCancelled && "line-through text-red-400/70",
                        )}
                      >
                        {item.quantity} x ₹{Number(item.unitPrice).toFixed(2)}
                      </span>
                    </div>

                    {isItemRejected && (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400 space-y-2">
                        <p className="leading-relaxed">
                          <strong>Sorry, this item is currently unavailable.</strong>
                          {item.rejectionReason && (
                            <span className="block mt-1 text-text-secondary italic">
                              Reason: "{item.rejectionReason}"
                            </span>
                          )}
                        </p>
                        <div className="flex gap-2">
                          <Link
                            href="/customer/menu"
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold px-3 py-1.5 rounded-lg text-[10px] active:scale-95 transition-all inline-block"
                          >
                            Replace Item / Return to Menu
                          </Link>
                        </div>
                      </div>
                    )}

                    {isAdminCancelled && (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400 space-y-1.5">
                        <p className="font-bold">Cancelled By Restaurant</p>
                        {item.cancellationReason && (
                          <p className="text-text-secondary italic">
                            Reason: {item.cancellationReason.replaceAll("_", " ")}
                          </p>
                        )}
                        {item.cancellationNotes && (
                          <p className="text-text-secondary italic">Notes: {item.cancellationNotes}</p>
                        )}
                        <p className="font-semibold">Amount deducted: -₹{itemAmount.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cancel Order Button */}
          {status === "PLACED" && onCancel && (
            <button
              type="button"
              onClick={() => onCancel(order.id)}
              disabled={cancellingId === order.id}
              className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 font-semibold text-sm text-red-400 hover:bg-red-500/20 active:scale-95 transition-all disabled:opacity-60"
            >
              <MaterialIcon name={cancellingId === order.id ? "sync" : "cancel"} className={cancellingId === order.id ? "animate-spin" : ""} />
              {cancellingId === order.id ? "Cancelling..." : "Cancel Order"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
