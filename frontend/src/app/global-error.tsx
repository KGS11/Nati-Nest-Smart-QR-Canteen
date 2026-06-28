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
        <div className="flex min-h-screen flex-col items-center justify-center bg-surface-base p-6 text-center text-text-primary">
          <h2 className="mb-2 text-2xl font-bold text-red-400">Application fault</h2>
          <p className="mb-6 max-w-sm text-sm text-text-secondary">
            {error.message || "A critical rendering error occurred."}
          </p>
          <button
            className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-surface-base transition-all duration-200 hover:bg-accent-400"
            onClick={reset}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
