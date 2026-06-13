"use client";

import { KitchenOrder } from "@/types/kitchen.types";
import { OrderCard } from "./OrderCard";

interface KitchenColumnProps {
  title: string;
  orders: KitchenOrder[];
  accentColor: "amber" | "blue" | "green";
  emptyMessage: string;
  onAccept?: (orderId: string) => Promise<void>;
  onPreparing?: (orderId: string) => Promise<void>;
  onReady?: (orderId: string) => Promise<void>;
  flash?: boolean;
}

const badgeClass = {
  amber: "bg-amber-500/20 text-amber-400",
  blue: "bg-blue-500/20 text-blue-400",
  green: "bg-green-500/20 text-green-400",
};

const emptyIcon = {
  amber: "○",
  blue: "♨",
  green: "✓",
};

export function KitchenColumn({
  title,
  orders,
  accentColor,
  emptyMessage,
  onAccept,
  onPreparing,
  onReady,
  flash,
}: KitchenColumnProps) {
  return (
    <section className="relative flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-zinc-800 bg-zinc-950">
      {flash && (
        <div
          className="absolute inset-0 bg-amber-500/20 rounded-xl pointer-events-none z-25"
          style={{ animation: "flash-amber-pulse 0.5s ease-out forwards" }}
        />
      )}
      <style jsx>{`
        @keyframes flash-amber-pulse {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
      <header className="flex items-center justify-between p-4">
        <h2 className="font-semibold text-zinc-100">{title}</h2>
        <span
          key={orders.length}
          className={`animate-pulse rounded-full px-3 py-1 text-sm font-bold ${badgeClass[accentColor]}`}
        >
          {orders.length}
        </span>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {orders.length === 0 ? (
          <div className="flex h-full min-h-56 flex-col items-center justify-center text-center">
            <div className="text-4xl text-zinc-600">{emptyIcon[accentColor]}</div>
            <p className="mt-3 text-sm text-zinc-500">{emptyMessage}</p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onAccept={onAccept}
              onPreparing={onPreparing}
              onReady={onReady}
            />
          ))
        )}
      </div>
    </section>
  );
}
