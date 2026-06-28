import { OrderStatus } from "@/types";
import { Order } from "@/types/domain";

interface KitchenOrderCardProps {
  order: Order;
  busy?: boolean;
  isNew?: boolean;
  onAccept: (orderId: string) => void;
  onReady: (orderId: string) => void;
}

const elapsedMinutes = (date: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));

const timeTone = (minutes: number) => {
  if (minutes < 5) return "bg-semantic_success-500/15 text-semantic_success-400";
  if (minutes <= 10) return "bg-accent-500/15 text-accent-400";
  return "bg-semantic_error-500/15 text-semantic_error-400";
};

const timeLabel = (minutes: number) => {
  if (minutes <= 0) return "Just now";
  if (minutes === 1) return "1 min ago";
  return `${minutes} mins ago`;
};

const shortOrderId = (id: string) => `#${id.replace(/-/g, "").slice(-4).toUpperCase()}`;

export function KitchenOrderCard({
  order,
  busy,
  isNew,
  onAccept,
  onReady,
}: KitchenOrderCardProps) {
  const minutes = elapsedMinutes(order.placedAt);
  const urgent = minutes > 10;
  const tableNumber = order.session?.table?.tableNumber ?? "--";
  const activeItems = order.items.filter((item) => item.status !== "REJECTED");
  const totalItems = activeItems.reduce((sum, item) => sum + item.quantity, 0);
  const canAccept = order.status === OrderStatus.PLACED;
  const canMarkReady = order.status === OrderStatus.ACCEPTED || order.status === OrderStatus.PREPARING;

  return (
    <article
      className={[
        "rounded-xl bg-surface-raised border border-border-primary p-4 shadow-sm",
        "transition-transform duration-200 active:scale-[0.99]",
        urgent ? "border-l-4 border-semantic_error-500" : "border-l-4 border-transparent",
        isNew ? "animate-[new-order-pulse_1s_ease-out]" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold leading-7 text-text-primary">Table {tableNumber}</h3>
          <span
            className={`mt-2 inline-flex min-h-8 items-center rounded-full px-3 text-[13px] font-semibold ${timeTone(minutes)}`}
          >
            {timeLabel(minutes)}
          </span>
        </div>
        <span className="text-sm font-semibold text-text-secondary">{shortOrderId(order.id)}</span>
      </div>

      <div className="mt-4 divide-y divide-border-primary rounded-lg border border-border-primary bg-surface-base">
        {order.items.length ? (
          order.items.map((item) => {
            const rejected = item.status === "REJECTED";
            return (
              <div key={item.id} className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`truncate text-base font-medium text-text-primary ${
                        rejected ? "text-text-tertiary line-through" : ""
                      }`}
                    >
                      {item.menuItem.name}
                    </p>
                    {rejected ? (
                      <span className="rounded-full bg-semantic_error-500/15 px-2 py-0.5 text-xs font-bold text-semantic_error-400">
                        Unavailable
                      </span>
                    ) : null}
                  </div>
                  {item.notes || item.specialInstructions ? (
                    <p className="mt-1 text-[13px] italic leading-5 text-text-secondary">
                      {item.notes ?? item.specialInstructions}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 text-base font-bold text-text-primary">x{item.quantity}</span>
              </div>
            );
          })
        ) : (
          <div className="p-3 text-sm text-text-secondary">No items on this order.</div>
        )}
      </div>

      <footer className="mt-4 flex min-h-12 items-center justify-between gap-3">
        <span className="text-sm font-semibold text-text-secondary">
          {totalItems} {totalItems === 1 ? "item" : "items"}
        </span>

        {canAccept ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAccept(order.id)}
            className="min-h-12 rounded-lg bg-accent-500 px-4 text-sm font-bold text-surface-base shadow-sm active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? "Accepting..." : "Accept Order"}
          </button>
        ) : null}

        {canMarkReady ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onReady(order.id)}
            className="min-h-12 rounded-lg bg-semantic_success-600 px-4 text-sm font-bold text-white shadow-sm active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? "Updating..." : "Mark Ready"}
          </button>
        ) : null}

        {order.status === OrderStatus.READY ? (
          <span className="text-sm font-semibold text-text-secondary">Awaiting Delivery</span>
        ) : null}
      </footer>
    </article>
  );
}
