"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-neutral-950/80 backdrop-blur-sm px-4 py-16">
      <Card className="w-full max-w-md p-6 shadow-2xl border-border-default relative overflow-hidden">
        <h2 className="mb-6 text-display-sm font-bold text-text-primary tracking-tight">{title}</h2>
        {children}
      </Card>
    </div>
  );
}

function TableGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }, (_, index) => (
        <Card
          key={index}
          className="h-64 animate-pulse p-5"
        >
          <div className="h-7 w-28 rounded bg-surface-raised" />
          <div className="mt-3 h-4 w-20 rounded bg-surface-raised" />
          <div className="mt-8 h-16 w-16 rounded-xl bg-surface-raised" />
          <div className="mt-8 h-10 rounded bg-surface-raised" />
        </Card>
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
    <div className="rounded-2xl border border-dashed border-border-default bg-surface-raised/50 px-6 py-14 text-center">
      <h3 className="text-display-sm font-semibold text-text-primary">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-body-sm text-text-secondary">{description}</p>
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
    <section className="min-h-full bg-neutral-950 text-neutral-50 md:p-8">
      {toast ? (
        <div className="fixed right-6 top-6 z-[60] w-full max-w-sm">
          <Toast title={toast.title} tone={toast.tone} />
        </div>
      ) : null}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-label-sm font-bold uppercase tracking-widest text-brand-500">
            Admin Controls
          </p>
          <h1 className="mt-1 text-display-xl font-black tracking-tight text-text-primary">
            Table Management
          </h1>
          <p className="mt-2 text-body-md font-medium text-text-tertiary">{totalTables} tables</p>
        </div>
        <Button variant="brand" type="button" onClick={() => openModal({ type: "createTable" })} className="min-h-[48px] px-6 text-label-md">
          Add Table
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Badge variant="secondary" className="px-4 py-2 text-label-sm">
          {totalTables} Total
        </Badge>
        <Badge variant="success" className="px-4 py-2 text-label-sm">
          {availableTables} Available
        </Badge>
        <Badge variant="warning" className="px-4 py-2 text-label-sm">
          {occupiedTables} Occupied
        </Badge>
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
        <div className="rounded-2xl border border-semantic_error-500/20 bg-semantic_error-500/5 p-6">
          <h2 className="text-display-sm font-semibold text-semantic_error-400">Unable to load tables</h2>
          <p className="mt-2 text-body-sm text-semantic_error-300/80">{error}</p>
          <Button variant="outline" type="button" className="mt-5" onClick={() => void fetchTables()}>
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
            <Button variant="brand" type="button" onClick={() => openModal({ type: "createTable" })}>
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
