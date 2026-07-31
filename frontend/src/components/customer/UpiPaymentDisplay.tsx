"use client";

import { useEffect, useState } from "react";
import { customerService } from "@/services/customerService";
import { AssistanceType } from "@/types";
import { useSocket } from "@/hooks/useSocket";
import Loader from "@/components/common/Loader";
import { Button } from "@/components/ui/Button";
import { ClientApiError } from "@/types/api";

interface UpiPaymentDisplayProps {
  sessionId: string;
  totalAmount: number;
  onBack: () => void;
}

export function UpiPaymentDisplay({
  totalAmount,
  onBack,
}: UpiPaymentDisplayProps) {
  const { socket } = useSocket();
  const [paymentRequested, setPaymentRequested] = useState(false);
  const [isRequestingPayment, setIsRequestingPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handlePaymentConfirmed = () => {
      setPaymentConfirmed(true);
    };

    socket.on("payment:confirmed", handlePaymentConfirmed);

    return () => {
      socket.off("payment:confirmed", handlePaymentConfirmed);
    };
  }, [socket]);

  const handlePaid = async () => {
    setIsRequestingPayment(true);
    try {
      await customerService.requestAssistance(AssistanceType.BILL);
      setPaymentRequested(true);
    } catch (err) {
      const clientError = err as ClientApiError;
      alert(clientError.message || "Failed to notify waiter of payment.");
    } finally {
      setIsRequestingPayment(false);
    }
  };

  if (paymentConfirmed) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 px-4 animate-fade-in">
        <div className="mb-4 rounded-full bg-semantic_success-500/10 px-5 py-3 text-3xl font-bold text-semantic_success-400">Paid</div>
        <h3 className="text-2xl font-bold text-semantic_success-400">Payment Confirmed!</h3>
        <p className="text-text-primary font-medium mt-2">Thank you for dining with us!</p>
        <p className="text-sm text-text-secondary mt-1">Your session is now complete.</p>
      </div>
    );
  }

  if (paymentRequested) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 px-4 animate-fade-in">
        <div className="mb-4 rounded-full bg-info-500/10 px-5 py-3 text-2xl font-bold text-info-450 animate-pulse">Sent</div>
        <h3 className="text-xl font-bold text-text-primary">Payment notification sent!</h3>
        <p className="text-sm text-text-secondary mt-2 max-w-xs leading-relaxed">
          Waiter will verify and confirm shortly. You will receive a confirmation here.
        </p>
        <div className="flex items-center gap-2 mt-6 justify-center">
          <Loader label="Waiting for confirmation..." />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-raised border border-border-primary rounded-2xl p-6 flex flex-col items-center max-w-md mx-auto w-full">
      <h3 className="text-lg font-bold text-text-primary text-center">
        Online Payment
      </h3>
      <p className="text-2xl font-bold text-accent-400 text-center mt-1 mb-6">
        Rs {totalAmount.toFixed(2)}
      </p>

      <p className="text-sm text-text-secondary text-center max-w-xs leading-relaxed">
        Pay the bill amount using your preferred payment app or the restaurant QR code, then tap
        below to notify the server for verification.
      </p>

      <Button
        type="button"
        variant="brand"
        disabled={isRequestingPayment}
        onClick={handlePaid}
        className="h-14 w-full bg-semantic_success-500 hover:bg-semantic_success-400 text-surface-base font-semibold text-base mt-8 rounded-xl active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed border-0"
      >
        {isRequestingPayment ? <Loader label="" /> : "Notify Server"}
      </Button>

      <button
        type="button"
        onClick={onBack}
        disabled={isRequestingPayment}
        className="text-sm text-text-tertiary hover:text-text-primary font-medium mt-4 bg-transparent border-0 cursor-pointer"
      >
        Change payment method
      </button>
    </div>
  );
}
