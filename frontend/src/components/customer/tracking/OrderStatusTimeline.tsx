"use client";

import { OrderStatus } from "@/types";
import { cn } from "@/utils/cn";
import { EstimatedWaitBadge } from "./EstimatedWaitBadge";

interface OrderStatusTimelineProps {
  status: OrderStatus;
  placedAt: string;
  acceptedAt: string | null;
  preparingAt: string | null;
  readyAt: string | null;
  deliveredAt: string | null;
}

const STEPS = [
  { key: "PLACED", label: "Order Placed", icon: "🛒", description: "Kitchen received your order" },
  { key: "ACCEPTED", label: "Accepted", icon: "✅", description: "Kitchen confirmed your order" },
  { key: "PREPARING", label: "Preparing", icon: "👨‍🍳", description: "Your food is being prepared" },
  { key: "READY", label: "Ready", icon: "🍽️", description: "Your order is ready!" },
  { key: "DELIVERED", label: "Delivered", icon: "🎉", description: "Enjoy your meal!" },
];

const statusIndexMap: Record<OrderStatus, number> = {
  PLACED: 0,
  ACCEPTED: 1,
  PREPARING: 2,
  READY: 3,
  PREPARED: 3,
  DELIVERED: 4,
  PAID: 4,
  CANCELLED: -1,
};

function formatTime(dateString: string | null) {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "";
  }
}

export function OrderStatusTimeline({
  status,
  placedAt,
  acceptedAt,
  preparingAt,
  readyAt,
  deliveredAt,
}: OrderStatusTimelineProps) {
  const currentIndex = statusIndexMap[status] ?? 0;

  const getStepTimestamp = (key: string) => {
    switch (key) {
      case "PLACED":
        return placedAt;
      case "ACCEPTED":
        return acceptedAt;
      case "PREPARING":
        return preparingAt;
      case "READY":
        return readyAt;
      case "DELIVERED":
        return deliveredAt;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col py-4">
      {STEPS.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const isUpcoming = idx > currentIndex;
        const timestamp = getStepTimestamp(step.key);

        return (
          <div key={step.key} className="flex gap-4 relative pb-6 last:pb-0">
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "absolute left-[19px] top-10 bottom-0 w-0.5 min-h-[32px] -z-10",
                  isCompleted ? "bg-semantic_success-500" : "bg-surface-overlay"
                )}
              />
            )}

            <div className="shrink-0 z-10">
              {isCompleted ? (
                <div className="w-10 h-10 rounded-full bg-semantic_success-500 text-white flex items-center justify-center font-bold text-sm">
                  ✓
                </div>
              ) : isCurrent ? (
                <div className="w-10 h-10 rounded-full bg-accent-500 text-surface-base flex items-center justify-center font-bold text-sm ring-4 ring-accent-500/20 animate-pulse">
                  <span className="text-base">{step.icon}</span>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-surface-overlay text-text-muted flex items-center justify-center font-bold text-sm">
                  <span className="text-base filter grayscale opacity-45">{step.icon}</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "font-semibold text-sm",
                    isCompleted && "text-semantic_success-400",
                    isCurrent && "text-accent-400",
                    isUpcoming && "text-text-tertiary"
                  )}
                >
                  {step.label}
                </span>
                {timestamp && (
                  <span className="text-xs text-text-muted font-medium">
                    {formatTime(timestamp)}
                  </span>
                )}
              </div>
              <p
                className={cn(
                  "text-xs mt-0.5 leading-relaxed",
                  isCurrent ? "text-text-primary" : "text-text-tertiary"
                )}
              >
                {step.description}
              </p>

              {isCurrent && step.key === "PREPARING" && timestamp && (
                <EstimatedWaitBadge preparingAt={timestamp} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
