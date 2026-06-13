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

  const loadBill = useCallback(async () => {
    setError(null);
    try {
      const [billSummary, paymentStatus] = await Promise.all([
        customerService.getBill(),
        customerService.getPaymentStatus(),
      ]);
      setBill(billSummary);
      setPayment(paymentStatus);
    } catch (err) {
      const clientError = err as ClientApiError;
      setError(clientError.message || "Unable to load bill summary.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBill();
  }, [loadBill]);

  useEffect(() => {
    if (!socket) return;

    const confirmed = () => {
      router.push("/customer/feedback");
    };

    socket.on("payment:confirmed", confirmed);

    return () => {
      socket.off("payment:confirmed", confirmed);
    };
  }, [clearSession, router, socket]);

  const requestBill = async () => {
    setRequesting(true);
    setError(null);
    setMessage(null);
    try {
      const result = await customerService.requestBill();
      setBill(result.billSummary);
      setPayment(result.payment);
      setMessage("Bill requested. A server will attend your table shortly.");
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

        {(!payment || payment.status !== "PENDING") && bill && bill.totalAmount > 0 ? (
          <PaymentMethodSelector
            sessionId={sessionId || ""}
            totalAmount={bill.totalAmount}
            onPaymentRequested={loadBill}
          />
        ) : payment?.status === "PENDING" ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center shadow-stitch">
            <p className="text-amber-400 font-semibold text-lg animate-pulse mb-2">
              Payment Pending Verification
            </p>
            <p className="text-sm text-zinc-400">
              The server has been notified. Please wait for verification.
            </p>
            <div className="flex justify-center mt-6">
              <Loader label="Waiting..." />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
