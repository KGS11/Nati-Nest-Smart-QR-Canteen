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
    <div className="sticky top-0 z-10 bg-surface-raised/95 backdrop-blur-md border-b border-border-primary px-4 py-3 flex gap-2 overflow-x-auto hide-scrollbar">
      <span className="px-3 py-1.5 rounded-xl text-sm font-medium bg-surface-overlay text-text-secondary whitespace-nowrap">
        {totalCount} {totalCount === 1 ? "Order" : "Orders"}
      </span>

      <span
        className={cn(
          "px-3 py-1.5 rounded-xl text-sm font-medium bg-accent-500/20 text-accent-400 whitespace-nowrap flex items-center gap-1.5",
          placedCount > 0 && "animate-pulse"
        )}
      >
        <span>{placedCount}</span> New
      </span>

      <span
        className={cn(
          "px-3 py-1.5 rounded-xl text-sm font-medium bg-info-500/20 text-info-400 whitespace-nowrap flex items-center gap-1.5",
          preparingCount > 0 && "animate-pulse"
        )}
      >
        <span>{preparingCount}</span> Cooking
      </span>

      <span
        className={cn(
          "px-3 py-1.5 rounded-xl text-sm font-medium bg-semantic_success-500/20 text-semantic_success-400 whitespace-nowrap flex items-center gap-1.5",
          readyCount > 0 && "animate-pulse"
        )}
      >
        <span>{readyCount}</span> Ready
      </span>
    </div>
  );
}
