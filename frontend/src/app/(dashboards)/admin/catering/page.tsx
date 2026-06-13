"use client";

import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/admin/shared/PageHeader";
import Pagination from "@/components/admin/shared/Pagination";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useExport } from "@/hooks/useExport";
import apiClient from "@/lib/api-client";
import { ApiResponse, ClientApiError } from "@/types/api";
import { CateringLead, CateringLeadStatus } from "@/types/domain";

interface CateringPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type FilterStatus = CateringLeadStatus | "ALL";
interface CateringListPayload {
  items?: CateringLead[];
  pagination?: CateringPagination;
}

const statuses: FilterStatus[] = ["ALL", "NEW", "CONTACTED", "QUOTED", "WON", "LOST"];

const badgeVariant = (status: CateringLeadStatus) => {
  if (status === "NEW") return "warning";
  if (status === "CONTACTED" || status === "QUOTED") return "info";
  if (status === "WON") return "success";
  return "danger";
};

const relativeTime = (dateString: string) => {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  return `${Math.floor(hours / 24)} days ago`;
};

export default function AdminCateringPage() {
  const [items, setItems] = useState<CateringLead[]>([]);
  const [pagination, setPagination] = useState<CateringPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { downloadExport, isExporting, error: exportError } = useExport();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<ApiResponse<CateringListPayload>>(
        "/catering/enquiries",
        {
          params: {
            status: filter === "ALL" ? undefined : filter,
            search: debouncedSearch || undefined,
            page,
            limit: 20,
          },
        },
      );
      setItems(response.data.data.items ?? []);
      setPagination(response.data.data.pagination ?? null);
    } catch (err) {
      const clientError = err as ClientApiError;
      setError(clientError.message || "Unable to load catering enquiries.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filter, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (lead: CateringLead, status: CateringLeadStatus) => {
    const previousItems = items;
    setUpdatingId(lead.id);
    setItems((current) => current.map((item) => (item.id === lead.id ? { ...item, status } : item)));
    try {
      await apiClient.patch(`/catering/enquiries/${lead.id}/status`, { status });
    } catch (err) {
      const clientError = err as ClientApiError;
      setItems(previousItems);
      setError(clientError.message || "Unable to update enquiry.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 text-zinc-100">
      <PageHeader
        title="Catering Enquiries"
        subtitle={`${pagination?.total ?? 0} total enquiries`}
        action={{
          label: isExporting ? "Exporting..." : "Export Excel",
          onClick: () => void downloadExport({ type: "catering", format: "xlsx", filter: "this_month" }),
        }}
      />

      <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                setFilter(status);
                setPage(1);
              }}
              className={`min-h-11 rounded-lg px-4 text-sm font-bold ${
                filter === status ? "bg-amber-500 text-zinc-950" : "bg-zinc-800 text-zinc-300"
              }`}
            >
              {status === "ALL" ? "All" : status}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or phone..."
          className="min-h-11 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-zinc-100 outline-none focus:border-amber-500"
        />
      </div>

      {exportError ? (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {exportError}
        </div>
      ) : null}
      {error ? (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900" />
          ))}
        </div>
      ) : !items.length ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-lg font-bold text-zinc-100">No enquiries yet</p>
          <p className="mt-2 text-sm text-zinc-400">Catering enquiries will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((lead) => (
            <article key={lead.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-zinc-100">{lead.name}</h2>
                  <p className="mt-1 text-sm text-zinc-400">{lead.phone}</p>
                </div>
                <Badge variant={badgeVariant(lead.status)} size="sm">{lead.status}</Badge>
              </div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                <p>{new Date(lead.eventDate).toLocaleDateString()} - {lead.guestCount} guests</p>
                <p>{lead.eventType} - {lead.location}</p>
                {lead.notes ? <p className="line-clamp-2 text-xs text-zinc-500">{lead.notes}</p> : null}
                <p className="text-xs text-zinc-600">Received {relativeTime(lead.createdAt)}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {lead.status === "NEW" ? (
                  <Button
                    type="button"
                    disabled={updatingId === lead.id}
                    onClick={() => void updateStatus(lead, "CONTACTED")}
                    className="min-h-10 border border-zinc-700 bg-transparent text-zinc-100"
                  >
                    Mark Contacted
                  </Button>
                ) : null}
                {lead.status === "CONTACTED" || lead.status === "QUOTED" ? (
                  <Button
                    type="button"
                    disabled={updatingId === lead.id}
                    onClick={() => void updateStatus(lead, "WON")}
                    className="min-h-10 border border-zinc-700 bg-transparent text-zinc-100"
                  >
                    Mark Closed
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      {pagination ? <Pagination pagination={pagination} onPageChange={setPage} /> : null}
    </div>
  );
}
