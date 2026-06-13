"use client";

import clsx from "clsx";
import { TableStatus } from "@/types/table.types";

interface TableStatusBadgeProps {
  status: TableStatus;
}

export function TableStatusBadge({ status }: TableStatusBadgeProps) {
  const isAvailable = status === "AVAILABLE";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        isAvailable
          ? "border-green-500/20 bg-green-500/10 text-green-400"
          : "border-amber-500/20 bg-amber-500/10 text-amber-400",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {isAvailable ? "Available" : "Occupied"}
    </span>
  );
}
