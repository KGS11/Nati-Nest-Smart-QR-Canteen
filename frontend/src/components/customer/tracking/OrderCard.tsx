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
    PLACED: "border-l-4 border-l-zinc-500",
    ACCEPTED: "border-l-4 border-l-blue-500",
    PREPARING: "border-l-4 border-l-amber-500",
    READY: "border-l-4 border-l-green-500",
    DELIVERED: "border-l-4 border-l-green-400",
    PAID: "border-l-4 border-l-green-500",
    CANCELLED: "border-l-4 border-l-red-500",
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "PLACED":
        return "default";
      case "ACCEPTED":
        return "info";
      case "PREPARING":
        return "warning";
      case "READY":
      case "DELIVERED":
      case "PAID":
        return "success";
      case "CANCELLED":
        return "danger";
      default:
        return "default";
    }
  };

  const totalItemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      className={cn(
        "bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden transition-all shadow-sm mb-4",
        borderStyles[status] || "border-l-4 border-l-zinc-800"
      )}
    >
      <div
        onClick={onToggle}
        className="p-4 flex justify-between items-center cursor-pointer select-none hover:bg-zinc-850/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm text-zinc-100">
            Order #{shortId}
          </span>
          <Badge variant={getBadgeVariant(status)} size="sm" pulse={status === "PREPARING"}>
            {status}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-medium">
            {totalItemCount} {totalItemCount === 1 ? "item" : "items"}
          </span>
          <span
            className={cn(
              "text-zinc-400 transition-transform duration-200",
              isExpanded && "rotate-180"
            )}
          >
            <MaterialIcon name="keyboard_arrow_down" className="text-xl" />
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 space-y-6">
          <OrderStatusTimeline
            status={status}
            placedAt={order.placedAt}
            acceptedAt={order.acceptedAt ?? null}
            preparingAt={order.preparingAt ?? null}
            readyAt={order.readyAt ?? null}
            deliveredAt={order.deliveredAt ?? null}
          />

          <div className="border-t border-zinc-800 pt-4">
            <h4 className="text-xs font-bold text-zinc-450 text-zinc-400 uppercase tracking-wider mb-2">
              Items Ordered
            </h4>
            <div className="space-y-3">
              {order.items.map((item) => {
                const isItemRejected = item.status === "REJECTED";
                return (
                  <div key={item.id} className="space-y-2">
                    <div className="flex justify-between items-start text-xs text-zinc-300">
                      <div className="min-w-0 pr-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={cn("font-medium", isItemRejected ? "text-red-400/70 line-through" : "text-zinc-100")}>
                            {item.menuItem?.name}
                          </span>
                          {isItemRejected && (
                            <span className="rounded bg-red-950 px-1.5 py-0.5 text-[9px] font-bold text-red-400 uppercase tracking-wide">
                              Unavailable
                            </span>
                          )}
                        </div>
                        {item.specialInstructions && (
                          <p className="text-[10px] text-zinc-500 italic mt-0.5">
                            Note: "{item.specialInstructions}"
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-zinc-400 font-medium whitespace-nowrap">
                        {item.quantity} x ₹{Number(item.unitPrice).toFixed(2)}
                      </span>
                    </div>

                    {isItemRejected && (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400 space-y-2">
                        <p className="leading-relaxed">
                          <strong>Sorry, this item is currently unavailable.</strong>
                          {item.rejectionReason && (
                            <span className="block mt-1 text-zinc-400 italic">
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
