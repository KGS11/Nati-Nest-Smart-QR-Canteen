"use client";

import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-center">
          <h2 className="mb-2 text-2xl font-bold text-red-400">Application fault</h2>
          <p className="mb-6 max-w-sm text-sm text-zinc-400">
            {error.message || "A critical rendering error occurred."}
          </p>
          <button
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-all duration-200 hover:bg-amber-400"
            onClick={reset}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
