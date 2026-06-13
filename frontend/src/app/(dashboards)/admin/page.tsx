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

const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

export default function AdminPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [ordersPayload, setOrdersPayload] = useState<KitchenOrdersPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const [dashboard, popular, kitchenOrders] = await Promise.all([
          adminService.getDashboardSummary(),
          adminService.getPopularItems(),
          kitchenService.getActiveOrders(),
        ]);
        setSummary(dashboard);
        setPopularItems(popular);
        setOrdersPayload(kitchenOrders);
      } catch (err) {
        const clientError = err as ClientApiError;
        setError(clientError.message || "Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const activeOrders = ordersPayload?.orders.slice(0, 3) ?? [];
  const maxSold = useMemo(
    () => Math.max(1, ...popularItems.map((item) => item.totalQuantitySold)),
    [popularItems],
  );

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
    </div>
  );
}
