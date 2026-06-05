"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";

export function TopNavbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { isConnected } = useSocket();

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 px-4 py-4 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-50">{title}</h1>
          {subtitle ? <p className="text-xs text-zinc-500">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-400">
          {isConnected ? <Wifi className="h-4 w-4 text-emerald-400" /> : <WifiOff className="h-4 w-4 text-zinc-500" />}
          {isConnected ? "Live" : "Offline"}
        </div>
      </div>
    </header>
  );
}
