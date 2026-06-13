"use client";

import { Button } from "@/components/common/Button";
import { RestaurantTable } from "@/types/table.types";

interface DeleteTableModalProps {
  table: RestaurantTable;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
}

const getSessionCount = (table: RestaurantTable) =>
  table._count?.sessions ?? table.activeSessionCount ?? 0;

export function DeleteTableModal({
  table,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteTableModalProps) {
  const sessionCount = getSessionCount(table);
  const deletionBlocked = sessionCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-2xl font-bold text-red-400">
          !
        </div>
        <h2 className="mt-4 text-xl font-bold text-zinc-100">Delete Table {table.tableNumber}</h2>
        <p className="mt-2 text-sm text-zinc-400">
          This action cannot be undone. The table and its QR code will be permanently removed.
        </p>

        {deletionBlocked ? (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-left text-xs text-red-400">
            This table has {sessionCount} recorded sessions. Deletion is blocked to preserve
            billing history. Consider deactivating the table instead.
          </div>
        ) : null}

        <div className="mt-6 flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            className="flex-1"
            onClick={onConfirm}
            disabled={deletionBlocked || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
