"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";
import { customerService } from "@/services/customerService";
import { AssistanceType } from "@/types";
import { useSocket } from "@/hooks/useSocket";
import Loader from "@/components/common/Loader";
import { Button } from "@/components/ui/Button";
import { ClientApiError } from "@/types/api";
import { QRScanner } from "./QRScanner";
import { Camera, PenLine } from "lucide-react";

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
  const [paymentRequested, setPaymentRequested] = useState(false);
  const [isRequestingPayment, setIsRequestingPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scannedUpiLink, setScannedUpiLink] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualUpiId, setManualUpiId] = useState("");

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

  const handleScanSuccess = (decodedText: string) => {
    setShowScanner(false);
    
    // Robust UPI URI parsing — handles upi://pay?..., upi:pay?..., etc.
    const trimmed = decodedText.trim();
    if (trimmed.toLowerCase().startsWith("upi:")) {
      const qIdx = trimmed.indexOf("?");
      if (qIdx !== -1) {
        const queryString = trimmed.substring(qIdx + 1);
        const params = new URLSearchParams(queryString);

        // Case-insensitive parameter lookup
        const getParam = (key: string) => {
          for (const [k, v] of params.entries()) {
            if (k.toLowerCase() === key.toLowerCase()) return v;
          }
          return null;
        };

        const pa = getParam("pa");
        const pn = getParam("pn");

        if (pa) {
          const newLink = `upi://pay?pa=${pa}&pn=${encodeURIComponent(pn || "Merchant")}&am=${totalAmount.toFixed(2)}&cu=INR`;
          setScannedUpiLink(newLink);
          return;
        }
      }
    }
    
    alert("Invalid UPI QR code scanned. Please try again.");
  };

  const handleManualSubmit = () => {
    const trimmed = manualUpiId.trim();
    if (!trimmed || !trimmed.includes("@")) {
      alert("Please enter a valid UPI ID (e.g., merchant@upi)");
      return;
    }
    const newLink = `upi://pay?pa=${trimmed}&pn=${encodeURIComponent("Merchant")}&am=${totalAmount.toFixed(2)}&cu=INR`;
    setScannedUpiLink(newLink);
    setShowManualEntry(false);
  };

  const executePaymentLink = () => {
    if (scannedUpiLink) {
      window.location.href = scannedUpiLink;
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

      {!scannedUpiLink ? (
        <div className="w-full flex flex-col items-center space-y-6">
          <div className="bg-surface-overlay/50 rounded-xl p-5 w-full text-center border border-border-primary/50">
            <h4 className="text-text-primary font-semibold mb-2">Option 1: Scan & Pay</h4>
            <p className="text-sm text-text-secondary mb-4">
              Use your phone's camera to scan the restaurant's physical payment QR code. We'll automatically fill in the amount.
            </p>
            <Button
              type="button"
              variant="brand"
              onClick={() => setShowScanner(true)}
              className="w-full bg-accent-500 hover:bg-accent-400 text-surface-base font-bold border-0 flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Open Camera Scanner
            </Button>
          </div>
          
          <div className="w-full flex items-center gap-4">
            <div className="h-px bg-border-primary flex-1" />
            <span className="text-xs text-text-tertiary uppercase font-bold tracking-wider">OR</span>
            <div className="h-px bg-border-primary flex-1" />
          </div>

          <div className="bg-surface-overlay/50 rounded-xl p-5 w-full text-center border border-border-primary/50">
            <h4 className="text-text-primary font-semibold mb-2">Option 2: Enter UPI ID</h4>
            <p className="text-sm text-text-secondary mb-4">
              Type the merchant's UPI ID (shown on their QR code sticker) and pay directly.
            </p>
            {!showManualEntry ? (
              <Button
                type="button"
                variant="brand"
                onClick={() => setShowManualEntry(true)}
                className="w-full bg-info-500 hover:bg-info-400 text-surface-base font-bold border-0 flex items-center justify-center gap-2"
              >
                <PenLine className="w-4 h-4" />
                Enter UPI ID Manually
              </Button>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="e.g. merchant@upi"
                  value={manualUpiId}
                  onChange={(e) => setManualUpiId(e.target.value)}
                  className="w-full bg-surface-base border border-border-secondary rounded-lg px-4 py-3 text-text-primary text-center text-lg placeholder:text-text-muted focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500/50"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="brand"
                  onClick={handleManualSubmit}
                  disabled={!manualUpiId.trim()}
                  className="w-full bg-semantic_success-500 hover:bg-semantic_success-400 text-surface-base font-bold border-0 disabled:opacity-50"
                >
                  Pay Rs {totalAmount.toFixed(2)}
                </Button>
              </div>
            )}
          </div>

          <div className="w-full flex items-center gap-4">
            <div className="h-px bg-border-primary flex-1" />
            <span className="text-xs text-text-tertiary uppercase font-bold tracking-wider">OR</span>
            <div className="h-px bg-border-primary flex-1" />
          </div>

          <div className="bg-surface-overlay/50 rounded-xl p-5 w-full text-center border border-border-primary/50">
            <h4 className="text-text-primary font-semibold mb-2">Option 3: Pay Manually</h4>
            <p className="text-sm text-text-secondary mb-4">
              Open Google Pay, PhonePe, or Paytm directly, scan the restaurant's physical QR code, pay Rs {totalAmount.toFixed(2)}, and tap the button below.
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center py-4">
          <div className="bg-semantic_success-500/10 border border-semantic_success-500/20 rounded-xl p-4 w-full text-center mb-6">
            <p className="text-semantic_success-400 font-semibold mb-1">QR Code Scanned Successfully!</p>
            <p className="text-xs text-semantic_success-400/80">Click below to open your UPI app.</p>
          </div>
          <Button
            type="button"
            variant="brand"
            onClick={executePaymentLink}
            className="h-14 w-full bg-info-500 hover:bg-info-400 text-surface-base font-bold text-base rounded-xl active:scale-95 transition-all flex items-center justify-center border-0"
          >
            Pay Rs {totalAmount.toFixed(2)} Now
          </Button>
          <button
            type="button"
            onClick={() => setScannedUpiLink(null)}
            className="text-sm text-text-tertiary hover:text-text-primary mt-6 underline bg-transparent border-0 cursor-pointer"
          >
            Scan a different QR code
          </button>
        </div>
      )}

      {showScanner && (
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}

      <Button
        type="button"
        variant="brand"
        disabled={isRequestingPayment}
        onClick={handlePaid}
        className="h-14 w-full bg-semantic_success-500 hover:bg-semantic_success-400 text-surface-base font-semibold text-base mt-8 rounded-xl active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed border-0"
      >
        {isRequestingPayment ? <Loader label="" /> : "I've Completed Payment"}
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
