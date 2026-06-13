"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/admin/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Loader from "@/components/ui/Loader";
import apiClient from "@/lib/api-client";
import { ApiResponse, ClientApiError } from "@/types/api";
import { DashboardSummary, PopularItem } from "@/types/domain";

type Preset = "today" | "week" | "month" | "custom";
type GroupBy = "day" | "week" | "month";

interface RevenueReport {
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    averageOrderValue: number;
    cashRevenue: number;
    upiRevenue: number;
  };
  breakdown: Array<{
    date: string;
    totalRevenue: number;
    transactionCount: number;
    cashRevenue: number;
    upiRevenue: number;
  }>;
}

interface OrderReport {
  summary: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    cancellationRate: number;
    avgAcceptanceTimeMinutes: number;
    avgPreparationTimeMinutes: number;
    avgTotalTimeMinutes: number;
    ordersByStatus: Record<string, number>;
  };
  peakHours: Array<{ hour: number; label: string; orderCount: number }>;
  breakdown: Array<{
    date: string;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    completionRate: number;
  }>;
}

interface PopularItemsReport {
  items: PopularItem[];
  totalUniqueItems: number;
}

interface TableReport {
  summary: {
    totalTables: number;
    totalSessions: number;
    totalCompletedSessions: number;
    mostUtilizedTable: { tableNumber: string; sessionCount: number } | null;
    highestRevenueTable: { tableNumber: string; totalRevenue: number } | null;
    overallAvgSessionDurationMinutes: number;
  };
  tables: Array<{
    tableId: string;
    tableNumber: string;
    totalSessions: number;
    totalRevenue: number;
    avgOrdersPerSession: number;
  }>;
}

interface FeedbackReport {
  summary: {
    totalFeedback: number;
    averageRating: number;
    feedbackSubmissionRate: number;
    totalClosedSessions: number;
  };
  ratingDistribution: Record<string, { count: number; percentage: number }>;
  recentComments: Array<{
    rating: number;
    comment: string | null;
    tableNumber: string;
    createdAt: string;
  }>;
}

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const getPresetRange = (preset: Preset) => {
  const end = new Date();
  const start = new Date();

  if (preset === "week") {
    start.setDate(end.getDate() - 6);
  } else if (preset === "month") {
    start.setDate(end.getDate() - 29);
  }

  return { startDate: isoDate(start), endDate: isoDate(end) };
};

function MetricTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-zinc-100">{value}</p>
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
  display,
}: {
  label: string;
  value: number;
  max: number;
  display?: string;
}) {
  return (
    <div className="grid grid-cols-[96px_1fr_90px] items-center gap-3 text-sm">
      <span className="truncate text-zinc-400">{label}</span>
      <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-amber-500"
          style={{ width: `${max > 0 ? Math.max(4, (value / max) * 100) : 0}%` }}
        />
      </div>
      <span className="text-right font-semibold text-zinc-200">{display ?? value}</span>
    </div>
  );
}

