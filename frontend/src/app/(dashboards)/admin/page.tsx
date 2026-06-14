"use client";

import { useEffect, useMemo, useState } from "react";
import Loader from "@/components/common/Loader";
import { KitchenOrderCard } from "@/components/modules/kitchen/KitchenOrderCard";
import { MaterialIcon } from "@/components/stitch/MaterialIcon";
import { MetricCard } from "@/components/stitch/MetricCard";
import { StatePanel } from "@/components/stitch/StatePanel";
import { adminService } from "@/services/adminService";
import { kitchenService, KitchenOrdersPayload } from "@/services/kitchenService";
import { ClientApiError } from "@/types/api";
import { DashboardSummary, PopularItem } from "@/types/domain";
import apiClient from "@/lib/api-client";
import { ApiResponse } from "@/types/api";
import { StaffListResponse, StaffMember } from "@/types/staff.types";
import { Button } from "@/components/common/Button";
import { cn } from "@/utils/cn";

const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

export default function AdminPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [ordersPayload, setOrdersPayload] = useState<KitchenOrdersPayload | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Override UI states
  const [activeHistoryOrderId, setActiveHistoryOrderId] = useState<string | null>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [overrideSuccess, setOverrideSuccess] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      const [dashboard, popular, kitchenOrders, staffRes] = await Promise.all([
        adminService.getDashboardSummary(),
        adminService.getPopularItems(),
        kitchenService.getActiveOrders(),
        apiClient.get<ApiResponse<StaffListResponse>>("/staff"),
      ]);
      setSummary(dashboard);
      setPopularItems(popular);
      setOrdersPayload(kitchenOrders);
      setStaff(staffRes.data.data.items || []);
    } catch (err) {
      const clientError = err as ClientApiError;
      setError(clientError.message || "Unable to load dashboard data.");
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      await loadDashboard();
      setLoading(false);
    };
    init();
  }, []);

  const refreshActiveOrders = async () => {
    try {
      const kitchenOrders = await kitchenService.getActiveOrders();
      setOrdersPayload(kitchenOrders);
    } catch (err) {
      console.error("Failed to refresh active orders", err);
    }
  };

  const activeOrders = ordersPayload?.orders.slice(0, 3) ?? [];
  const allActiveOrders = ordersPayload?.orders ?? [];

  const kitchenStaff = useMemo(() => staff.filter((s) => s.role === "KITCHEN" && s.isActive), [staff]);
  const waiterStaff = useMemo(() => staff.filter((s) => s.role === "SERVER" && s.isActive), [staff]);

  const maxSold = useMemo(
    () => Math.max(1, ...popularItems.map((item) => item.totalQuantitySold)),
    [popularItems],
  );

  // Admin Override handlers
  const handleReassignKitchen = async (orderId: string, staffId: string) => {
    if (!staffId) return;
    setOverrideError(null);
    setOverrideSuccess(null);
    try {
      await adminService.reassignKitchen(orderId, staffId);
      setOverrideSuccess("Kitchen staff reassigned successfully.");
      await refreshActiveOrders();
    } catch (err: any) {
      setOverrideError(err.response?.data?.message || err.message || "Failed to reassign kitchen staff.");
    }
  };

  const handleReassignWaiter = async (orderId: string, staffId: string) => {
    if (!staffId) return;
    setOverrideError(null);
    setOverrideSuccess(null);
    try {
      await adminService.reassignWaiter(orderId, staffId);
      setOverrideSuccess("Waiter staff reassigned successfully.");
      await refreshActiveOrders();
    } catch (err: any) {
      setOverrideError(err.response?.data?.message || err.message || "Failed to reassign waiter staff.");
    }
  };

  const handleForceUnclaimKitchen = async (orderId: string) => {
    if (!confirm("Are you sure you want to force unclaim the kitchen staff for this order? Status will reset to PLACED.")) return;
    setOverrideError(null);
    setOverrideSuccess(null);
    try {
      await adminService.forceUnclaimKitchen(orderId);
      setOverrideSuccess("Kitchen claim removed successfully.");
      await refreshActiveOrders();
    } catch (err: any) {
      setOverrideError(err.response?.data?.message || err.message || "Failed to unclaim kitchen.");
    }
  };

  const handleForceUnclaimWaiter = async (orderId: string) => {
    if (!confirm("Are you sure you want to force unclaim the waiter for this order?")) return;
    setOverrideError(null);
    setOverrideSuccess(null);
    try {
      await adminService.forceUnclaimWaiter(orderId);
      setOverrideSuccess("Waiter claim removed successfully.");
      await refreshActiveOrders();
    } catch (err: any) {
      setOverrideError(err.response?.data?.message || err.message || "Failed to unclaim waiter.");
    }
  };

  const handleForceDeliver = async (orderId: string) => {
    if (!confirm("Are you sure you want to force deliver this order?")) return;
    setOverrideError(null);
    setOverrideSuccess(null);
    try {
      await adminService.forceDeliver(orderId);
      setOverrideSuccess("Order force delivered successfully.");
      await refreshActiveOrders();
    } catch (err: any) {
      setOverrideError(err.response?.data?.message || err.message || "Failed to force deliver order.");
    }
  };

  const handleViewHistory = async (orderId: string) => {
    setActiveHistoryOrderId(orderId);
    setHistoryLoading(true);
    setHistoryLogs([]);
    try {
      const logs = await adminService.getAssignmentHistory(orderId);
      setHistoryLogs(logs || []);
    } catch (err) {
      console.error("Failed to load assignment history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (overrideSuccess || overrideError) {
      const timer = setTimeout(() => {
        setOverrideSuccess(null);
        setOverrideError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [overrideSuccess, overrideError]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-44px)] items-center justify-center bg-surface">
        <Loader label="Loading admin dashboard..." />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop">
        <StatePanel
          tone="error"
          title="Dashboard unavailable"
          message={error || "The backend did not return dashboard data."}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-xl p-margin-mobile pb-24 md:p-margin-desktop">
      {/* Toast Alert Feedback */}
      {(overrideSuccess || overrideError) && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl border flex items-center justify-between gap-3 text-sm font-bold animate-bounce",
          overrideSuccess ? "bg-green-500 text-zinc-950 border-green-400" : "bg-red-500 text-white border-red-400"
        )}>
          <span>{overrideSuccess || overrideError}</span>
        </div>
      )}

      <section className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon="shopping_bag" label="Today's Orders" value={String(summary.today.orders)} meta="+Live" />
        <MetricCard
          icon="payments"
          label="Today's Revenue"
          value={currency(summary.today.revenue)}
          meta="Today"
          tone="secondary"
        />
        <MetricCard
          icon="pending_actions"
          label="Active Orders"
          value={String(summary.liveStatus.pendingOrders + summary.liveStatus.preparingOrders + summary.liveStatus.readyOrders)}
          meta="LIVE"
          tone="tertiary"
        />
        <MetricCard
          icon="table_restaurant"
          label="Table Occupancy"
          value={`${summary.liveStatus.occupiedTables}/${summary.allTime.totalTables}`}
          meta={`${summary.liveStatus.activeSessions} sessions`}
          tone="surface"
        />
      </section>

      <section className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-xl shadow-stitch lg:col-span-2">
          <div className="mb-xl flex items-center justify-between">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Revenue Snapshot</h3>
            <div className="rounded-lg bg-surface-container p-1">
              <button className="rounded-md bg-surface-container-lowest px-md py-1 font-label-sm text-label-sm text-on-surface shadow-sm">
                Daily
              </button>
            </div>
          </div>
          <div className="grid gap-md sm:grid-cols-3">
            <div className="rounded-lg bg-surface-container-low p-md">
              <p className="font-label-sm text-label-sm text-on-surface-variant">This Week</p>
              <p className="mt-xs font-headline-md text-headline-md text-primary">
                {currency(summary.thisWeek.revenue)}
              </p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-md">
              <p className="font-label-sm text-label-sm text-on-surface-variant">All-time Revenue</p>
              <p className="mt-xs font-headline-md text-headline-md text-primary">
                {currency(summary.allTime.totalRevenue)}
              </p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-md">
              <p className="font-label-sm text-label-sm text-on-surface-variant">Average Rating</p>
              <p className="mt-xs font-headline-md text-headline-md text-primary">
                {summary.allTime.overallAvgRating || "0.0"}
              </p>
            </div>
          </div>
          <div className="relative mt-xl h-48 overflow-hidden border-b border-l border-outline-variant">
            <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 400 100">
              <path d="M0,80 Q50,60 100,70 T200,30 T300,50 T400,10" fill="none" stroke="#9d4300" strokeLinecap="round" strokeWidth="3" />
              <path d="M0,80 Q50,60 100,70 T200,30 T300,50 T400,10 V100 H0 Z" fill="#9d4300" opacity="0.08" />
            </svg>
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-xl shadow-stitch">
          <h3 className="mb-xl font-headline-sm text-headline-sm text-on-surface">Top Selling Items</h3>
          {popularItems.length ? (
            <div className="space-y-lg">
              {popularItems.map((item) => (
                <div key={item.menuItemId} className="space-y-xs">
                  <div className="flex justify-between gap-md font-label-md text-label-md">
                    <span className="truncate text-on-surface">{item.name}</span>
                    <span className="shrink-0 text-on-surface-variant">{item.totalQuantitySold} units</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-container">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.max(8, (item.totalQuantitySold / maxSold) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <StatePanel title="No sales yet" message="Popular items will appear after paid orders are recorded." />
          )}
        </div>
      </section>

      {/* Realtime Active Orders Display */}
      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-stitch">
        <div className="flex items-center justify-between border-b border-outline-variant px-xl py-lg">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Recent Active Orders</h3>
          <span className="flex items-center gap-xs font-label-md text-label-md text-primary">
            <MaterialIcon name="notifications_active" className="text-[18px]" />
            Realtime
          </span>
        </div>
        <div className="grid gap-md p-lg lg:grid-cols-3">
          {activeOrders.length ? (
            activeOrders.map((order) => (
              <KitchenOrderCard
                key={order.id}
                order={order}
                onAccept={() => undefined}
                onReady={() => undefined}
              />
            ))
          ) : (
            <div className="lg:col-span-3">
              <StatePanel title="No active orders" message="New orders will appear here as customers place them." />
            </div>
          )}
        </div>
      </section>

      {/* Admin Order Ownership & Override Panel */}
      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-stitch overflow-hidden">
        <div className="flex items-center justify-between border-b border-outline-variant px-xl py-lg">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Live Order Ownership & Overrides</h3>
          <span className="bg-primary/10 border border-primary/20 text-primary rounded-full px-2.5 py-0.5 text-xs font-bold">
            {allActiveOrders.length} orders
          </span>
        </div>
        
        {allActiveOrders.length === 0 ? (
          <div className="p-xl text-center">
            <StatePanel title="No active assignments" message="All kitchen and delivery claims are current." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low font-semibold text-on-surface-variant">
                  <th className="p-4">Table</th>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Kitchen Staff Claim</th>
                  <th className="p-4">Waiter Delivery Claim</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {allActiveOrders.map((order) => {
                  const isKitchenClaimed = !!order.assignedKitchenId;
                  const isWaiterClaimed = !!order.assignedWaiterId;

                  return (
                    <tr key={order.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                      <td className="p-4 font-bold text-on-surface text-base">
                        Table {order.session?.table?.tableNumber || "N/A"}
                      </td>
                      <td className="p-4 font-mono text-xs text-on-surface-variant">
                        #{order.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
                          order.status === "PLACED" && "bg-amber-500/20 text-amber-500",
                          order.status === "ACCEPTED" && "bg-blue-500/20 text-blue-400",
                          order.status === "PREPARING" && "bg-blue-500/20 text-blue-300",
                          order.status === "READY" && "bg-green-500/20 text-green-400"
                        )}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-xs font-semibold",
                            isKitchenClaimed ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                          )}>
                            {isKitchenClaimed ? `Claimed: ${order.assignedKitchenName}` : "Unclaimed (PLACED)"}
                          </span>
                          {isKitchenClaimed && (
                            <button
                              type="button"
                              onClick={() => handleForceUnclaimKitchen(order.id)}
                              className="text-xs text-red-500 hover:text-red-400 font-bold bg-transparent border-0 cursor-pointer"
                              title="Force Release Cook Claim"
                            >
                              Release
                            </button>
                          )}
                        </div>
                        <select
                          className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 w-full max-w-[180px] focus:outline-none"
                          value={order.assignedKitchenId || ""}
                          onChange={(e) => handleReassignKitchen(order.id, e.target.value)}
                        >
                          <option value="">Reassign Cook...</option>
                          {kitchenStaff.map((staffMember) => (
                            <option key={staffMember.id} value={staffMember.id}>
                              {staffMember.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-xs font-semibold",
                            isWaiterClaimed ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          )}>
                            {isWaiterClaimed
                              ? `Claimed: ${order.assignedWaiterName}`
                              : order.status === "READY"
                              ? "Unclaimed Delivery"
                              : "Awaiting Kitchen"}
                          </span>
                          {isWaiterClaimed && (
                            <button
                              type="button"
                              onClick={() => handleForceUnclaimWaiter(order.id)}
                              className="text-xs text-red-500 hover:text-red-400 font-bold bg-transparent border-0 cursor-pointer"
                              title="Force Release Waiter Claim"
                            >
                              Release
                            </button>
                          )}
                        </div>
                        <select
                          className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 w-full max-w-[180px] focus:outline-none disabled:opacity-50"
                          value={order.assignedWaiterId || ""}
                          disabled={order.status !== "READY"}
                          onChange={(e) => handleReassignWaiter(order.id, e.target.value)}
                        >
                          <option value="">Reassign Waiter...</option>
                          {waiterStaff.map((staffMember) => (
                            <option key={staffMember.id} value={staffMember.id}>
                              {staffMember.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => handleViewHistory(order.id)}
                          className="min-h-10 text-xs py-1 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold border-0 rounded-lg"
                        >
                          Logs
                        </Button>
                        {order.status === "READY" && (
                          <Button
                            type="button"
                            onClick={() => handleForceDeliver(order.id)}
                            className="min-h-10 text-xs py-1 px-3 bg-green-500 hover:bg-green-400 text-zinc-950 font-bold border-0 rounded-lg"
                          >
                            Force Deliver
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Assignment History Logs Modal */}
      {activeHistoryOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-outline-variant bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <span>📋</span> Assignment History Logs
              </h3>
              <button
                type="button"
                onClick={() => setActiveHistoryOrderId(null)}
                className="text-zinc-500 hover:text-zinc-300 text-2xl font-bold bg-transparent border-0 cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="mt-4 max-h-[350px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {historyLoading ? (
                <div className="flex justify-center py-6">
                  <Loader label="Loading logs..." />
                </div>
              ) : historyLogs.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-6">No claim or reassignment events recorded yet.</p>
              ) : (
                historyLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full font-bold uppercase tracking-wide",
                        log.action === "CLAIMED" && "bg-blue-500/10 text-blue-400",
                        log.action === "REASSIGNED" && "bg-amber-500/10 text-amber-400",
                        log.action === "RELEASED" && "bg-red-500/10 text-red-400",
                        log.action === "DELIVERED" && "bg-green-500/10 text-green-400"
                      )}>
                        {log.action}
                      </span>
                      <span className="text-zinc-500">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-zinc-300">
                      Staff: <span className="font-semibold text-zinc-100">{log.staff?.name || "System/Auto"}</span> ({log.role})
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2 border-t border-zinc-800 pt-4">
              <Button type="button" variant="secondary" onClick={() => setActiveHistoryOrderId(null)} className="min-h-11">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
