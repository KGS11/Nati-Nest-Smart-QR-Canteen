"use client";

import clsx from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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
    <Card
      className={clsx(
        "rounded-2xl border border-border-default bg-surface-base p-5 transition-colors hover:border-text-tertiary shadow-sm relative overflow-hidden",
        table.status === "OCCUPIED" && "border-l-[6px] border-l-warning-500",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-display-sm font-bold text-text-primary">Table {table.tableNumber}</h3>
          <p className="mt-1 text-body-xs text-text-tertiary">{formatDate(table.createdAt)}</p>
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
            <span className="block w-fit rounded-xl bg-white p-2 transition group-hover:ring-2 group-hover:ring-brand-500/50 shadow-sm">
              <img
                src={table.qrCodeUrl}
                alt={`QR preview for Table ${table.tableNumber}`}
                className="h-12 w-12 object-contain"
              />
            </span>
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-raised text-display-sm font-bold text-text-tertiary border border-border-default">
              ?
            </span>
          )}
          <span className="mt-2 block text-center text-label-xs font-semibold text-text-tertiary">
            {table.qrCodeUrl ? "View QR" : "No QR"}
          </span>
        </button>

        <Button
          type="button"
          variant="outline"
          className="min-h-[36px] px-3 py-1.5 text-label-xs"
          onClick={() => onRegenerateQR(table.id)}
        >
          Regenerate
        </Button>
      </div>

      <p className="mt-3 text-body-xs font-medium text-text-tertiary">
        {sessionCount > 0 ? `${sessionCount} sessions recorded` : "No sessions yet"}
      </p>

      <div className="mt-4 flex gap-2 border-t border-border-default pt-4">
        <Button
          type="button"
          variant="outline"
          className="min-h-[40px] flex-1 px-3 py-1.5 text-label-sm text-brand-500 hover:text-brand-400"
          onClick={() => onViewQR(table)}
        >
          View QR
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-[40px] flex-1 px-3 py-1.5 text-label-sm"
          onClick={() => onEdit(table)}
        >
          Edit
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="min-h-[40px] w-14 px-0 py-1.5 text-label-sm"
          onClick={() => onDelete(table)}
          aria-label={`Delete table ${table.tableNumber}`}
        >
          Del
        </Button>
      </div>
    </Card>
  );
}
