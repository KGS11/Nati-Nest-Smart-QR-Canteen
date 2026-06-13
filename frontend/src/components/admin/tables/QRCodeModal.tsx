"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import Loader from "@/components/common/Loader";
import { RestaurantTable } from "@/types/table.types";

interface QRCodeModalProps {
  table: RestaurantTable;
  onClose: () => void;
  onRegenerate: (tableId: string) => Promise<void>;
}

export function QRCodeModal({ table, onClose, onRegenerate }: QRCodeModalProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const clientUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const tableUrl = `${clientUrl}/table/${table.tableNumber}`;

  const handleDownload = () => {
    if (!table.qrCodeUrl) return;

    setIsDownloading(true);
    const link = document.createElement("a");
    link.href = table.qrCodeUrl;
    link.download = `qr-table-${table.tableNumber}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setIsDownloading(false);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerate(table.id);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 px-4 py-10">
      <div className="relative mx-auto w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          aria-label="Close QR code modal"
        >
          X
        </button>

        <div className="qr-print-area">
          <p className="hidden text-lg font-bold text-zinc-950 print:block">Nati Nest</p>
          <h2 className="text-xl font-bold text-zinc-100 print:text-zinc-950">QR Code</h2>
          <p className="mt-1 text-sm font-semibold text-amber-400 print:text-zinc-950">
            Table {table.tableNumber}
          </p>

          {table.qrCodeUrl ? (
            <div className="mx-auto mt-4 w-fit rounded-xl bg-white p-4">
              <img
                src={table.qrCodeUrl}
                alt={`QR Code for Table ${table.tableNumber}`}
                className="h-48 w-48 object-contain"
              />
            </div>
          ) : (
            <div className="mx-auto mt-4 flex h-48 w-48 items-center justify-center rounded-xl bg-zinc-800 text-sm text-zinc-500 print:bg-white print:text-zinc-950">
              No QR generated
            </div>
          )}
        </div>

        <p className="mt-3 truncate text-xs text-zinc-500" title={tableUrl}>
          {tableUrl}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            type="button"
            className="w-full"
            onClick={handleDownload}
            disabled={!table.qrCodeUrl || isDownloading}
          >
            {isDownloading ? "Downloading..." : "Download QR"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={handleRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating ? <Loader className="scale-50" /> : "Regenerate"}
          </Button>
          <Button type="button" variant="secondary" className="w-full" onClick={handlePrint}>
            Print QR
          </Button>
          <Button type="button" variant="secondary" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>

        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }

            .qr-print-area,
            .qr-print-area * {
              visibility: visible;
            }

            .qr-print-area {
              position: fixed;
              inset: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 16px;
              background: white;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
