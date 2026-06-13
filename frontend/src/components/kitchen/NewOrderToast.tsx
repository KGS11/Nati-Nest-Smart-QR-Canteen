"use client";

import { useEffect } from "react";

interface NewOrderToastProps {
  tableNumber: string;
  onDismiss: () => void;
}

export function NewOrderToast({ tableNumber, onDismiss }: NewOrderToastProps) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onDismiss, 4000);
    return () => window.clearTimeout(timeoutId);
  }, [onDismiss]);

  return (
    <button
      type="button"
      onClick={onDismiss}
      className="fixed left-1/2 top-4 z-50 min-h-12 -translate-x-1/2 animate-[kitchen-toast-in_180ms_ease-out] rounded-full bg-amber-500 px-5 text-left text-zinc-950 shadow-xl"
    >
      <span className="mr-2" aria-hidden="true">
        !
      </span>
      <span className="font-bold">New Order</span>
      <span className="ml-2">Table {tableNumber}</span>
    </button>
  );
}
