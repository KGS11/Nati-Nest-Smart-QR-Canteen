"use client";

import { useEffect, useState } from "react";

interface EstimatedWaitBadgeProps {
  preparingAt: string;
}

export function EstimatedWaitBadge({ preparingAt }: EstimatedWaitBadgeProps) {
  const [remaining, setRemaining] = useState<number>(15);

  useEffect(() => {
    const calculateRemaining = () => {
      const prepTimeMs = 15 * 60 * 1000;
      const prepStart = new Date(preparingAt).getTime();
      const now = Date.now();
      const elapsedMs = now - prepStart;
      const remainingMins = Math.max(0, Math.ceil((prepTimeMs - elapsedMs) / (60 * 1000)));
      setRemaining(remainingMins);
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 60000);

    return () => clearInterval(interval);
  }, [preparingAt]);

  return (
    <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl px-3 py-1.5 inline-flex items-center gap-2 text-sm mt-2 w-fit">
      <span>⏱️</span>
      <span>{remaining > 0 ? `About ${remaining} min remaining` : "Ready soon!"}</span>
    </div>
  );
}
