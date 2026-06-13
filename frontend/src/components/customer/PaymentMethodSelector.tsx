"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { CashPaymentConfirmation } from "./CashPaymentConfirmation";
import { UpiPaymentDisplay } from "./UpiPaymentDisplay";

interface PaymentMethodSelectorProps {
  sessionId: string;
  totalAmount: number;
  onPaymentRequested: () => void;
}

export function PaymentMethodSelector({
  sessionId,
  totalAmount,
  onPaymentRequested,
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<"CASH" | "UPI" | null>(null);
  const [step, setStep] = useState<"select" | "cash_confirm" | "upi_display">("select");

  if (step === "cash_confirm") {
    return (
      <CashPaymentConfirmation
        sessionId={sessionId}
        totalAmount={totalAmount}
        onRequested={onPaymentRequested}
        onBack={() => setStep("select")}
      />
    );
  }

  if (step === "upi_display") {
    return (
      <UpiPaymentDisplay
        sessionId={sessionId}
        totalAmount={totalAmount}
        onBack={() => setStep("select")}
      />
    );
  }

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-zinc-100 mb-1 text-center">
        How would you like to pay?
      </h3>
      <p className="text-center text-2xl font-bold text-amber-400 mb-6">
        Total: Rs {totalAmount.toFixed(2)}
      </p>

      <div className="space-y-4">
        <div
          onClick={() => setSelectedMethod("CASH")}
          className={cn(
            "min-h-[100px] w-full bg-zinc-900 border-2 rounded-2xl p-5 flex items-center gap-4 cursor-pointer active:scale-95 transition-all",
            selectedMethod === "CASH"
              ? "border-amber-500 bg-amber-500/5"
              : "border-zinc-850 hover:border-zinc-700"
          )}
        >
          <span className="text-2xl shrink-0 font-bold text-amber-400">Rs</span>
          <div className="text-left">
            <h4 className="font-semibold text-zinc-100">Pay with Cash</h4>
            <p className="text-sm text-zinc-400">Server will collect payment</p>
          </div>
        </div>

        <div
          onClick={() => setSelectedMethod("UPI")}
          className={cn(
            "min-h-[100px] w-full bg-zinc-900 border-2 rounded-2xl p-5 flex items-center gap-4 cursor-pointer active:scale-95 transition-all",
            selectedMethod === "UPI"
              ? "border-blue-500 bg-blue-500/5"
              : "border-zinc-850 hover:border-zinc-700"
          )}
        >
          <span className="text-2xl shrink-0 font-bold text-blue-400">UPI</span>
          <div className="text-left">
            <h4 className="font-semibold text-zinc-100">Pay Online (UPI)</h4>
            <p className="text-sm text-zinc-400">Scan QR and pay instantly</p>
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant="primary"
        disabled={!selectedMethod}
        onClick={() => setStep(selectedMethod === "CASH" ? "cash_confirm" : "upi_display")}
        className="h-14 w-full bg-amber-500 text-zinc-950 hover:bg-amber-400 font-semibold text-base mt-8 rounded-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </Button>
    </div>
  );
}
