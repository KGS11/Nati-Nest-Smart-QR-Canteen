"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Loader from "@/components/ui/Loader";
import { ExportFormat, ExportType, useExport } from "@/hooks/useExport";
import apiClient from "@/lib/api-client";
import { ApiResponse, ClientApiError } from "@/types/api";

interface ReportViewerModalProps {
  reportType: ExportType;
  title: string;
  startDate: string;
  endDate: string;
  exportFilter: string;
  onClose: () => void;
  // Preloaded data
  revenueData?: any;
  ordersData?: any;
  tablesData?: any;
  feedbackData?: any;
  popularData?: any;
}

interface TableColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  format?: (value: any, row?: any) => string | number | React.ReactNode;
}

const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function ReportViewerModal({
  reportType,
  title,
  startDate,
  endDate,
  exportFilter,
  onClose,
  revenueData,
  ordersData,
  tablesData,
  feedbackData,
  popularData,
}: ReportViewerModalProps) {
  const [fetchedData, setFetchedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const { downloadExport, isExporting } = useExport();

  // Load dynamic report data if not preloaded
  useEffect(() => {
    if (reportType === "staff" || reportType === "cancelled-items") {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          if (reportType === "staff") {
            const res = await apiClient.get<ApiResponse<any>>("/reports/waiter-performance");
            setFetchedData(res.data.data);
          } else if (reportType === "cancelled-items") {
            const res = await apiClient.get<ApiResponse<any>>("/reports/cancelled-items", {
              params: { startDate, endDate },
            });
            setFetchedData(res.data.data);
          }
        } catch (err) {
          const clientErr = err as ClientApiError;
          setError(clientErr.message || "Failed to load report data.");
        } finally {
          setIsLoading(false);
        }
      };
      void fetchData();
    }
  }, [reportType, startDate, endDate]);

  // Determine Summary Metrics & Table Config based on reportType
  const { metrics, columns, rows } = useMemo(() => {
    let metricsList: Array<{ label: string; value: string | number }> = [];
    let cols: TableColumn[] = [];
    let rawRows: any[] = [];

    switch (reportType) {
      case "revenue":
      case "payments": {
        const data = revenueData;
        if (data) {
          metricsList = [
            { label: "Total Revenue", value: currency(data.summary?.totalRevenue ?? 0) },
            { label: "Transactions", value: data.summary?.totalTransactions ?? 0 },
            { label: "Avg Order Value", value: currency(data.summary?.averageOrderValue ?? 0) },
            { label: "Cash Revenue", value: currency(data.summary?.cashRevenue ?? 0) },
            { label: "UPI Revenue", value: currency(data.summary?.upiRevenue ?? 0) },
          ];
          cols = [
            { key: "date", label: "Date" },
            { key: "transactionCount", label: "Transactions", align: "right" },
            { key: "cashRevenue", label: "Cash", align: "right", format: (v) => currency(v) },
            { key: "upiRevenue", label: "UPI", align: "right", format: (v) => currency(v) },
            { key: "totalRevenue", label: "Total Revenue", align: "right", format: (v) => currency(v) },
          ];
          rawRows = data.breakdown ?? [];
        }
        break;
      }
      case "orders": {
        const data = ordersData;
        if (data) {
          metricsList = [
            { label: "Total Orders", value: data.summary?.totalOrders ?? 0 },
            { label: "Completed Orders", value: data.summary?.completedOrders ?? 0 },
            { label: "Cancelled Orders", value: data.summary?.cancelledOrders ?? 0 },
            { label: "Cancellation Rate", value: `${data.summary?.cancellationRate ?? 0}%` },
            { label: "Avg Prep Time", value: `${data.summary?.avgPreparationTimeMinutes ?? 0} mins` },
          ];
          cols = [
            { key: "date", label: "Date" },
            { key: "totalOrders", label: "Total Orders", align: "right" },
            { key: "completedOrders", label: "Completed", align: "right" },
            { key: "cancelledOrders", label: "Cancelled", align: "right" },
            { key: "completionRate", label: "Completion Rate", align: "right", format: (v) => `${v}%` },
          ];
          rawRows = data.breakdown ?? [];
        }
        break;
      }
      case "tables": {
        const data = tablesData;
        if (data) {
          metricsList = [
            { label: "Total Tables", value: data.summary?.totalTables ?? 0 },
            { label: "Total Sessions", value: data.summary?.totalSessions ?? 0 },
            { label: "Completed Sessions", value: data.summary?.totalCompletedSessions ?? 0 },
            {
              label: "Most Utilized Table",
              value: data.summary?.mostUtilizedTable
                ? `Table ${data.summary.mostUtilizedTable.tableNumber} (${data.summary.mostUtilizedTable.sessionCount} sessions)`
                : "N/A",
            },
            {
              label: "Highest Revenue Table",
              value: data.summary?.highestRevenueTable
                ? `Table ${data.summary.highestRevenueTable.tableNumber} (${currency(data.summary.highestRevenueTable.totalRevenue)})`
                : "N/A",
            },
          ];
          cols = [
            { key: "tableNumber", label: "Table Number", format: (v) => `Table ${v}` },
            { key: "totalSessions", label: "Total Sessions", align: "right" },
            { key: "avgOrdersPerSession", label: "Avg Orders/Session", align: "right" },
            { key: "totalRevenue", label: "Total Revenue", align: "right", format: (v) => currency(v) },
          ];
          rawRows = data.tables ?? [];
        }
        break;
      }
      case "feedback": {
        const data = feedbackData;
        if (data) {
          metricsList = [
            { label: "Total Feedback", value: data.summary?.totalFeedback ?? 0 },
            { label: "Average Rating", value: `⭐ ${data.summary?.averageRating ?? 0}` },
            { label: "Submission Rate", value: `${data.summary?.feedbackSubmissionRate ?? 0}%` },
          ];
          cols = [
            { key: "tableNumber", label: "Table Number", format: (v) => `Table ${v}` },
            { key: "rating", label: "Rating", align: "center", format: (v) => `${v} ⭐` },
            { key: "comment", label: "Comment", format: (v) => v || "No comment" },
            { key: "createdAt", label: "Date", format: (v) => new Date(v).toLocaleString() },
          ];
          rawRows = data.recentComments ?? [];
        }
        break;
      }
      case "staff": {
        const data = fetchedData;
        if (data) {
          const list = Array.isArray(data) ? data : (data.staff || data.users || []);
          metricsList = [
            { label: "Total Active Staff", value: list.length },
            {
              label: "Total Delivered Orders",
              value: list.reduce((sum: number, w: any) => sum + Number(w.ordersDelivered ?? w.completedOrders ?? w.paymentsVerifiedCount ?? 0), 0),
            },
            {
              label: "Total Tips",
              value: currency(
                list.reduce((sum: number, w: any) => sum + Number(w.tipsEarned ?? w.tipsReceived ?? 0), 0)
              ),
            },
          ];
          cols = [
            { key: "name", label: "Staff Name", format: (_, row) => row.waiterName || row.name || "N/A" },
            { key: "phone", label: "Phone", format: (_, row) => row.waiterPhone || row.phone || "N/A" },
            { key: "role", label: "Role", format: (_, row) => row.role || (row.waiterName ? "SERVER" : "STAFF") },
            { key: "ordersDelivered", label: "Delivered Orders", align: "right", format: (_, row) => row.ordersDelivered ?? row.completedOrders ?? row.paymentsVerifiedCount ?? 0 },
            { key: "avgDeliveryTime", label: "Avg Delivery Time", align: "right", format: (_, row) => `${row.avgDeliveryTime ?? 0} mins` },
            { key: "tipsEarned", label: "Total Tips", align: "right", format: (_, row) => currency(row.tipsEarned ?? row.tipsReceived ?? 0) },
          ];
          rawRows = list;
        }
        break;
      }
      case "cancelled-items": {
        const data = fetchedData;
        if (data) {
          const itemsList = data.recentCancellations || data.cancelledItems || (Array.isArray(data) ? data : []);
          metricsList = [
            { label: "Total Cancelled Items", value: data.summary?.totalCancelledItems ?? itemsList.length },
            { label: "Total Amount Lost", value: currency(data.summary?.totalAmountDeducted ?? data.totalAmountLost ?? 0) },
          ];
          cols = [
            { key: "name", label: "Item Name", format: (_, row) => row.name || row.menuItem?.name || "N/A" },
            { key: "tableNumber", label: "Table", format: (_, row) => `Table ${row.tableNumber || row.order?.session?.table?.tableNumber || "N/A"}` },
            { key: "quantity", label: "Qty", align: "right" },
            { key: "amountDeducted", label: "Amount Lost", align: "right", format: (v, row) => currency(v ?? row.amount ?? 0) },
            { key: "reason", label: "Reason", format: (v, row) => v || row.cancellationReason || "N/A" },
            { key: "cancelledBy", label: "Cancelled By", format: (v, row) => (typeof v === "string" ? v : v?.name) || row.cancelledBy?.name || "Admin" },
            { key: "cancelledAt", label: "Date", format: (v) => v ? new Date(v).toLocaleString() : "N/A" },
          ];
          rawRows = itemsList;
        }
        break;
      }
      default: {
        rawRows = [];
        break;
      }
    }

    return { metrics: metricsList, columns: cols, rows: rawRows };
  }, [reportType, revenueData, ordersData, tablesData, feedbackData, popularData, fetchedData]);

  // Filtering & Sorting
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter((row: any) =>
      Object.values(row).some((val) =>
        String(val ?? "").toLowerCase().includes(term)
      )
    );
  }, [rows, searchTerm]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;
    return [...filteredRows].sort((a: any, b: any) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      const comp = typeof valA === "number" ? valA - valB : String(valA).localeCompare(String(valB));
      return sortOrder === "asc" ? comp : -comp;
    });
  }, [filteredRows, sortKey, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const handleExport = (format: ExportFormat) => {
    void downloadExport({
      type: reportType,
      format,
      filter: exportFilter,
      startDate,
      endDate,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-border-default bg-surface-raised shadow-2xl overflow-hidden text-text-primary">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-default bg-surface-base px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-label-xs font-bold uppercase tracking-wider text-brand-500">Report Preview</span>
              <span className="text-text-tertiary">•</span>
              <span className="text-label-xs text-text-tertiary">{startDate} to {endDate}</span>
            </div>
            <h2 className="text-display-xs font-bold text-text-primary capitalize">{title} Report</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleExport("csv")}
              className="min-h-9 rounded-lg border border-border-default px-3 text-label-xs font-semibold text-text-secondary hover:text-text-primary disabled:opacity-50 transition-colors cursor-pointer"
            >
              CSV
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleExport("xlsx")}
              className="min-h-9 rounded-lg bg-brand-500 px-3 text-label-xs font-bold text-brand-950 hover:bg-brand-400 disabled:opacity-50 transition-colors cursor-pointer"
            >
              XLSX
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-default text-text-secondary hover:bg-surface-overlay hover:text-text-primary transition-colors text-display-xs font-bold cursor-pointer"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Metrics */}
          {metrics.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {metrics.map((m, idx) => (
                <div key={idx} className="rounded-xl border border-border-default bg-surface-base p-4">
                  <p className="text-label-xs font-bold uppercase tracking-wide text-text-tertiary">{m.label}</p>
                  <p className="mt-1 text-display-sm font-bold text-text-primary">{m.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Controls: Search & Record Count */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search report..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <p className="text-label-xs text-text-tertiary">
              Showing <span className="font-semibold text-text-secondary">{sortedRows.length}</span> records
            </p>
          </div>

          {/* Table / Loading / Error / Empty States */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader />
              <p className="mt-3 text-label-sm text-text-tertiary">Loading report data...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-semantic_error-500/20 bg-semantic_error-500/5 p-6 text-center">
              <p className="text-label-sm font-semibold text-semantic_error-400">{error}</p>
            </div>
          ) : paginatedRows.length === 0 ? (
            <div className="rounded-xl border border-border-default bg-surface-base p-12 text-center">
              <p className="text-body-sm text-text-tertiary">No data records found for this report and range.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border-default bg-surface-base">
              <table className="w-full text-left text-label-sm">
                <thead>
                  <tr className="border-b border-border-default bg-surface-raised text-text-tertiary">
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className={`cursor-pointer px-4 py-3 font-bold select-none hover:text-text-primary ${
                          col.align === "right"
                            ? "text-right"
                            : col.align === "center"
                            ? "text-center"
                            : "text-left"
                        }`}
                      >
                        <div
                          className={`inline-flex items-center gap-1.5 ${
                            col.align === "right" ? "flex-row-reverse" : ""
                          }`}
                        >
                          <span>{col.label}</span>
                          {sortKey === col.key && (
                            <span className="text-brand-500">{sortOrder === "asc" ? "▲" : "▼"}</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default/50 text-text-secondary">
                  {paginatedRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-surface-overlay/50 transition-colors">
                      {columns.map((col) => {
                        const rawVal = row[col.key];
                        const displayVal = col.format ? col.format(rawVal, row) : rawVal ?? "N/A";
                        return (
                          <td
                            key={col.key}
                            className={`px-4 py-3 font-medium ${
                              col.align === "right"
                                ? "text-right font-mono"
                                : col.align === "center"
                                ? "text-center"
                                : "text-left"
                            }`}
                          >
                            {displayVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Pagination */}
        {!isLoading && !error && sortedRows.length > 0 && (
          <div className="flex items-center justify-between border-t border-border-default bg-surface-base px-6 py-4">
            <p className="text-label-xs text-text-tertiary">
              Page <span className="font-semibold text-text-secondary">{currentPage}</span> of{" "}
              <span className="font-semibold text-text-secondary">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="min-h-9 px-3 text-label-xs"
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="min-h-9 px-3 text-label-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
