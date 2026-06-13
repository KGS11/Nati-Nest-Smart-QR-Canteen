"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import { KitchenOrder } from "@/types/kitchen.types";
import { OrderItemRow } from "./OrderItemRow";
import { OrderTimer } from "./OrderTimer";

interface OrderCardProps {
  order: KitchenOrder;
  onAccept?: (orderId: string) => Promise<void>;
  onPreparing?: (orderId: string) => Promise<void>;
  onReady?: (orderId: string) => Promise<void>;
}

const accentClass: Record<KitchenOrder["status"], string> = {
  PLACED: "border-l-amber-500",
  ACCEPTED: "border-l-blue-500",
  PREPARING: "border-l-blue-400",
  READY: "border-l-green-500",
};

const shortId = (orderId: string) => `#${orderId.replace(/-/g, "").slice(-4).toUpperCase()}`;

export function OrderCard({ order, onAccept, onPreparing, onReady }: OrderCardProps) {
  const [isActioning, setIsActioning] = useState(false);
  const [isNew, setIsNew] = useState(
    Date.now() - new Date(order.placedAt).getTime() < 3000,
  );

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

  const activeItemCount = order.items
    .filter((item) => item.status === "ACTIVE")
    .reduce((sum, item) => sum + item.quantity, 0);

  const hasSpecialInstructions = order.items.some(
    (item) => item.specialInstructions && item.specialInstructions.trim() !== "",
  );

  return (
    <article
      className={[
        "rounded-xl border border-l-4 border-zinc-800 bg-zinc-900 p-4 md:p-5 shadow-lg shadow-black/20",
        accentClass[order.status],
        isNew ? "animate-pulse ring-2 ring-amber-500/50" : "",
      ].join(" ")}
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

      <div className="my-4 border-t border-zinc-800" />

      <div className="divide-y divide-zinc-800">
        {order.items.map((item) => (
          <OrderItemRow key={item.id} item={item} />
        ))}
      </div>

      <footer className="mt-4 flex min-h-12 items-center justify-between gap-3">
        <span className="text-xs font-semibold text-zinc-400">
          {activeItemCount} {activeItemCount === 1 ? "item" : "items"}
        </span>

        {order.status === "PLACED" ? (
          <button
            type="button"
            disabled={isActioning}
            onClick={() => runAction(onAccept)}
            className="min-h-[52px] md:min-h-[56px] rounded-lg bg-amber-500 px-4 text-sm font-bold text-zinc-950 active:scale-[0.98] disabled:opacity-60"
          >
            {isActioning ? <Loader className="scale-50" /> : "Accept"}
          </button>
        ) : null}

        {order.status === "ACCEPTED" ? (
          <button
            type="button"
            disabled={isActioning}
            onClick={() => runAction(onPreparing)}
            className="min-h-[52px] md:min-h-[56px] rounded-lg bg-blue-500 px-4 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-60"
          >
            {isActioning ? <Loader className="scale-50" /> : "Start Preparing"}
          </button>
        ) : null}

        {order.status === "PREPARING" ? (
          <button
            type="button"
            disabled={isActioning}
            onClick={() => runAction(onReady)}
            className="min-h-[52px] md:min-h-[56px] rounded-lg bg-green-500 px-4 text-sm font-bold text-zinc-950 active:scale-[0.98] disabled:opacity-60"
          >
            {isActioning ? <Loader className="scale-50" /> : "Mark Ready"}
          </button>
        ) : null}

        {order.status === "READY" ? (
          <span className="text-xs font-semibold text-zinc-500">Awaiting delivery</span>
        ) : null}
      </footer>
    </article>
  );
}
