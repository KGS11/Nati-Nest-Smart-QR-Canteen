"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Loader from "@/components/common/Loader";
import { MaterialIcon } from "@/components/stitch/MaterialIcon";
import { StatePanel } from "@/components/stitch/StatePanel";
import { useSocket } from "@/hooks/useSocket";
import { BillSummary, customerService, PaymentStatusPayload } from "@/services/customerService";
import { useSessionStore } from "@/stores/sessionStore";
import { ClientApiError } from "@/types/api";
import { PaymentMethodSelector } from "@/components/customer/PaymentMethodSelector";
import { AssistanceType } from "@/types";

export default function CustomerBillPage() {
  const router = useRouter();
  const { socket } = useSocket();
  const { tableNumber, clearSession, sessionId } = useSessionStore();
  const [bill, setBill] = useState<BillSummary | null>(null);
  const [payment, setPayment] = useState<PaymentStatusPayload["payment"]>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState<boolean>(() => {
    if (typeof window !== "undefined" && sessionId) {
      return window.sessionStorage.getItem(`paymentCompleted_${sessionId}`) === "true";
    }
    return false;
  });
  const [notified, setNotified] = useState(false);

  const isPaymentEligible = bill?.orders 
    ? bill.orders.every(order => ["DELIVERED", "PAID", "CANCELLED"].includes(order.status))
    : false;

  const loadBill = useCallback(async () => {
    setError(null);
    try {
      const [billSummary, paymentStatus] = await Promise.all([
        customerService.getBill(),
        customerService.getPaymentStatus(),
      ]);
      setBill(billSummary);
      setPayment(paymentStatus);
      if (paymentStatus?.status === "COMPLETED") {
        setPaymentCompleted(true);
        if (typeof window !== "undefined" && sessionId) {
          window.sessionStorage.setItem(`paymentCompleted_${sessionId}`, "true");
        }
      }
    } catch (err) {
      const clientError = err as ClientApiError;
      setError(clientError.message || "Unable to load bill summary.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadBill();
  }, [loadBill]);

  useEffect(() => {
    if (!socket || !sessionId) return;

    const confirmed = () => {
      setPaymentCompleted(true);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(`paymentCompleted_${sessionId}`, "true");
      }
    };
    const billUpdated = () => {
      setMessage("Your bill was updated by the restaurant.");
      loadBill();
    };

    socket.on("payment:confirmed", confirmed);
    socket.on("bill:updated", billUpdated);
    socket.on("order:item_cancelled", billUpdated);

    return () => {
      socket.off("payment:confirmed", confirmed);
      socket.off("bill:updated", billUpdated);
      socket.off("order:item_cancelled", billUpdated);
    };
  }, [loadBill, router, socket, sessionId]);

  // No auto-redirect — user must manually navigate to feedback
  // This prevents the rating page from "refreshing" unexpectedly

  useEffect(() => {
    if (bill && isPaymentEligible && bill.totalAmount > 0 && !notified && payment?.status !== "COMPLETED") {
      customerService.requestAssistance(AssistanceType.BILL).catch(() => {});
      setNotified(true);
    }
  }, [bill, isPaymentEligible, notified, payment?.status]);

  const requestBill = async () => {
    setRequesting(true);
    setError(null);
    setMessage(null);
    try {
      const result = await customerService.requestBill();
      setBill(result.billSummary);
      setPayment(result.payment);
      setMessage("Bill requested. A waiter will attend your table shortly.");
    } catch (err) {
      const clientError = err as ClientApiError;
      setError(clientError.message || "Unable to request bill.");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <Loader label="Preparing bill..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base px-margin-mobile py-lg text-text-primary">
      <header className="mb-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-500/10 font-headline-sm font-bold text-accent-500">
            {tableNumber ?? bill?.tableNumber ?? "--"}
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-text-secondary">Nati Nest</p>
            <h1 className="font-headline-md text-headline-md text-text-primary">Your Bill</h1>
          </div>
        </div>
        <Link
          href="/customer/menu"
          className="flex h-touch-min w-touch-min items-center justify-center rounded-full bg-surface-overlay text-accent-500"
        >
          <MaterialIcon name="restaurant_menu" />
        </Link>
      </header>

      <div className="space-y-md">
        {error ? <StatePanel tone="error" title="Bill unavailable" message={error} /> : null}
        {message ? (
          <div className="rounded-xl border border-primary-fixed bg-primary-fixed/60 p-md font-body-sm text-body-sm text-on-primary-fixed-variant">
            {message}
          </div>
        ) : null}

        <section className="rounded-2xl bg-surface-raised p-lg shadow-md border border-border-primary">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-label-md text-label-md text-text-secondary">Total Amount</p>
              <h2 className="mt-xs font-display-lg-mobile text-display-lg-mobile font-bold text-accent-500">
                Rs {bill?.totalAmount ?? 0}
              </h2>
            </div>
            <span className="rounded-full bg-surface-overlay px-sm py-xs font-label-sm text-label-sm text-text-secondary">
              {payment?.status ?? "Not requested"}
            </span>
          </div>
        </section>

        <section className="rounded-2xl bg-surface-raised p-lg shadow-md border border-border-primary">
          <h2 className="mb-md font-headline-sm text-headline-sm text-text-primary">Item Breakdown</h2>
          {bill?.itemBreakdown.length ? (
            <div className="divide-y divide-border-primary">
              {bill.itemBreakdown.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-md py-md">
                  <div className="min-w-0">
                    <p className="truncate font-label-md text-label-md text-text-primary">{item.name}</p>
                    <p className="font-body-sm text-body-sm text-text-secondary">
                      {item.quantity} x Rs {item.unitPrice}
                    </p>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-accent-500">
                    Rs {item.subtotal}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <StatePanel title="No billable items" message="Place an order before requesting the bill." />
          )}
        </section>

        {bill?.cancelledItems?.length ? (
          <section className="rounded-2xl bg-surface-raised p-lg shadow-md border border-red-500/20">
            <h2 className="mb-md font-headline-sm text-headline-sm text-text-primary">Restaurant Adjustments</h2>
            <div className="divide-y divide-border-primary">
              {bill.cancelledItems.map((item) => (
                <div key={item.itemId} className="py-md">
                  <div className="flex items-start justify-between gap-md">
                    <div className="min-w-0">
                      <p className="truncate font-label-md text-label-md text-text-secondary line-through">
                        {item.name}
                      </p>
                      <p className="font-body-sm text-body-sm text-red-400">
                        Cancelled By Restaurant
                      </p>
                      {item.reason ? (
                        <p className="font-body-sm text-body-sm text-text-secondary">
                          Reason: {item.reason.replaceAll("_", " ")}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 font-headline-sm text-headline-sm text-red-400">
                      -Rs {item.amountDeducted}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {paymentCompleted ? (
          <div className="bg-surface-raised border border-border-primary rounded-2xl p-8 text-center shadow-md animate-fade-in flex flex-col items-center justify-center">
            <div className="mb-4 text-4xl">✅</div>
            <h3 className="text-2xl font-bold text-semantic_success-400">Payment Successful!</h3>
            <p className="text-sm text-text-secondary mt-2 mb-6">
              Thank you for dining with us.
            </p>
            <button
              type="button"
              onClick={() => router.push("/customer/feedback")}
              className="w-full h-12 bg-accent-500 hover:bg-accent-400 text-surface-base font-bold rounded-xl active:scale-95 transition-all cursor-pointer border-0"
            >
              Rate Your Experience
            </button>
            <button
              type="button"
              onClick={() => {
                clearSession();
                router.push("/");
              }}
              className="text-xs text-text-tertiary hover:text-text-primary mt-4 bg-transparent border-0 cursor-pointer"
            >
              Skip &amp; Exit
            </button>
          </div>
        ) : bill && bill.totalAmount > 0 && !isPaymentEligible ? (
          <StatePanel 
            title="Order in progress" 
            message="Your order is still being prepared or waiting for delivery. Payment will be available once your food has been delivered." 
          />
        ) : payment?.status !== "COMPLETED" && bill && bill.totalAmount > 0 ? (
          <PaymentMethodSelector
            sessionId={sessionId || ""}
            totalAmount={bill.totalAmount}
            onPaymentRequested={loadBill}
            payment={payment}
          />
        ) : null}
      </div>
    </div>
  );
}
