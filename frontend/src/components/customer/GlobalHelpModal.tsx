"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AssistanceType } from "@/types";
import { customerService } from "@/services/customerService";
import { Button } from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import { ClientApiError } from "@/types/api";
import { MaterialIcon } from "@/components/stitch/MaterialIcon";

interface GlobalHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalHelpModal({ isOpen, onClose }: GlobalHelpModalProps) {
  const router = useRouter();
  const [busyType, setBusyType] = useState<AssistanceType | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerAssistance = async (type: AssistanceType) => {
    setBusyType(type);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const response = await customerService.requestAssistance(type);
      setStatusMessage(response.message || "Request sent. A waiter will assist you shortly.");
      
      if (type === AssistanceType.BILL) {
        setTimeout(() => {
          onClose();
          router.push("/customer/bill");
        }, 1200);
      } else {
        setTimeout(() => {
          onClose();
          setStatusMessage(null);
        }, 3000);
      }
    } catch (err) {
      const clientError = err as ClientApiError;
      setErrorMessage(clientError.message || "Unable to send request. Please try again.");
    } finally {
      setBusyType(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-label="Close help options"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Assistance request drawer"
        className="relative z-10 w-full max-w-md rounded-t-3xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-100 shadow-2xl sm:rounded-2xl animate-slide-up"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Assistance</span>
            <h2 className="text-xl font-bold mt-0.5">How can we help?</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 text-zinc-400 hover:text-zinc-200"
            aria-label="Close assistance requests"
          >
            X
          </button>
        </div>

        {statusMessage && (
          <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400 flex items-center gap-2">
            <MaterialIcon name="check_circle" className="text-green-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 flex items-center gap-2">
            <MaterialIcon name="error" className="text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-4">
          <button
            type="button"
            disabled={busyType !== null}
            onClick={() => triggerAssistance(AssistanceType.WATER)}
            className="flex min-h-[60px] w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4 text-left active:scale-[0.98] transition-all hover:border-zinc-700 disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <MaterialIcon name="water_drop" className="text-blue-400 text-2xl" />
              <div>
                <h4 className="font-semibold text-zinc-100">Request Water</h4>
                <p className="text-xs text-zinc-400">Bring drinking water to the table</p>
              </div>
            </div>
            {busyType === AssistanceType.WATER ? (
              <Loader label="" className="scale-75" />
            ) : (
              <MaterialIcon name="chevron_right" className="text-zinc-500" />
            )}
          </button>

          <button
            type="button"
            disabled={busyType !== null}
            onClick={() => triggerAssistance(AssistanceType.GENERAL)}
            className="flex min-h-[60px] w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4 text-left active:scale-[0.98] transition-all hover:border-zinc-700 disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <MaterialIcon name="support_agent" className="text-amber-400 text-2xl" />
              <div>
                <h4 className="font-semibold text-zinc-100">Call Waiter</h4>
                <p className="text-xs text-zinc-400">General assistance or order help</p>
              </div>
            </div>
            {busyType === AssistanceType.GENERAL ? (
              <Loader label="" className="scale-75" />
            ) : (
              <MaterialIcon name="chevron_right" className="text-zinc-500" />
            )}
          </button>

          <button
            type="button"
            disabled={busyType !== null}
            onClick={() => triggerAssistance(AssistanceType.BILL)}
            className="flex min-h-[60px] w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4 text-left active:scale-[0.98] transition-all hover:border-zinc-700 disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <MaterialIcon name="receipt_long" className="text-emerald-400 text-2xl" />
              <div>
                <h4 className="font-semibold text-zinc-100">Request Bill</h4>
                <p className="text-xs text-zinc-400">Get check and proceed to payment</p>
              </div>
            </div>
            {busyType === AssistanceType.BILL ? (
              <Loader label="" className="scale-75" />
            ) : (
              <MaterialIcon name="chevron_right" className="text-zinc-500" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
