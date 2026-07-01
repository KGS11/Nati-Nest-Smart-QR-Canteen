"use client";

import { useState } from "react";
import apiClient from "@/lib/api-client";
import { ClientApiError } from "@/types/api";

export type ExportFormat = "csv" | "xlsx";
export type ExportType =
  | "orders"
  | "payments"
  | "revenue"
  | "feedback"
  | "tables"
  | "catering"
  | "staff"
  | "cancelled-items";

interface DownloadExportParams {
  type: ExportType;
  format: ExportFormat;
  filter?: string;
  startDate?: string;
  endDate?: string;
}

const extensionFor = (format: ExportFormat) => (format === "xlsx" ? "xlsx" : "csv");

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadExport = async (params: DownloadExportParams) => {
    setIsExporting(true);
    setError(null);

    try {
      const response = await apiClient.get<Blob>(`/reports/export/${params.type}`, {
        params: {
          format: params.format,
          filter: params.filter,
          startDate: params.startDate,
          endDate: params.endDate,
        },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${params.type}-export.${extensionFor(params.format)}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const clientError = err as ClientApiError;
      setError(clientError.message || "Unable to download export.");
    } finally {
      setIsExporting(false);
    }
  };

  return { downloadExport, isExporting, error };
}
