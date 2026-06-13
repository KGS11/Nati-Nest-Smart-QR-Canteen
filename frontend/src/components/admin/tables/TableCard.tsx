"use client";

import clsx from "clsx";
import { Button } from "@/components/common/Button";
import { RestaurantTable } from "@/types/table.types";
import { TableStatusBadge } from "./TableStatusBadge";

interface TableCardProps {
  table: RestaurantTable;
  onEdit: (table: RestaurantTable) => void;
  onDelete: (table: RestaurantTable) => void;
  onViewQR: (table: RestaurantTable) => void;
  onRegenerateQR: (tableId: string) => Promise<void>;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const getSessionCount = (table: RestaurantTable) =>
  table._count?.sessions ?? table.activeSessionCount ?? 0;

export function TableCard({
  table,
  onEdit,
  onDelete,
  onViewQR,
  onRegenerateQR,
}: TableCardProps) {
  const sessionCount = getSessionCount(table);

  return (
    <article
      className={clsx(
        "rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700",
        table.status === "OCCUPIED" && "border-l-4 border-l-amber-500/50",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-zinc-100">Table {table.tableNumber}</h3>
          <p className="mt-1 text-xs text-zinc-500">{formatDate(table.createdAt)}</p>
        </div>
        <TableStatusBadge status={table.status} />
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <button
          type="button"
          className="group text-left disabled:cursor-not-allowed"
          onClick={() => onViewQR(table)}
          disabled={!table.qrCodeUrl}
          aria-label={`View QR code for table ${table.tableNumber}`}
        >
          {table.qrCodeUrl ? (
            <span className="block w-fit rounded-lg bg-white p-2 transition group-hover:ring-2 group-hover:ring-amber-500/50">
              <img
                src={table.qrCodeUrl}
                alt={`QR preview for Table ${table.tableNumber}`}
                className="h-12 w-12 object-contain"
              />
            </span>
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-zinc-800 text-lg font-bold text-zinc-600">
              ?
            </span>
          )}
          <span className="mt-1 block text-center text-xs text-zinc-500">
            {table.qrCodeUrl ? "View QR" : "No QR"}
          </span>
        </button>

        <Button
          type="button"
          variant="secondary"
          className="min-h-9 px-3 py-1.5 text-xs"
          onClick={() => onRegenerateQR(table.id)}
        >
          Regenerate
        </Button>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        {sessionCount > 0 ? `${sessionCount} sessions recorded` : "No sessions yet"}
      </p>

      <div className="mt-4 flex gap-2 border-t border-zinc-800 pt-4">
        <Button
          type="button"
          variant="secondary"
          className="min-h-9 flex-1 px-3 py-1.5 text-xs text-amber-300"
          onClick={() => onViewQR(table)}
        >
          View QR
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-9 flex-1 px-3 py-1.5 text-xs text-zinc-300"
          onClick={() => onEdit(table)}
        >
          Edit
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-9 w-12 px-0 py-1.5 text-xs text-red-400 hover:text-red-300"
          onClick={() => onDelete(table)}
          aria-label={`Delete table ${table.tableNumber}`}
        >
          Del
        </Button>
      </div>
    </article>
  );
}
