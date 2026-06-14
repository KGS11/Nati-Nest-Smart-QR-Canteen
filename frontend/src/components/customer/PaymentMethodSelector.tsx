"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { CashPaymentConfirmation } from "./CashPaymentConfirmation";
import { UpiPaymentDisplay } from "./UpiPaymentDisplay";
import { customerService, PaymentStatusPayload } from "@/services/customerService";

interface PaymentMethodSelectorProps {
  sessionId: string;
  totalAmount: number;
  onPaymentRequested: () => void;
  payment?: PaymentStatusPayload["payment"] | null;
}

export function PaymentMethodSelector({
  sessionId,
  totalAmount,
  onPaymentRequested,
  payment,
}: PaymentMethodSelectorProps) {
  const initialTip = payment?.tipAmount ?? 0;
  const isPreset = [0, 10, 20, 50].includes(initialTip);

  const [selectedMethod, setSelectedMethod] = useState<"CASH" | "UPI" | null>(null);
  const [step, setStep] = useState<"select" | "cash_confirm" | "upi_display">("select");
  const [tipAmount, setTipAmount] = useState<number>(initialTip);
  const [customTip, setCustomTip] = useState<string>(isPreset ? "" : initialTip.toString());
  const [showCustomInput, setShowCustomInput] = useState<boolean>(!isPreset);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!selectedMethod) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await customerService.setTip(tipAmount);
      onPaymentRequested();
      setStep(selectedMethod === "CASH" ? "cash_confirm" : "upi_display");
    } catch (err) {
      console.error("Failed to set tip:", err);
      setError("Failed to set tip. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePresetTip = (amount: number) => {
    setTipAmount(amount);
    setShowCustomInput(false);
    setCustomTip("");
  };

  const handleCustomTipChange = (value: string) => {
    setCustomTip(value);
    const parsed = parseFloat(value);
    setTipAmount(isNaN(parsed) || parsed < 0 ? 0 : parsed);
  };

  if (step === "cash_confirm") {
    return (
      <CashPaymentConfirmation
        sessionId={sessionId}
        totalAmount={totalAmount + tipAmount}
        onRequested={onPaymentRequested}
        onBack={() => setStep("select")}
      />
    );
  }

  if (step === "upi_display") {
    return (
      <UpiPaymentDisplay
        sessionId={sessionId}
        totalAmount={totalAmount + tipAmount}
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
        Total: Rs {(totalAmount + tipAmount).toFixed(2)}
      </p>

      {/* Tipping Section */}
      <div className="mb-6 border-t border-zinc-800 pt-6">
        <h4 className="text-sm font-semibold text-zinc-300 mb-3 text-center">
          Support our staff! Add a tip?
        </h4>
        <div className="flex flex-wrap gap-2 justify-center">
          {[0, 10, 20, 50].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => handlePresetTip(amt)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-xl border transition-all active:scale-95",
                tipAmount === amt && !showCustomInput
                  ? "bg-amber-500 border-amber-500 text-zinc-950 font-semibold"
                  : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
              )}
            >
              {amt === 0 ? "No Tip" : `₹${amt}`}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setShowCustomInput(true);
              setTipAmount(customTip ? parseFloat(customTip) || 0 : 0);
            }}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-xl border transition-all active:scale-95",
              showCustomInput
                ? "bg-amber-500 border-amber-500 text-zinc-950 font-semibold"
                : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
            )}
          >
            Custom
          </button>
        </div>

        {showCustomInput && (
          <div className="mt-3 max-w-[200px] mx-auto">
            <input
              type="number"
              placeholder="Enter amount"
              value={customTip}
              onChange={(e) => handleCustomTipChange(e.target.value)}
              className="w-full px-3 py-2 text-center text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500"
              min="0"
            />
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 mb-4 text-center" role="alert">
          {error}
        </p>
      )}

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
            <p className="text-sm text-zinc-400">Waiter will collect payment</p>
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
        disabled={!selectedMethod || isSubmitting}
        onClick={handleContinue}
        className="h-14 w-full bg-amber-500 text-zinc-950 hover:bg-amber-400 font-semibold text-base mt-8 rounded-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isSubmitting ? "Saving..." : "Continue"}
      </Button>
    </div>
  );
}

