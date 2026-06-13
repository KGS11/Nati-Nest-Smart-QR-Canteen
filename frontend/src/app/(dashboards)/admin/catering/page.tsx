"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { ApiResponse, ClientApiError } from "@/types/api";
import { CateringLead, CateringLeadStatus } from "@/types/domain";

const statuses: CateringLeadStatus[] = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST"];

export default function AdminCateringPage() {
  const [items, setItems] = useState<CateringLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<ApiResponse<{ items: CateringLead[] }>>(
        "/catering/leads",
      );
      setItems(response.data.data.items);
    } catch (err) {
      const clientError = err as ClientApiError;
      setError(clientError.message || "Unable to load catering leads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (lead: CateringLead, status: CateringLeadStatus) => {
    await apiClient.patch(`/catering/leads/${lead.id}/status`, { status });
    await load();
  };

  const exportCsv = async () => {
    setExporting(true);
    setError(null);
    try {
      const response = await apiClient.get<Blob>("/catering/leads/export", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "catering-leads.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const clientError = err as ClientApiError;
      setError(clientError.message || "Unable to export catering leads.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-400">Admin</p>
          <h1 className="text-2xl font-bold text-zinc-100">Catering Leads</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Follow up on post-feedback catering requests.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={exporting}
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-zinc-700 px-4 text-sm font-semibold text-zinc-100"
        >
          {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </header>

      {loading ? <p className="text-sm text-zinc-400">Loading leads...</p> : null}
      {error ? (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}
      {!loading && !error && !items.length ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
          No catering leads yet.
        </div>
      ) : null}

      <div className="grid gap-4">
        {items.map((lead) => (
          <article key={lead.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-zinc-100">{lead.name}</h2>
                <p className="text-sm text-zinc-400">
                  {lead.phone} - {lead.eventType}
                </p>
                <p className="mt-2 text-sm text-zinc-300">
                  {new Date(lead.eventDate).toLocaleDateString()} - {lead.guestCount} guests - {lead.location}
                </p>
                {lead.notes ? <p className="mt-2 text-sm text-zinc-400">{lead.notes}</p> : null}
              </div>
              <select
                value={lead.status}
                onChange={(event) => updateStatus(lead, event.target.value as CateringLeadStatus)}
                className="min-h-12 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100"
                aria-label={`Update status for ${lead.name}`}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
