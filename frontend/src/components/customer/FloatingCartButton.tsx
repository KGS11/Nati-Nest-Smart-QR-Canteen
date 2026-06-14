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
          ? "backdrop-blur-md bg-zinc-900/80 border border-zinc-800 rounded-full shadow-lg px-6 py-4 min-w-[240px] flex items-center justify-between gap-4 opacity-75 hover:opacity-100"
          : "backdrop-blur-md bg-amber-500/90 border border-amber-400/50 rounded-full shadow-lg shadow-amber-500/20 px-6 py-4 min-w-[240px] flex items-center justify-between gap-4",
        scaleUp && "scale-105"
      )}
    >
      <span
        className={cn(
          "rounded-full w-7 h-7 text-sm font-bold flex items-center justify-center shrink-0 transition-transform duration-200",
          isEmpty ? "bg-zinc-800 text-zinc-500" : "bg-amber-600 text-white",
          bounce && "scale-125"
        )}
      >
        {itemCount}
      </span>

      <span className={cn("font-semibold text-base", isEmpty ? "text-zinc-550 text-zinc-400" : "text-white")}>
        {isEmpty ? "Empty Cart" : "View Cart"}
      </span>

      <span className={cn("font-bold text-base whitespace-nowrap", isEmpty ? "text-zinc-550 text-zinc-400" : "text-white")}>
        Rs {subtotal.toFixed(2)}
      </span>
    </button>
  );
}
