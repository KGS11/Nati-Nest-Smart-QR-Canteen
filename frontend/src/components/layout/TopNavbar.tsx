"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/utils/cn";

export function TopNavbar({ title, subtitle, className }: { title: string; subtitle?: string; className?: string }) {
  const { isConnected } = useSocket();

  return (
    <header className={cn("sticky top-0 z-10 border-b border-border-default bg-surface-base/90 px-4 py-4 backdrop-blur-md", className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-semibold text-text-primary tracking-tight">{title}</h1>
          {subtitle && <p className="text-body-sm text-text-tertiary mt-0.5">{subtitle}</p>}
        </div>

        <Badge
          variant={isConnected ? "success" : "secondary"}
          className="gap-1.5 h-8 px-3 hidden sm:inline-flex"
        >
          {isConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {isConnected ? "Live" : "Offline"}
        </Badge>

        {/* Mobile minimal indicator */}
        <div className="sm:hidden flex items-center justify-center w-8 h-8 rounded-full bg-surface-raised border border-border-default">
          {isConnected ? <Wifi className="h-4 w-4 text-success-500" /> : <WifiOff className="h-4 w-4 text-text-tertiary" />}
        </div>
      </div>
    </header>
  );
}
