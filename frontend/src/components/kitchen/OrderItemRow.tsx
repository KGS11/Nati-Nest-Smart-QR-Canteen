"use client";

import { KitchenOrderItem } from "@/types/kitchen.types";
import { MaterialIcon } from "@/components/stitch/MaterialIcon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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
    <div className="py-4 flex items-center justify-between gap-3">
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
        </div>
        {item.specialInstructions ? (
          <p className="mt-1 text-body-sm italic text-warning-500 font-medium">
            Note: {item.specialInstructions}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-display-sm font-bold text-brand-500">x{item.quantity}</span>
        
        {onReject && !rejected && (
          <Button
            variant="destructive"
            size="icon"
            onClick={handleRejectClick}
            title="Reject item"
            aria-label={`Reject ${item.name}`}
          >
            <MaterialIcon name="close" className="text-lg" />
          </Button>
        )}
      </div>
    </div>
  );
}
