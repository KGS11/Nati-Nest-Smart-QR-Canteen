"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";

interface OrderTimerProps {
  placedAt: string;
  warningThresholdMinutes?: number;
  dangerThresholdMinutes?: number;
}

const elapsedSeconds = (placedAt: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(placedAt).getTime()) / 1000));

const formatElapsed = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
};

export function OrderTimer({
  placedAt,
  warningThresholdMinutes = 5,
  dangerThresholdMinutes = 10,
}: OrderTimerProps) {
  const [seconds, setSeconds] = useState(() => elapsedSeconds(placedAt));

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSeconds(elapsedSeconds(placedAt));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [placedAt]);

  const minutes = seconds / 60;
  const colorClass =
    minutes < warningThresholdMinutes
      ? "text-success-500"
      : minutes < dangerThresholdMinutes
        ? "text-warning-500"
        : "animate-pulse text-semantic_error-500";

  return <span className={cn("font-mono text-body-md font-bold tabular-nums tracking-widest", colorClass)}>{formatElapsed(seconds)}</span>;
}
