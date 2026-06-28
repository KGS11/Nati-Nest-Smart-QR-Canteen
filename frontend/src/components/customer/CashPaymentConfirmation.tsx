"use client";

import { useState } from "react";
import { customerService } from "@/services/customerService";
import { AssistanceType } from "@/types";
import { Button } from "@/components/ui/Button";
import Loader from "@/components/common/Loader";
import { ClientApiError } from "@/types/api";

interface CashPaymentConfirmationProps {
  sessionId: string;
  totalAmount: number;
  onRequested: () => void;
  onBack: () => void;
}

export function CashPaymentConfirmation({
  sessionId,
  totalAmount,
  onRequested,
  onBack,
}: CashPaymentConfirmationProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNotify = async () => {
    setIsRequesting(true);
    setError(null);
    try {
      await customerService.requestAssistance(AssistanceType.BILL);
      setSuccess(true);
      setTimeout(() => {
        onRequested();
      }, 2000);
    } catch (err) {
      const clientError = err as ClientApiError;
      setError(clientError.message || "Failed to notify waiter. Please try again.");
    } finally {
      setIsRequesting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-8 px-4 animate-fade-in">
        <div className="mb-4 rounded-full bg-semantic_success-500/10 px-5 py-3 text-2xl font-bold text-semantic_success-400">Sent</div>
        <h3 className="text-xl font-bold text-text-primary">Waiter has been notified!</h3>
        <p className="text-sm text-text-secondary mt-2">They will be at your table shortly.</p>
        <p className="text-lg font-semibold text-accent-400 mt-4">
          Your bill total: Rs {totalAmount.toFixed(2)}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-raised border border-border-primary rounded-2xl p-6 flex flex-col items-center">
      <span className="text-4xl text-center mb-4 font-bold text-accent-400 select-none">Rs</span>
      <h3 className="text-xl font-bold text-text-primary text-center">Cash Payment</h3>
      <p className="text-3xl font-bold text-accent-400 text-center mt-2">
        Rs {totalAmount.toFixed(2)}
      </p>
      <p className="text-sm text-text-secondary text-center mt-3 max-w-xs leading-relaxed">
        Tap the button below to notify your waiter. They will come to collect your payment.
      </p>

      {error && (
        <p className="text-xs text-red-400 mt-4 text-center" role="alert">
          {error}
        </p>
      )}

      <Button
        type="button"
        variant="brand"
        disabled={isRequesting}
        onClick={handleNotify}
        className="h-14 w-full bg-accent-500 text-surface-base hover:bg-accent-400 font-semibold text-base mt-8 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        {isRequesting ? <Loader label="" /> : "Notify Waiter"}
      </Button>

      <button
        type="button"
        onClick={onBack}
        disabled={isRequesting}
        className="text-sm text-text-tertiary hover:text-text-primary font-medium mt-4 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent-500 rounded px-2 py-1"
      >
         Change payment method
      </button>
    </div>
  );
}
