"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/common/Button";
import Loader from "@/components/common/Loader";
import { apiClient } from "@/lib/api-client";
import { useSessionStore } from "@/stores/sessionStore";

interface ScanResponse {
  success: boolean;
  message: string;
  data: {
    sessionToken: string;
    sessionId: string;
    tableNumber: string;
    isNew: boolean;
  };
}

export default function ScanPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const router = useRouter();
  const setSession = useSessionStore((state) => state.setSession);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tableId) return;

    const initializeScan = async () => {
      try {
        const response = await apiClient.get<ScanResponse>(`/customer/scan/${tableId}`);
        const { sessionToken, sessionId, tableNumber } = response.data.data;
        setSession(sessionToken, sessionId, tableNumber);
        router.replace("/customer/menu");
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String(err.message)
            : "Failed to parse QR code or active session expired.";
        setError(message);
      }
    };

    initializeScan();
  }, [tableId, setSession, router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-center">
        <div className="max-w-md rounded-lg border border-red-500/30 bg-red-950/40 p-4">
          <h2 className="mb-2 text-xl font-semibold text-red-400">Scan Failed</h2>
          <p className="mb-4 text-sm text-zinc-400">{error}</p>
          <Button onClick={() => router.replace("/")}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950">
      <Loader label="Opening Nati Nest canteen dashboard..." />
    </div>
  );
}
