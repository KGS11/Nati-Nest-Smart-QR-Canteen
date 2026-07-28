"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MaterialIcon } from "@/components/stitch/MaterialIcon";
import { useSocket } from "@/hooks/useSocket";
import { apiClient } from "@/lib/api-client";
import { ApiResponse, ClientApiError } from "@/types/api";
import { RestaurantTable } from "@/types/table.types";

interface TableAssignment {
  tableId: string;
  tableNumber: string;
  activeSessionCount: number;
  waiterName: string | null;
  kitchenStaffName: string | null;
}

interface StaffChipProps {
  name: string | null;
  tone: "waiter" | "kitchen";
}

const toAssignment = (table: RestaurantTable): TableAssignment => ({
  tableId: table.id,
  tableNumber: table.tableNumber,
  activeSessionCount: table.activeSessionCount ?? table._count?.sessions ?? 0,
  waiterName: table.activeAssignment?.waiterName ?? null,
  kitchenStaffName: table.activeAssignment?.kitchenStaffName ?? null,
});

function StaffChip({ name, tone }: StaffChipProps) {
  if (!name) {
    return (
      <Badge
        variant="warning"
        className="min-w-0 max-w-full overflow-hidden bg-warning-500/15 px-1.5 py-[1px] text-[10px] font-bold leading-4 text-warning-400 shadow-none"
      >
        <span className="block truncate">Unassigned</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={
        tone === "waiter"
          ? "min-w-0 max-w-full overflow-hidden bg-info-500/15 px-1.5 py-[1px] text-[10px] font-bold leading-4 text-info-400 shadow-none"
          : "min-w-0 max-w-full overflow-hidden bg-semantic_success-500/15 px-1.5 py-[1px] text-[10px] font-bold leading-4 text-semantic_success-400 shadow-none"
      }
      title={name}
    >
      <span className="block truncate">{name}</span>
    </Badge>
  );
}

function AssignmentSkeleton() {
  return (
    <div className="divide-y divide-border-default/70 rounded-lg bg-surface-base/50">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="grid gap-1.5 px-3 py-2">
          <div className="h-4 w-20 animate-pulse rounded bg-surface-overlay" />
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <div className="h-5 animate-pulse rounded-md bg-surface-overlay" />
            <div className="h-5 animate-pulse rounded-md bg-surface-overlay" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LiveTableAssignmentsWidget() {
  const { socket } = useSocket();
  const [assignments, setAssignments] = useState<TableAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await apiClient.get<ApiResponse<RestaurantTable[]>>("/tables");
      const activeAssignments = response.data.data
        .map(toAssignment)
        .filter((assignment) => assignment.activeSessionCount > 0)
        .sort((a, b) =>
          a.tableNumber.localeCompare(b.tableNumber, undefined, {
            numeric: true,
            sensitivity: "base",
          }),
        );

      setAssignments(activeAssignments);
      setError(null);
    } catch (fetchError) {
      const clientError = fetchError as ClientApiError;
      setError(clientError.message || "Unable to load table assignments.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void fetchAssignments();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [fetchAssignments]);

  useEffect(() => {
    if (!socket) return;

    const refresh = () => {
      void fetchAssignments();
    };

    socket.on("waiter:assignment_accepted", refresh);
    socket.on("order:claimed:kitchen", refresh);
    socket.on("order:reassigned", refresh);
    socket.on("order:released", refresh);
    socket.on("payment:completed", refresh);
    socket.on("table:available", refresh);

    return () => {
      socket.off("waiter:assignment_accepted", refresh);
      socket.off("order:claimed:kitchen", refresh);
      socket.off("order:reassigned", refresh);
      socket.off("order:released", refresh);
      socket.off("payment:completed", refresh);
      socket.off("table:available", refresh);
    };
  }, [fetchAssignments, socket]);

  const visibleAssignments = useMemo(() => assignments.slice(0, 6), [assignments]);

  return (
    <Card className="h-full overflow-hidden border-border-default bg-surface-raised shadow-sm">
      <div className="flex flex-col gap-2 border-b border-border-default/70 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-display-xs font-bold text-text-primary">Live Table Assignments</h3>
          <p className="mt-0.5 text-label-xs text-text-tertiary">
            Current waiter and kitchen responsibility
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-semantic_success-500/12 px-2.5 py-0.5 text-label-xs font-bold text-semantic_success-400">
          <span className="h-1.5 w-1.5 rounded-full bg-semantic_success-500 shadow-[0_0_0_3px_rgba(34,197,94,0.14)]" />
          {assignments.length} Active Tables
        </span>
      </div>

      <div className="p-2.5">
        {isLoading ? (
          <AssignmentSkeleton />
        ) : error ? (
          <div className="rounded-lg border border-semantic_error-500/20 bg-semantic_error-500/5 p-3">
            <p className="text-label-sm font-semibold text-semantic_error-300">{error}</p>
            <button
              type="button"
              onClick={() => void fetchAssignments()}
              className="mt-2 text-label-xs font-bold text-brand-500 hover:text-brand-400"
            >
              Retry
            </button>
          </div>
        ) : visibleAssignments.length === 0 ? (
          <div className="rounded-lg bg-surface-base/50 py-6 text-center text-label-sm font-medium text-text-tertiary">
            No active tables
          </div>
        ) : (
          <div className="divide-y divide-border-default/70 overflow-hidden rounded-lg bg-surface-base/50">
            {visibleAssignments.map((assignment) => (
              <div
                key={assignment.tableId}
                className="grid gap-1.5 px-3 py-2 transition-colors hover:bg-surface-overlay/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <MaterialIcon name="table_restaurant" className="text-[17px]" />
                    </span>
                    <p className="truncate text-label-md font-black text-primary">
                      Table {assignment.tableNumber}
                    </p>
                  </div>
                  <span className="rounded-full bg-semantic_success-500/12 px-2 py-[1px] text-[10px] font-bold leading-4 text-semantic_success-400">
                    Live
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  <div className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] items-center gap-1.5 rounded-md bg-surface-raised/55 px-2 py-1">
                    <span className="flex min-w-0 items-center gap-1.5 text-label-xs font-semibold text-text-tertiary">
                      <MaterialIcon name="room_service" className="shrink-0 text-[15px] text-info-400" />
                      Waiter
                    </span>
                    <span className="flex min-w-0 justify-end overflow-hidden">
                      <StaffChip name={assignment.waiterName} tone="waiter" />
                    </span>
                  </div>
                  <div className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] items-center gap-1.5 rounded-md bg-surface-raised/55 px-2 py-1">
                    <span className="flex min-w-0 items-center gap-1.5 text-label-xs font-semibold text-text-tertiary">
                      <MaterialIcon name="soup_kitchen" className="shrink-0 text-[15px] text-semantic_success-400" />
                      Kitchen
                    </span>
                    <span className="flex min-w-0 justify-end overflow-hidden">
                      <StaffChip name={assignment.kitchenStaffName} tone="kitchen" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
