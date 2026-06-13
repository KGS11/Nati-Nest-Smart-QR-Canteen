"use client";

import { KitchenOrderItem } from "@/types/kitchen.types";

interface OrderItemRowProps {
  item: KitchenOrderItem;
}

export function OrderItemRow({ item }: OrderItemRowProps) {
  const rejected = item.status === "REJECTED";

  return (
    <div className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
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
        <span className="shrink-0 text-base font-bold text-amber-400">x{item.quantity}</span>
      </div>
    </div>
  );
}
