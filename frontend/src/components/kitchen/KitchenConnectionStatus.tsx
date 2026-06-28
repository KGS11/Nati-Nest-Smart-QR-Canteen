"use client";

interface KitchenConnectionStatusProps {
  isConnected: boolean;
}

export function KitchenConnectionStatus({ isConnected }: KitchenConnectionStatusProps) {
  return (
    <span
      className={
        isConnected
          ? "inline-flex min-h-9 items-center gap-2 rounded-full border border-semantic_success-500/20 bg-semantic_success-500/10 px-3 text-label-sm font-semibold text-semantic_success-400"
          : "inline-flex min-h-9 items-center gap-2 rounded-full border border-semantic_error-500/20 bg-semantic_error-500/10 px-3 text-label-sm font-semibold text-semantic_error-400"
      }
    >
      <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? "animate-pulse bg-semantic_success-400" : "bg-semantic_error-400"}`} />
      {isConnected ? "Live" : "Reconnecting..."}
    </span>
  );
}
