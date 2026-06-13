"use client";

import { useEffect, useState } from "react";

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
  return `${minutes}m ${remainder}s`;
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
      ? "text-green-400"
      : minutes < dangerThresholdMinutes
        ? "text-amber-400"
        : "animate-pulse text-red-400";

  return <span className={`text-xs font-semibold ${colorClass}`}>{formatElapsed(seconds)}</span>;
}
