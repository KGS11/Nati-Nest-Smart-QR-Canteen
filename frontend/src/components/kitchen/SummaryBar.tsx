"use client";

import { cn } from "@/utils/cn";

interface SummaryBarProps {
  placedCount: number;
  preparingCount: number;
  readyCount: number;
  totalCount: number;
}

export function SummaryBar({
  placedCount,
  preparingCount,
  readyCount,
  totalCount,
}: SummaryBarProps) {
  return (
    <div className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex gap-2 overflow-x-auto hide-scrollbar">
      <span className="px-3 py-1.5 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-300 whitespace-nowrap">
        {totalCount} {totalCount === 1 ? "Order" : "Orders"}
      </span>

      <span
        className={cn(
          "px-3 py-1.5 rounded-xl text-sm font-medium bg-amber-500/20 text-amber-400 whitespace-nowrap flex items-center gap-1.5",
          placedCount > 0 && "animate-pulse"
        )}
      >
        <span>{placedCount}</span> New
      </span>

      <span
        className={cn(
          "px-3 py-1.5 rounded-xl text-sm font-medium bg-blue-500/20 text-blue-400 whitespace-nowrap flex items-center gap-1.5",
          preparingCount > 0 && "animate-pulse"
        )}
      >
        <span>{preparingCount}</span> Cooking
      </span>

      <span
        className={cn(
          "px-3 py-1.5 rounded-xl text-sm font-medium bg-green-500/20 text-green-400 whitespace-nowrap flex items-center gap-1.5",
          readyCount > 0 && "animate-pulse"
        )}
      >
        <span>{readyCount}</span> Ready
      </span>
    </div>
  );
}
