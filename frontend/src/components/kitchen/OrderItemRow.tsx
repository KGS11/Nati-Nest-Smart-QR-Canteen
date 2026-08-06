"use client";

import { KitchenOrderItem } from "@/types/kitchen.types";
import { MaterialIcon } from "@/components/stitch/MaterialIcon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface OrderItemRowProps {
  item: KitchenOrderItem;
  orderStatus?: string;
  onReject?: (reason: string) => void;
  onPrepare?: () => void;
}

export function OrderItemRow({ item, orderStatus, onReject, onPrepare }: OrderItemRowProps) {
  const rejected = item.status === "REJECTED";
  const prepared = item.itemStatus === "PREPARED" || item.itemStatus === "SERVED";

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
    <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={
              rejected
                ? "truncate text-body-sm md:text-body-md font-medium text-semantic_error-400/60 line-through"
                : "truncate text-body-md md:text-body-lg font-medium text-text-primary"
            }
          >
            {item.name}
          </span>
          {rejected ? (
            <Badge variant="destructive">
              Unavailable
            </Badge>
          ) : null}
          {prepared ? (
            <Badge variant="success">
              Prepared
            </Badge>
          ) : null}
        </div>
        {item.specialInstructions ? (
          <p className="mt-1 text-body-sm italic text-warning-500 font-medium">
            Note: {item.specialInstructions}
          </p>
        ) : null}
      </div>

      <div className="flex w-full flex-wrap items-center justify-between gap-3 md:w-auto md:flex-nowrap md:justify-end md:gap-4">
        <span className="min-w-12 rounded-lg bg-surface-base px-2.5 py-1 text-center text-display-sm font-bold text-brand-500">
          x{item.quantity}
        </span>

        {onPrepare && !rejected && !prepared ? (
          <div className="flex min-w-[144px] flex-1 md:flex-none">
            <Button
              variant="brand"
              onClick={onPrepare}
              title="Mark prepared"
              aria-label={`Mark ${item.name} prepared`}
              className="min-h-11 w-full gap-2 rounded-lg bg-semantic_success-500 px-4 text-label-sm font-bold text-surface-base hover:bg-semantic_success-400 md:w-auto"
            >
              <MaterialIcon name="check" className="text-lg" />
              Prepared
            </Button>
          </div>
        ) : null}
        
        {onReject && !rejected && (
          <div className="flex w-full items-center gap-3 border-t border-border-default pt-3 md:ml-2 md:w-auto md:border-l md:border-t-0 md:pl-4 md:pt-0">
            <Button
              variant="outline"
              onClick={handleRejectClick}
              title="Mark item unavailable"
              aria-label={`Mark ${item.name} unavailable`}
              className="min-h-11 w-full gap-2 rounded-lg border-semantic_error-500/30 bg-semantic_error-500/10 px-4 text-label-sm font-bold text-semantic_error-400 hover:bg-semantic_error-500/15 hover:text-semantic_error-300 md:w-auto"
            >
              <MaterialIcon name="block" className="text-lg" />
              Unavailable
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
