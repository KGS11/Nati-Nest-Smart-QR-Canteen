"use client";

import { MaterialIcon } from "@/components/stitch/MaterialIcon";

export function CartBar({
  totalItems,
  totalAmount,
  isSubmitting,
  onSubmit,
}: {
  totalItems: number;
  totalAmount: number;
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 p-4 transition-transform duration-300 ${totalItems > 0 ? "translate-y-0" : "translate-y-full"}`}
    >
      <div className="mx-auto flex max-w-md items-center justify-between rounded-2xl bg-primary p-4 text-white shadow-[0_12px_24px_-4px_rgba(157,67,0,0.4)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
            <MaterialIcon name="shopping_bag" />
          </div>
          <div>
            <p className="font-label-md text-label-md opacity-90">
              {totalItems} Items | Rs {totalAmount}
            </p>
            <p className="font-headline-sm text-headline-sm leading-tight">Place Order</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="rounded-xl bg-white px-6 py-2 font-headline-sm text-headline-sm text-primary shadow-md transition-transform active:scale-95 disabled:opacity-60"
        >
          {isSubmitting ? "Placing..." : "Proceed"}
        </button>
      </div>
    </div>
  );
}
