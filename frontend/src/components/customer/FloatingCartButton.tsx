"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/utils/cn";

export function FloatingCartButton() {
  const { itemCount, subtotal, setIsOpen } = useCart();
  const [prevCount, setPrevCount] = useState(itemCount);
  const [bounce, setBounce] = useState(false);
  const [scaleUp, setScaleUp] = useState(false);

  useEffect(() => {
    if (itemCount > prevCount) {
      setBounce(true);
      setScaleUp(true);
      const timer1 = setTimeout(() => setBounce(false), 300);
      const timer2 = setTimeout(() => setScaleUp(false), 300);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
    setPrevCount(itemCount);
  }, [itemCount, prevCount]);

  const isEmpty = itemCount === 0;

  return (
    <button
      onClick={() => setIsOpen(true)}
      className={cn(
        "fixed bottom-20 left-1/2 -translate-x-1/2 z-30 mb-safe transition-all duration-300 active:scale-95",
        isEmpty
          ? "backdrop-blur-md bg-surface-raised/80 border border-border-default rounded-full shadow-lg px-6 py-4 min-w-[240px] flex items-center justify-between gap-4 opacity-75 hover:opacity-100"
          : "backdrop-blur-md bg-brand-500/90 border border-brand-400/50 rounded-full shadow-lg shadow-brand-500/20 px-6 py-4 min-w-[240px] flex items-center justify-between gap-4",
        scaleUp && "scale-105"
      )}
    >
      <span
        className={cn(
          "rounded-full w-7 h-7 text-label-xs font-bold flex items-center justify-center shrink-0 transition-transform duration-200",
          isEmpty ? "bg-surface-base text-text-tertiary" : "bg-brand-600 text-brand-950",
          bounce && "scale-125"
        )}
      >
        {itemCount}
      </span>

      <span className={cn("font-semibold text-label-md", isEmpty ? "text-text-secondary" : "text-brand-950")}>
        {isEmpty ? "Empty Cart" : "View Cart"}
      </span>

      <span className={cn("font-bold text-label-md whitespace-nowrap", isEmpty ? "text-text-tertiary" : "text-brand-950")}>
        Rs {subtotal.toFixed(2)}
      </span>
    </button>
  );
}