export default function AdminReportsPage() {
  const [preset, setPreset] = useState<Preset>("week");
  const [range, setRange] = useState(getPresetRange("week"));
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [orders, setOrders] = useState<OrderReport | null>(null);
  const [popular, setPopular] = useState<PopularItemsReport | null>(null);
  const [tables, setTables] = useState<TableReport | null>(null);
  const [feedback, setFeedback] = useState<FeedbackReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const groupBy: GroupBy = preset === "month" ? "day" : "day";

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = { ...range, groupBy };
      const [summaryRes, revenueRes, ordersRes, popularRes, tablesRes, feedbackRes] =
        await Promise.all([
          apiClient.get<ApiResponse<DashboardSummary>>("/reports/dashboard"),
          apiClient.get<ApiResponse<RevenueReport>>("/reports/revenue", { params }),
          apiClient.get<ApiResponse<OrderReport>>("/reports/orders", { params }),
          apiClient.get<ApiResponse<PopularItemsReport>>("/reports/popular-items", {
            params: { ...range, limit: 10 },
          }),
          apiClient.get<ApiResponse<TableReport>>("/reports/tables", { params: range }),
          apiClient.get<ApiResponse<FeedbackReport>>("/reports/feedback", { params: range }),
        ]);

      setSummary(summaryRes.data.data);
      setRevenue(revenueRes.data.data);
      setOrders(ordersRes.data.data);
      setPopular(popularRes.data.data);
      setTables(tablesRes.data.data);
      setFeedback(feedbackRes.data.data);
    } catch (reportError) {
      const clientError = reportError as ClientApiError;
      setError(clientError.message || "Unable to load reports.");
    } finally {
      setIsLoading(false);
    }
  }, [groupBy, range]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const maxRevenue = useMemo(
    () => Math.max(1, ...(revenue?.breakdown.map((item) => item.totalRevenue) ?? [0])),
    [revenue],
  );
  const maxPopular = useMemo(
    () => Math.max(1, ...(popular?.items.map((item) => item.totalQuantitySold) ?? [0])),
    [popular],
  );
  const maxTableRevenue = useMemo(
    () => Math.max(1, ...(tables?.tables.map((table) => table.totalRevenue) ?? [0])),
    [tables],
  );

  const setPresetRange = (nextPreset: Preset) => {
    setPreset(nextPreset);
    if (nextPreset !== "custom") {
      setRange(getPresetRange(nextPreset));
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-zinc-950 p-6 text-zinc-100">
      <PageHeader title="Reports" subtitle={`${range.startDate} to ${range.endDate}`} />

      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 lg:flex-row lg:items-end">
        <div className="flex flex-wrap gap-2">
          {(["today", "week", "month", "custom"] as Preset[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPresetRange(item)}
              className={`min-h-10 rounded-lg px-4 text-sm font-bold capitalize ${
                preset === item
                  ? "bg-amber-500 text-zinc-950"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <Input
            label="Start Date"
            type="date"
            value={range.startDate}
            onChange={(event) => {
              setPreset("custom");
              setRange((current) => ({ ...current, startDate: event.target.value }));
            }}
          />
          <Input
            label="End Date"
            type="date"
            value={range.endDate}
            onChange={(event) => {
              setPreset("custom");
              setRange((current) => ({ ...current, endDate: event.target.value }));
            }}
          />
        </div>
        <Button type="button" onClick={() => void loadReports()}>
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="h-24 bg-zinc-900 border border-zinc-850 rounded-xl animate-pulse" />
            <div className="h-24 bg-zinc-900 border border-zinc-850 rounded-xl animate-pulse" />
            <div className="h-24 bg-zinc-900 border border-zinc-850 rounded-xl animate-pulse" />
            <div className="h-24 bg-zinc-900 border border-zinc-850 rounded-xl animate-pulse" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-80 bg-zinc-900 border border-zinc-850 rounded-xl animate-pulse" />
            <div className="h-80 bg-zinc-900 border border-zinc-850 rounded-xl animate-pulse" />
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <p className="font-semibold text-red-300">{error}</p>
          <Button type="button" className="mt-4" onClick={() => void loadReports()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Today Revenue" value={currency(summary?.today.revenue ?? 0)} />
            <MetricTile label="Today Orders" value={summary?.today.orders ?? 0} />
            <MetricTile label="Active Sessions" value={summary?.liveStatus.activeSessions ?? 0} />
            <MetricTile label="Average Rating" value={summary?.allTime.overallAvgRating ?? 0} />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="text-lg font-bold">Revenue Trend</h2>
              <div className="mt-4 grid gap-3">
                {revenue?.breakdown.length ? (
                  revenue.breakdown.map((item) => (
                    <BarRow
                      key={item.date}
                      label={item.date}
                      value={item.totalRevenue}
                      max={maxRevenue}
                      display={currency(item.totalRevenue)}
                    />
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No revenue in this range.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="text-lg font-bold">Orders by Status</h2>
              <div className="mt-4 grid gap-3">
                {Object.entries(orders?.summary.ordersByStatus ?? {}).map(([status, count]) => (
                  <BarRow
                    key={status}
                    label={status}
                    value={count}
                    max={orders?.summary.totalOrders || 1}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="text-lg font-bold">Revenue</h2>
              <div className="mt-4 grid gap-3 text-sm text-zinc-300">
                <p>Total: {currency(revenue?.summary.totalRevenue ?? 0)}</p>
                <p>Transactions: {revenue?.summary.totalTransactions ?? 0}</p>
                <p>Average order value: {currency(revenue?.summary.averageOrderValue ?? 0)}</p>
                <p>Cash: {currency(revenue?.summary.cashRevenue ?? 0)}</p>
                <p>UPI: {currency(revenue?.summary.upiRevenue ?? 0)}</p>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="text-lg font-bold">Orders</h2>
              <div className="mt-4 grid gap-3 text-sm text-zinc-300">
                <p>Total: {orders?.summary.totalOrders ?? 0}</p>
                <p>Completed: {orders?.summary.completedOrders ?? 0}</p>
                <p>Cancelled: {orders?.summary.cancelledOrders ?? 0}</p>
                <p>Cancellation rate: {orders?.summary.cancellationRate ?? 0}%</p>
                <p>Avg prep: {orders?.summary.avgPreparationTimeMinutes ?? 0} mins</p>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="text-lg font-bold">Feedback</h2>
              <div className="mt-4 grid gap-3 text-sm text-zinc-300">
                <p>Total feedback: {feedback?.summary.totalFeedback ?? 0}</p>
                <p>Average rating: {feedback?.summary.averageRating ?? 0}</p>
                <p>Submission rate: {feedback?.summary.feedbackSubmissionRate ?? 0}%</p>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <BarRow
                    key={rating}
                    label={`${rating} stars`}
                    value={feedback?.ratingDistribution[String(rating)]?.count ?? 0}
                    max={feedback?.summary.totalFeedback || 1}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="text-lg font-bold">Popular Items</h2>
              <div className="mt-4 grid gap-3">
                {popular?.items.length ? (
                  popular.items.map((item) => (
                    <BarRow
                      key={item.menuItemId}
                      label={item.name}
                      value={item.totalQuantitySold}
                      max={maxPopular}
                      display={`${item.totalQuantitySold} sold`}
                    />
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No item sales in this range.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="text-lg font-bold">Tables</h2>
              <div className="mt-4 grid gap-3">
                {tables?.tables.slice(0, 10).length ? (
                  tables.tables.slice(0, 10).map((table) => (
                    <BarRow
                      key={table.tableId}
                      label={`Table ${table.tableNumber}`}
                      value={table.totalRevenue}
                      max={maxTableRevenue}
                      display={currency(table.totalRevenue)}
                    />
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No table sessions in this range.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
