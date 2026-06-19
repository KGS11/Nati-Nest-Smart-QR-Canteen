"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";
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
  sessionId,
  totalAmount,
  onBack,
}: UpiPaymentDisplayProps) {
  const { socket } = useSocket();
  const [upiQrUrl, setUpiQrUrl] = useState<string | null>(null);
  const [upiLink, setUpiLink] = useState<string | null>(null);
  const [qrType, setQrType] = useState<string | null>(null);
  const [showQrFallback, setShowQrFallback] = useState(false);
  const [isLoadingQr, setIsLoadingQr] = useState(true);
  const [qrError, setQrError] = useState<string | null>(null);
  const [paymentRequested, setPaymentRequested] = useState(false);
  const [isRequestingPayment, setIsRequestingPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  useEffect(() => {
    const fetchQr = async () => {
      setIsLoadingQr(true);
      setQrError(null);
      try {
        const response = await apiClient.get<{
          success: boolean;
          data: { qrDataUrl: string; qrType: string; amount: number; upiLink?: string };
        }>(`/settings/upi-qr-dynamic?sessionId=${sessionId}&t=${Date.now()}`);
        
        if (response.data?.success && response.data?.data) {
          setUpiQrUrl(response.data.data.qrDataUrl);
          setQrType(response.data.data.qrType);
          if (response.data.data.upiLink) {
            setUpiLink(response.data.data.upiLink);
          }
        } else {
          setQrError("Unable to generate payment. Please try again.");
        }
      } catch (err) {
        const clientError = err as ClientApiError;
        setQrError(clientError.message || "Unable to generate payment. Please try again.");
      } finally {
        setIsLoadingQr(false);
      }
    };

    fetchQr();
  }, [sessionId]);

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

  const handleUpiPayClick = () => {
    if (!upiLink) return;
    try {
      window.location.href = upiLink;
    } catch (err) {
      console.error("UPI app link navigation failed:", err);
      setShowQrFallback(true);
    }
  };

  const isMobile = typeof window !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (paymentConfirmed) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 px-4 animate-fade-in">
        <div className="mb-4 rounded-full bg-green-500/10 px-5 py-3 text-3xl font-bold text-green-400">Paid</div>
        <h3 className="text-2xl font-bold text-green-400">Payment Confirmed!</h3>
        <p className="text-zinc-100 font-medium mt-2">Thank you for dining with us!</p>
        <p className="text-sm text-zinc-400 mt-1">Your session is now complete.</p>
      </div>
    );
  }

  if (paymentRequested) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 px-4 animate-fade-in">
        <div className="mb-4 rounded-full bg-blue-500/10 px-5 py-3 text-2xl font-bold text-blue-400 animate-pulse">Sent</div>
        <h3 className="text-xl font-bold text-zinc-100">Payment notification sent!</h3>
        <p className="text-sm text-zinc-400 mt-2 max-w-xs leading-relaxed">
          Waiter will verify and confirm shortly. You will receive a confirmation here.
        </p>
        <div className="flex items-center gap-2 mt-6 justify-center">
          <Loader label="Waiting for confirmation..." />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center max-w-md mx-auto w-full">
      <h3 className="text-lg font-bold text-zinc-100 text-center">
        {upiLink && isMobile && !showQrFallback ? "Pay Using UPI" : "Scan to Pay"}
      </h3>
      <p className="text-2xl font-bold text-amber-400 text-center mt-1">
        Rs {totalAmount.toFixed(2)}
      </p>

      {upiLink && isMobile && !showQrFallback ? (
        <div className="w-full flex flex-col items-center py-6">
          <p className="text-sm text-zinc-400 text-center mb-6 leading-relaxed">
            Click the button below to pay directly using any installed UPI app (Google Pay, PhonePe, Paytm, etc.).
          </p>
          <Button
            type="button"
            variant="primary"
            onClick={handleUpiPayClick}
            className="h-14 w-full bg-blue-500 hover:bg-blue-400 text-zinc-950 font-bold text-base rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 border-0"
          >
            Pay Using UPI App 📱
          </Button>
          <button
            type="button"
            onClick={() => setShowQrFallback(true)}
            className="text-sm text-zinc-400 hover:text-zinc-200 mt-6 underline font-medium focus:outline-none bg-transparent border-0 cursor-pointer"
          >
            Scan QR Code instead
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl p-5 mx-auto w-fit mt-4 flex items-center justify-center min-h-[224px] min-w-[224px]">
            {isLoadingQr ? (
              <Loader label="" />
            ) : qrError ? (
              <div className="text-zinc-800 text-xs text-center p-2 max-w-[180px]">
                <p className="font-semibold text-red-500 mb-2">Error Loading QR</p>
                <p className="text-[10px] text-zinc-500">{qrError}</p>
                <p className="text-[10px] text-zinc-500 mt-2 font-medium">Contact waiter for assistance</p>
              </div>
            ) : upiQrUrl ? (
              <img
                src={upiQrUrl}
                alt="UPI QR Code"
                className="w-52 h-52 object-contain"
              />
            ) : null}
          </div>

          <ul className="text-sm text-zinc-400 space-y-2 mt-6 text-left w-full px-2">
            <li className="flex items-center gap-2">
              <span className="font-bold text-blue-400">1.</span> Open any UPI app on your phone
            </li>
            <li className="flex items-center gap-2">
              <span className="font-bold text-blue-400">2.</span> Scan the QR code above
            </li>
            <li className="flex items-center gap-2">
              <span className="font-bold text-blue-400">3.</span> Pay <strong className="text-zinc-200">Rs {totalAmount.toFixed(2)}</strong> and confirm
            </li>
            <li className="flex items-center gap-2">
              <span className="font-bold text-blue-400">4.</span> Tap below after payment
            </li>
          </ul>

          {upiLink && isMobile && showQrFallback && (
            <button
              type="button"
              onClick={() => setShowQrFallback(false)}
              className="text-xs text-zinc-500 hover:text-zinc-405 mt-4 underline font-medium focus:outline-none bg-transparent border-0 cursor-pointer"
            >
              Back to UPI App Pay
            </button>
          )}
        </>
      )}

      <Button
        type="button"
        variant="primary"
        disabled={isRequestingPayment || isLoadingQr || !!qrError}
        onClick={handlePaid}
        className="h-14 w-full bg-green-500 hover:bg-green-400 text-zinc-950 font-semibold text-base mt-8 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-0"
      >
        {isRequestingPayment ? <Loader label="" /> : "I've Completed Payment"}
      </Button>

      <button
        type="button"
        onClick={onBack}
        disabled={isRequestingPayment}
        className="text-sm text-zinc-500 hover:text-zinc-300 font-medium mt-4 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 rounded px-2 py-1 bg-transparent border-0 cursor-pointer"
      >
         Change payment method
      </button>
    </div>
  );
}
