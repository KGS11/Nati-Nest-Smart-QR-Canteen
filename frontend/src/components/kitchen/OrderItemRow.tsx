"use client";

import { KitchenOrderItem } from "@/types/kitchen.types";
import { MaterialIcon } from "@/components/stitch/MaterialIcon";

interface OrderItemRowProps {
  item: KitchenOrderItem;
  orderStatus?: string;
  onReject?: (reason: string) => void;
}

export function OrderItemRow({ item, orderStatus, onReject }: OrderItemRowProps) {
  const rejected = item.status === "REJECTED";

  const handleRejectClick = () => {
    if (!onReject) return;
    const reason = window.prompt(
      `Enter reason for rejecting "${item.name}":\n- Out of Stock\n- Ingredients Finished\n- Kitchen Closed\n- Other`
    );
    if (reason === null) return;
    if (reason.trim() === "") {
      alert("Rejection reason is required.");
      return;
    }
    onReject(reason);
  };

  return (
    <div className="py-3 flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={
              rejected
                ? "truncate text-xs md:text-sm font-medium text-red-400/60 line-through"
                : "truncate text-sm md:text-base font-medium text-zinc-100"
            }
          >
            {item.name}
          </span>
          {rejected ? (
            <span className="rounded bg-red-950 px-2 py-0.5 text-xs font-bold text-red-400">
              Unavailable
            </span>
          ) : null}
        </div>
        {item.specialInstructions ? (
          <p className="mt-1 text-xs italic text-zinc-500">
            Note: {item.specialInstructions}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-base font-bold text-amber-400">x{item.quantity}</span>
        
        {onReject && !rejected && (
          <button
            type="button"
            onClick={handleRejectClick}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all"
            title="Reject item"
            aria-label={`Reject ${item.name}`}
          >
            <MaterialIcon name="close" className="text-sm" />
          </button>
        )}
      </div>
    </div>
  );
}
