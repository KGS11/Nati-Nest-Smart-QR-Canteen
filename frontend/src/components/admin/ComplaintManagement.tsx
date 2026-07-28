"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/admin/shared/PageHeader";
import SearchBar from "@/components/admin/shared/SearchBar";
import Loader from "@/components/common/Loader";
import { Button } from "@/components/common/Button";
import { MaterialIcon } from "@/components/stitch/MaterialIcon";
import { StatePanel } from "@/components/stitch/StatePanel";
import { useSocket } from "@/hooks/useSocket";
import { adminService } from "@/services/adminService";
import { cn } from "@/utils/cn";

const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const cancellationReasons = [
  { value: "TASTE_ISSUE", label: "Taste Issue" },
  { value: "POOR_QUALITY", label: "Poor Quality" },
  { value: "WRONG_PREPARATION", label: "Wrong Preparation" },
  { value: "SUPPLIER_ISSUE", label: "Supplier Issue" },
  { value: "DAMAGED_FOOD", label: "Damaged Food" },
  { value: "WRONG_ITEM", label: "Wrong Item" },
  { value: "OTHER", label: "Other" },
];

type ComplaintOrderItem = {
  id: string;
  quantity: number;
  unitPrice: number | string;
  originalAmount?: number | string | null;
  status: string;
  cancellationReason?: string | null;
  cancellationNotes?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: { name?: string | null } | null;
  cancelledByUser?: { name?: string | null } | null;
  menuItem?: { name?: string | null } | null;
};

type ComplaintOrder = {
  id: string;
  status: string;
  session?: {
    table?: {
      tableNumber?: string | number | null;
    } | null;
  } | null;
  items?: ComplaintOrderItem[];
};

type CancelDialogState = {
  order: ComplaintOrder;
  item: ComplaintOrderItem;
  reason: string;
  notes: string;
  confirmStep: boolean;
};

type ComplaintHistory = {
  summary: {
    totalCancelledItems: number;
    totalAmountDeducted: number;
  };
  reasonSummary: Array<{ reason: string; count: number; amount: number }>;
  recentCancellations: Array<{
    itemId: string;
    orderId: string;
    tableNumber: string | number;
    name: string;
    quantity: number;
    amountDeducted: number;
    reason: string | null;
    notes: string | null;
    cancelledAt: string | null;
    cancelledBy: string;
    orderStatus?: string;
  }>;
};

const getTableNumber = (order: ComplaintOrder) => String(order.session?.table?.tableNumber ?? "N/A");

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

const getHistoryRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  return { startDate: isoDate(start), endDate: isoDate(end) };
};

