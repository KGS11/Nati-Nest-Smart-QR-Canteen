"use client";

import { KitchenOrder } from "@/types/kitchen.types";
import { OrderCard } from "./OrderCard";

interface KitchenColumnProps {
  title: string;
  orders: KitchenOrder[];
  accentColor: "amber" | "blue" | "green";
  emptyMessage: string;
  onAccept?: (orderId: string) => Promise<void>;
  onAcceptAndPrepare?: (orderId: string) => Promise<void>;
  onPreparing?: (orderId: string) => Promise<void>;
  onReady?: (orderId: string) => Promise<void>;
  onRelease?: (orderId: string) => Promise<void>;
  flash?: boolean;
}

const badgeClass = {
  amber: "bg-warning-500/20 text-warning-400",
  blue: "bg-info-500/20 text-info-400",
  green: "bg-success-500/20 text-success-400",
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
  onAcceptAndPrepare,
  onPreparing,
  onReady,
  onRelease,
  flash,
}: KitchenColumnProps) {
  return (
    <section className="relative flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl border border-border-default bg-surface-raised shadow-inner">
      {flash && (
        <div
          className="absolute inset-0 bg-warning-500/20 rounded-2xl pointer-events-none z-25"
          style={{ animation: "flash-amber-pulse 0.5s ease-out forwards" }}
        />
      )}
      <style jsx>{`
        @keyframes flash-amber-pulse {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
      <header className="flex items-center justify-between p-4 border-b border-border-default">
        <h2 className="font-semibold text-display-sm text-text-primary">{title}</h2>
        <span
          key={orders.length}
          className={`animate-pulse rounded-full px-3 py-1 text-sm font-bold ${badgeClass[accentColor]}`}
        >
          {orders.length}
        </span>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {orders.length === 0 ? (
          <div className="flex h-full min-h-[224px] flex-col items-center justify-center text-center">
            <div className="text-display-2xl text-text-tertiary opacity-50">{emptyIcon[accentColor]}</div>
            <p className="mt-4 text-body-md font-medium text-text-secondary">{emptyMessage}</p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onAccept={onAccept}
              onAcceptAndPrepare={onAcceptAndPrepare}
              onPreparing={onPreparing}
              onReady={onReady}
              onRelease={onRelease}
            />
          ))
        )}
      </div>
    </section>
  );
}
