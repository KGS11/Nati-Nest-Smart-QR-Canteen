"use client";

import { useEffect } from "react";
import { Button } from "@/components/common/Button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Uncaught application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-center">
      <h2 className="mb-2 text-2xl font-bold text-red-400">Something went wrong</h2>
      <p className="mb-6 max-w-sm text-sm text-zinc-400">
        {error.message || "An unexpected system fault occurred while rendering this module."}
      </p>
      <div className="flex gap-4">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="secondary" onClick={() => (window.location.href = "/")}>
          Return Home
        </Button>
      </div>
    </div>
  );
}
