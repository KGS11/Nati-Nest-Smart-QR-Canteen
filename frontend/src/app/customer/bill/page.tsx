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

    socket.on("payment:confirmed", confirmed);

    return () => {
      socket.off("payment:confirmed", confirmed);
    };
  }, [router, socket, sessionId]);

  useEffect(() => {
    if (paymentCompleted) {
      const timer = setTimeout(() => {
        router.push("/customer/feedback");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [paymentCompleted, router]);

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
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Loader label="Preparing bill..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface px-margin-mobile py-lg">
      <header className="mb-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container font-headline-sm font-bold text-on-primary-container">
            {tableNumber ?? bill?.tableNumber ?? "--"}
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Nati Nest</p>
            <h1 className="font-headline-md text-headline-md text-on-surface">Your Bill</h1>
          </div>
        </div>
        <Link
          href="/customer/menu"
          className="flex h-touch-min w-touch-min items-center justify-center rounded-full bg-surface-container text-primary"
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

        <section className="rounded-2xl bg-surface-container-lowest p-lg shadow-stitch">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant">Total Amount</p>
              <h2 className="mt-xs font-display-lg-mobile text-display-lg-mobile font-bold text-primary">
                Rs {bill?.totalAmount ?? 0}
              </h2>
            </div>
            <span className="rounded-full bg-surface-container px-sm py-xs font-label-sm text-label-sm text-on-surface-variant">
              {payment?.status ?? "Not requested"}
            </span>
          </div>
        </section>

        <section className="rounded-2xl bg-surface-container-lowest p-lg shadow-stitch">
          <h2 className="mb-md font-headline-sm text-headline-sm text-on-surface">Item Breakdown</h2>
          {bill?.itemBreakdown.length ? (
            <div className="divide-y divide-outline-variant">
              {bill.itemBreakdown.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-md py-md">
                  <div className="min-w-0">
                    <p className="truncate font-label-md text-label-md text-on-surface">{item.name}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {item.quantity} x Rs {item.unitPrice}
                    </p>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-primary">
                    Rs {item.subtotal}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <StatePanel title="No billable items" message="Place an order before requesting the bill." />
          )}
        </section>

        {paymentCompleted ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-stitch animate-fade-in flex flex-col items-center justify-center">
            <div className="mb-4 text-4xl">
              ✅
            </div>
            <h3 className="text-2xl font-bold text-green-400">Payment Successful</h3>
            <p className="text-sm text-zinc-400 mt-4">
              Redirecting to Rating...
            </p>
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