export function ComplaintManagement() {
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [complaintOrders, setComplaintOrders] = useState<ComplaintOrder[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "cancelled">("all");
  const [historySearch, setHistorySearch] = useState("");
  const [historyReason, setHistoryReason] = useState("");
  const [historyStatus, setHistoryStatus] = useState("");
  const [historyTable, setHistoryTable] = useState("");
  const [historyRange, setHistoryRange] = useState(getHistoryRange);
  const [history, setHistory] = useState<ComplaintHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [cancelDialog, setCancelDialog] = useState<CancelDialogState | null>(null);
  const [cancellingItemId, setCancellingItemId] = useState<string | null>(null);

  const loadComplaintOrders = useCallback(async () => {
    setError(null);
    try {
      const orders = await adminService.getComplaintEligibleOrders();
      setComplaintOrders(orders);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Unable to load complaint orders.");
    }
  }, []);

  const loadComplaintHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await adminService.getCancelledItemAnalytics(
        historyRange.startDate,
        historyRange.endDate,
      );
      setHistory(data);
    } catch (err: any) {
      setHistoryError(err.response?.data?.message || err.message || "Unable to load complaint history.");
    } finally {
      setHistoryLoading(false);
    }
  }, [historyRange.endDate, historyRange.startDate]);

  useEffect(() => {
    if (activeTab === "history") {
      void loadComplaintHistory();
    }
  }, [activeTab, loadComplaintHistory]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadComplaintOrders();
      setIsLoading(false);
    };
    void init();
  }, [loadComplaintOrders]);

  useEffect(() => {
    if (!socket) return;

    const refresh = () => {
      void loadComplaintOrders();
    };

    socket.on("order:item_cancelled", refresh);
    socket.on("order:cancelled", refresh);
    socket.on("order:auto_cancelled", refresh);
    return () => {
      socket.off("order:item_cancelled", refresh);
      socket.off("order:cancelled", refresh);
      socket.off("order:auto_cancelled", refresh);
    };
  }, [loadComplaintOrders, socket]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return complaintOrders
      .map((order) => {
        const items = order.items ?? [];
        const filteredItems = items.filter((item) => {
          const isCancelled = item.status === "CANCELLED_BY_ADMIN";
          if (statusFilter === "active" && isCancelled) return false;
          if (statusFilter === "cancelled" && !isCancelled) return false;
          if (!query) return true;

          return [
            order.id,
            order.status,
            getTableNumber(order),
            item.menuItem?.name,
            item.cancellationReason,
            item.cancellationNotes,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
        });

        return { ...order, items: filteredItems };
      })
      .filter((order) => (order.items?.length ?? 0) > 0);
  }, [complaintOrders, search, statusFilter]);

  const activeItemCount = useMemo(
    () =>
      complaintOrders.reduce(
        (total, order) =>
          total + (order.items ?? []).filter((item) => item.status === "ACTIVE").length,
        0,
      ),
    [complaintOrders],
  );

  const cancelledItemCount = useMemo(
    () =>
      complaintOrders.reduce(
        (total, order) =>
          total + (order.items ?? []).filter((item) => item.status === "CANCELLED_BY_ADMIN").length,
        0,
      ),
    [complaintOrders],
  );

  const historyRows = useMemo(() => {
    const query = historySearch.trim().toLowerCase();

    return (history?.recentCancellations ?? []).filter((item) => {
      if (historyReason && item.reason !== historyReason) return false;
      if (historyTable && String(item.tableNumber) !== historyTable) return false;
      if (historyStatus && item.orderStatus !== historyStatus) return false;

      if (query) {
        const matchesSearch = [
          item.orderId,
          item.tableNumber,
          item.name,
          item.reason,
          item.notes,
          item.cancelledBy,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [history, historyReason, historySearch, historyStatus, historyTable]);

  const historyReasons = useMemo(
    () =>
      Array.from(
        new Set(
          (history?.recentCancellations ?? [])
            .map((item) => item.reason)
            .filter((reason): reason is string => Boolean(reason)),
        ),
      ),
    [history],
  );

  const historyTables = useMemo(
    () => Array.from(new Set((history?.recentCancellations ?? []).map((item) => String(item.tableNumber)))),
    [history],
  );

  const historyStatuses = useMemo(
    () =>
      Array.from(
        new Set(
          (history?.recentCancellations ?? [])
            .map((item) => item.orderStatus)
            .filter((status): status is string => Boolean(status)),
        ),
      ),
    [history],
  );

  const handleCancelItem = async () => {
    if (!cancelDialog) return;
    if (!cancelDialog.confirmStep) {
      setCancelDialog({ ...cancelDialog, confirmStep: true });
      return;
    }

    setCancellingItemId(cancelDialog.item.id);
    try {
      await adminService.cancelOrderItem(cancelDialog.order.id, cancelDialog.item.id, {
        reason: cancelDialog.reason,
        notes: cancelDialog.notes.trim() || undefined,
      });
      setToast({ tone: "success", message: "Order item cancelled and bill adjusted." });
      setCancelDialog(null);
      await loadComplaintOrders();
    } catch (err: any) {
      setToast({
        tone: "error",
        message: err.response?.data?.message || err.message || "Failed to cancel order item.",
      });
    } finally {
      setCancellingItemId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      {toast ? (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center justify-between gap-3 rounded-xl border px-5 py-3.5 text-label-sm font-bold shadow-2xl",
            toast.tone === "success"
              ? "border-semantic_success-400 bg-semantic_success-500 text-brand-950"
              : "border-semantic_error-400 bg-semantic_error-500 text-white",
          )}
        >
          <span>{toast.message}</span>
        </div>
      ) : null}

      <PageHeader
        title="Complaint Management"
        subtitle="Review delivered or paid orders and apply admin-only item cancellations."
      />

      <div className="flex flex-wrap gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-2 shadow-stitch">
        {[
          { key: "active", label: "Active Eligibility" },
          { key: "history", label: "Complaint History" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as "active" | "history")}
            className={cn(
              "min-h-10 rounded-lg px-4 font-label-sm text-label-sm font-bold transition-all",
              activeTab === tab.key
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:text-on-surface",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-stitch">
          <p className="font-label-sm text-label-sm text-on-surface-variant">Eligible Orders</p>
          <p className="mt-xs font-headline-md text-headline-md text-primary">{complaintOrders.length}</p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-stitch">
          <p className="font-label-sm text-label-sm text-on-surface-variant">Pending Review Items</p>
          <p className="mt-xs font-headline-md text-headline-md text-primary">{activeItemCount}</p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-stitch">
          <p className="font-label-sm text-label-sm text-on-surface-variant">Cancelled Items</p>
          <p className="mt-xs font-headline-md text-headline-md text-primary">{cancelledItemCount}</p>
        </div>
      </section>

      {activeTab === "active" ? (
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-stitch">
          <div className="mb-md rounded-lg border border-primary/20 bg-primary/10 p-md">
            <p className="font-label-sm text-label-sm text-primary">Default operational view</p>
            <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
              Showing only orders currently eligible for complaint cancellation: today&apos;s delivered or paid orders.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search table, order, item, reason..."
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "cancelled")}
              className="h-10 rounded-xl border border-border-primary bg-surface-raised px-3 text-body-sm text-text-primary outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/50"
            >
              <option value="all">All Items</option>
              <option value="active">Pending Review</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-stitch">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_150px_150px_150px_150px_150px_120px]">
            <SearchBar
              value={historySearch}
              onChange={setHistorySearch}
              placeholder="Search history..."
            />
            <input
              type="date"
              value={historyRange.startDate}
              onChange={(event) => setHistoryRange((current) => ({ ...current, startDate: event.target.value }))}
              className="h-10 rounded-xl border border-border-primary bg-surface-raised px-3 text-body-sm text-text-primary outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/50"
            />
            <input
              type="date"
              value={historyRange.endDate}
              onChange={(event) => setHistoryRange((current) => ({ ...current, endDate: event.target.value }))}
              className="h-10 rounded-xl border border-border-primary bg-surface-raised px-3 text-body-sm text-text-primary outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/50"
            />
            <select
              value={historyReason}
              onChange={(event) => setHistoryReason(event.target.value)}
              className="h-10 rounded-xl border border-border-primary bg-surface-raised px-3 text-body-sm text-text-primary outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/50"
            >
              <option value="">All Reasons</option>
              {historyReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {String(reason).replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <select
              value={historyTable}
              onChange={(event) => setHistoryTable(event.target.value)}
              className="h-10 rounded-xl border border-border-primary bg-surface-raised px-3 text-body-sm text-text-primary outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/50"
            >
              <option value="">All Tables</option>
              {historyTables.map((table) => (
                <option key={table} value={table}>
                  Table {table}
                </option>
              ))}
            </select>
            <select
              value={historyStatus}
              onChange={(event) => setHistoryStatus(event.target.value)}
              className="h-10 rounded-xl border border-border-primary bg-surface-raised px-3 text-body-sm text-text-primary outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/50"
            >
              <option value="">All Statuses</option>
              {historyStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <Button type="button" variant="secondary" onClick={() => void loadComplaintHistory()}>
              Refresh
            </Button>
          </div>
          {history ? (
            <div className="mt-md flex flex-wrap gap-2">
              <span className="rounded-full bg-surface-container px-2.5 py-1 font-label-xs text-label-xs text-on-surface-variant">
                {history.summary.totalCancelledItems} cancellations
              </span>
              <span className="rounded-full bg-surface-container px-2.5 py-1 font-label-xs text-label-xs text-on-surface-variant">
                {currency(history.summary.totalAmountDeducted)} deducted
              </span>
            </div>
          ) : null}
        </section>
      )}

      {activeTab === "history" ? (
        historyLoading ? (
          <div className="space-y-md">
            <div className="h-16 rounded-xl border border-outline-variant bg-surface-container-lowest shadow-stitch animate-pulse" />
            <div className="h-16 rounded-xl border border-outline-variant bg-surface-container-lowest shadow-stitch animate-pulse" />
          </div>
        ) : historyError ? (
          <StatePanel
            tone="error"
            title="Complaint history unavailable"
            message={historyError}
            action={
              <Button type="button" variant="secondary" onClick={() => void loadComplaintHistory()}>
                Retry
              </Button>
            }
          />
        ) : historyRows.length === 0 ? (
          <StatePanel
            title="No complaint history found"
            message="Older complaint cancellation records remain available here when they match the selected filters."
          />
        ) : (
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-stitch overflow-hidden">
            <div className="divide-y divide-outline-variant">
              {historyRows.map((item) => (
                <div key={item.itemId} className="grid gap-md p-lg lg:grid-cols-[1fr_120px_160px_160px] lg:items-center">
                  <div className="min-w-0">
                    <p className="font-label-md text-label-md text-on-surface">{item.name}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Table {item.tableNumber} · #{item.orderId.slice(-6).toUpperCase()} · Qty {item.quantity}
                      {item.orderStatus ? ` · ${item.orderStatus}` : ""}
                    </p>
                    {item.notes ? (
                      <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">Notes: {item.notes}</p>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-semantic_error-500/10 px-2.5 py-1 text-center font-label-xs text-label-xs font-bold text-semantic_error-400">
                    {item.reason?.replaceAll("_", " ") ?? "OTHER"}
                  </span>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {item.cancelledAt ? new Date(item.cancelledAt).toLocaleString() : "No timestamp"}
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface">
                    {currency(item.amountDeducted)} · {item.cancelledBy}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )
      ) : isLoading ? (
        <div className="grid gap-md md:grid-cols-1 xl:grid-cols-2">
          <div className="h-44 rounded-xl border border-outline-variant bg-surface-container-lowest shadow-stitch animate-pulse" />
          <div className="h-44 rounded-xl border border-outline-variant bg-surface-container-lowest shadow-stitch animate-pulse" />
        </div>
      ) : error ? (
        <StatePanel
          tone="error"
          title="Complaint orders unavailable"
          message={error}
          action={
            <Button type="button" variant="secondary" onClick={() => void loadComplaintOrders()}>
              Retry
            </Button>
          }
        />
      ) : filteredOrders.length === 0 ? (
        <StatePanel
          title="No complaints to review"
          message="Delivered orders that are eligible for complaint cancellation will appear here."
        />
      ) : (
        <section className="grid gap-md md:grid-cols-1 xl:grid-cols-2">
          {filteredOrders.map((order) => (
            <div key={order.id} className="rounded-xl border border-outline-variant bg-surface-container-low p-md">
              <div className="mb-md flex items-start justify-between gap-md">
                <div>
                  <p className="font-headline-sm text-headline-sm text-on-surface">
                    Table {getTableNumber(order)}
                  </p>
                  <p className="font-label-xs text-label-xs text-on-surface-variant">
                    #{order.id.slice(-6).toUpperCase()} · {order.status}
                  </p>
                </div>
                <span className="rounded-full bg-surface-container px-2.5 py-1 font-label-xs text-label-xs text-on-surface-variant">
                  {order.items?.length ?? 0} items
                </span>
              </div>

              <div className="divide-y divide-outline-variant">
                {order.items?.map((item) => {
                  const isCancelled = item.status === "CANCELLED_BY_ADMIN";
                  const amount = Number(item.originalAmount ?? Number(item.unitPrice) * item.quantity);
                  const cancelledBy = item.cancelledBy?.name ?? item.cancelledByUser?.name;

                  return (
                    <div key={item.id} className="flex flex-col gap-md py-md sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={cn(
                              "font-label-md text-label-md",
                              isCancelled ? "text-on-surface-variant line-through" : "text-on-surface",
                            )}
                          >
                            {item.menuItem?.name}
                          </p>
                          {isCancelled ? (
                            <span className="rounded bg-semantic_error-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-semantic_error-400">
                              Cancelled
                            </span>
                          ) : null}
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {item.quantity} x {currency(Number(item.unitPrice))}
                        </p>
                        {isCancelled && item.cancellationReason ? (
                          <div className="mt-1 space-y-1 font-body-sm text-body-sm text-semantic_error-400">
                            <p>
                              Reason: {item.cancellationReason.replaceAll("_", " ")} · Deducted {currency(amount)}
                            </p>
                            {item.cancellationNotes ? <p>Notes: {item.cancellationNotes}</p> : null}
                            {item.cancelledAt || cancelledBy ? (
                              <p className="text-on-surface-variant">
                                Audit: {cancelledBy ?? "Admin"}{" "}
                                {item.cancelledAt ? `· ${new Date(item.cancelledAt).toLocaleString()}` : ""}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>

                      {!isCancelled && item.status === "ACTIVE" ? (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            setCancelDialog({
                              order,
                              item,
                              reason: cancellationReasons[0].value,
                              notes: "",
                              confirmStep: false,
                            })
                          }
                          className="min-h-10 shrink-0 rounded-lg border-semantic_error-500/30 px-3 py-1 text-label-xs text-semantic_error-400"
                        >
                          Cancel Item
                        </Button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {cancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border-default bg-surface-base p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-border-default pb-4">
              <div>
                <h3 className="text-headline-sm font-bold text-text-primary">Cancel Order Item</h3>
                <p className="mt-1 text-body-sm text-text-secondary">
                  Table {getTableNumber(cancelDialog.order)} · #{cancelDialog.order.id.slice(-6).toUpperCase()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCancelDialog(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border-default bg-surface-raised text-text-secondary"
              >
                <MaterialIcon name="close" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-border-default bg-surface-raised p-4">
                <p className="font-label-md text-label-md text-text-primary">{cancelDialog.item.menuItem?.name}</p>
                <p className="text-body-sm text-text-secondary">
                  {cancelDialog.item.quantity} x {currency(Number(cancelDialog.item.unitPrice))}
                </p>
                <p className="mt-2 font-label-md text-label-md text-semantic_error-400">
                  Bill deduction preview: -{currency(Number(cancelDialog.item.unitPrice) * cancelDialog.item.quantity)}
                </p>
              </div>

              <label className="block space-y-2">
                <span className="font-label-sm text-label-sm text-text-secondary">Reason</span>
                <select
                  value={cancelDialog.reason}
                  onChange={(event) =>
                    setCancelDialog({ ...cancelDialog, reason: event.target.value, confirmStep: false })
                  }
                  className="h-12 w-full rounded-xl border border-border-default bg-surface-raised px-3 text-text-primary focus:border-accent-500 focus:outline-none"
                >
                  {cancellationReasons.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="font-label-sm text-label-sm text-text-secondary">Notes (optional)</span>
                <textarea
                  value={cancelDialog.notes}
                  onChange={(event) =>
                    setCancelDialog({ ...cancelDialog, notes: event.target.value, confirmStep: false })
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-border-default bg-surface-raised p-3 text-text-primary focus:border-accent-500 focus:outline-none"
                  placeholder="Complaint details or owner approval note"
                />
              </label>

              {cancelDialog.confirmStep ? (
                <div className="rounded-xl border border-semantic_error-500/30 bg-semantic_error-500/10 p-3 text-body-sm text-semantic_error-400">
                  Confirm again to permanently mark this item as Cancelled By Restaurant. This action is audit logged.
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCancelDialog(null)}
                className="min-h-11 rounded-xl"
              >
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleCancelItem}
                disabled={cancellingItemId === cancelDialog.item.id}
                className="min-h-11 rounded-xl bg-semantic_error-500 text-white hover:bg-semantic_error-400"
              >
                {cancellingItemId === cancelDialog.item.id ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader label="" />
                    Cancelling...
                  </span>
                ) : cancelDialog.confirmStep ? (
                  "Confirm Cancellation"
                ) : (
                  "Review Cancellation"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
