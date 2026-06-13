"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Toast } from "@/components/common/Toast";
import { apiClient } from "@/lib/api-client";
import { useTableStore } from "@/stores/tableStore";
import { ApiResponse, ClientApiError } from "@/types/api";
import { RestaurantTable } from "@/types/table.types";
import { DeleteTableModal } from "./DeleteTableModal";
import { QRCodeModal } from "./QRCodeModal";
import { TableCard } from "./TableCard";
import { TableForm } from "./TableForm";

type ToastState = {
  title: string;
  message?: string;
  tone: "info" | "success" | "error";
};

const sortTables = (tables: RestaurantTable[]) =>
  [...tables].sort((a, b) =>
    a.tableNumber.localeCompare(b.tableNumber, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );

function ModalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <h2 className="mb-5 text-xl font-bold text-zinc-100">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function TableGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="h-64 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900 p-5"
        >
          <div className="h-7 w-28 rounded bg-zinc-800" />
          <div className="mt-3 h-4 w-20 rounded bg-zinc-800" />
          <div className="mt-8 h-16 w-16 rounded-lg bg-zinc-800" />
          <div className="mt-8 h-10 rounded bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/50 px-6 py-14 text-center">
      <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export default function TableGrid() {
  const {
    tables,
    isLoading,
    error,
    searchQuery,
    activeModal,
    setTables,
    addTable,
    updateTable,
    removeTable,
    setLoading,
    setError,
    setSearchQuery,
    openModal,
    closeModal,
    getFilteredTables,
  } = useTableStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((nextToast: ToastState) => {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<ApiResponse<RestaurantTable[]>>("/tables");
      setTables(response.data.data);
    } catch (fetchError) {
      const clientError = fetchError as ClientApiError;
      setError(clientError.message || "Unable to load tables");
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading, setTables]);

  useEffect(() => {
    void fetchTables();
  }, [fetchTables]);

  const filteredTables = useMemo(() => sortTables(getFilteredTables()), [
    getFilteredTables,
    tables,
    searchQuery,
  ]);

  const totalTables = tables.length;
  const availableTables = tables.filter((table) => table.status === "AVAILABLE").length;
  const occupiedTables = tables.filter((table) => table.status === "OCCUPIED").length;

  const handleRegenerate = async (tableId: string) => {
    try {
      const response = await apiClient.patch<ApiResponse<RestaurantTable>>(`/tables/${tableId}/qr`);
      const updatedTable = response.data.data;
      updateTable(updatedTable);

      if (activeModal?.type === "viewQR" && activeModal.table.id === tableId) {
        openModal({ type: "viewQR", table: updatedTable });
      }

      showToast({
        title: "QR code regenerated",
        message: "Print and replace the QR on the table.",
        tone: "success",
      });
    } catch {
      showToast({ title: "Failed to regenerate QR code", tone: "error" });
    }
  };

  const handleConfirmDelete = async () => {
    if (activeModal?.type !== "deleteTable") return;

    const { table } = activeModal;
    setIsDeleting(true);

    try {
      await apiClient.delete<ApiResponse<Record<string, never>>>(`/tables/${table.id}`);
      removeTable(table.id);
      closeModal();
      showToast({ title: `Table ${table.tableNumber} deleted`, tone: "success" });
    } catch (deleteError) {
      const clientError = deleteError as ClientApiError;
      closeModal();

      if (clientError.status === 409) {
        showToast({ title: "Cannot delete", message: "Table has an active session.", tone: "error" });
      } else if (clientError.status === 400) {
        showToast({
          title: "Cannot delete",
          message: "Table has historical data and has been preserved.",
          tone: "error",
        });
      } else {
        showToast({
          title: "Failed to delete table",
          message: clientError.message,
          tone: "error",
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateSuccess = (table: RestaurantTable) => {
    addTable(table);
    closeModal();
    showToast({
      title: `Table ${table.tableNumber} created`,
      message: "QR code is ready to print.",
      tone: "success",
    });
  };

  const handleEditSuccess = (table: RestaurantTable) => {
    const previousTable = activeModal?.type === "editTable" ? activeModal.table : null;
    updateTable(table);
    closeModal();
    showToast({
      title: "Table updated",
      message:
        previousTable && previousTable.tableNumber !== table.tableNumber
          ? "New QR code generated. Print and replace the QR on the table."
          : undefined,
      tone: "success",
    });
  };

  return (
    <section className="min-h-full bg-zinc-950 text-zinc-100">
      {toast ? (
        <div className="fixed right-6 top-6 z-[60] w-full max-w-sm">
          <Toast title={toast.title} message={toast.message} tone={toast.tone} />
        </div>
      ) : null}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-400">
            Admin Controls
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-100">
            Table Management
          </h1>
          <p className="mt-2 text-sm text-zinc-400">{totalTables} tables</p>
        </div>
        <Button type="button" onClick={() => openModal({ type: "createTable" })}>
          Add Table
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <span className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300">
          {totalTables} Total
        </span>
        <span className="rounded-xl bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400">
          {availableTables} Available
        </span>
        <span className="rounded-xl bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400">
          {occupiedTables} Occupied
        </span>
      </div>

      <div className="mb-6 max-w-sm">
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by table number..."
          aria-label="Search by table number"
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <h2 className="text-lg font-semibold text-red-300">Unable to load tables</h2>
          <p className="mt-2 text-sm text-red-200/80">{error}</p>
          <Button type="button" className="mt-5" onClick={() => void fetchTables()}>
            Retry
          </Button>
        </div>
      ) : isLoading ? (
        <TableGridSkeleton />
      ) : filteredTables.length === 0 && searchQuery ? (
        <EmptyState
          title="No tables found"
          description={`No tables matching "${searchQuery}".`}
        />
      ) : tables.length === 0 ? (
        <EmptyState
          title="No tables yet"
          description="Add your first table to get started."
          action={
            <Button type="button" onClick={() => openModal({ type: "createTable" })}>
              Add Table
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onEdit={(selectedTable) => openModal({ type: "editTable", table: selectedTable })}
              onDelete={(selectedTable) =>
                openModal({ type: "deleteTable", table: selectedTable })
              }
              onViewQR={(selectedTable) => openModal({ type: "viewQR", table: selectedTable })}
              onRegenerateQR={handleRegenerate}
            />
          ))}
        </div>
      )}

      {activeModal?.type === "createTable" ? (
        <ModalShell title="Add Table">
          <TableForm onSuccess={handleCreateSuccess} onCancel={closeModal} />
        </ModalShell>
      ) : null}

      {activeModal?.type === "editTable" ? (
        <ModalShell title={`Edit Table ${activeModal.table.tableNumber}`}>
          <TableForm
            table={activeModal.table}
            onSuccess={handleEditSuccess}
            onCancel={closeModal}
          />
        </ModalShell>
      ) : null}

      {activeModal?.type === "viewQR" ? (
        <QRCodeModal table={activeModal.table} onClose={closeModal} onRegenerate={handleRegenerate} />
      ) : null}

      {activeModal?.type === "deleteTable" ? (
        <DeleteTableModal
          table={activeModal.table}
          onConfirm={handleConfirmDelete}
          onCancel={closeModal}
          isDeleting={isDeleting}
        />
      ) : null}
    </section>
  );
}
