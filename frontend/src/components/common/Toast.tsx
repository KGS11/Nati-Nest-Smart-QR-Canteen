import clsx from "clsx";

type ToastProps = {
  title: string;
  message?: string;
  tone?: "info" | "success" | "error" | "warning";
};

export function Toast({ title, message, tone = "info" }: ToastProps) {
  // SVG Icons
  const icons = {
    success: (
      <svg className="h-5 w-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5 text-amber-555 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <>
      <style>{`
        @keyframes toast-slide-in {
          0% {
            opacity: 0;
            transform: translateY(-1rem) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @media (min-width: 768px) {
          @keyframes toast-slide-in {
            0% {
              opacity: 0;
              transform: translateX(1rem) scale(0.95);
            }
            100% {
              opacity: 1;
              transform: translateX(0) scale(1);
            }
          }
        }
        .animate-toast-slide {
          animation: toast-slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      <div
        className={clsx(
          "animate-toast-slide flex items-start gap-3 rounded-xl border bg-zinc-900/90 backdrop-blur-md p-4 shadow-2xl transition-all duration-300",
          tone === "info" && "border-blue-500/20 bg-zinc-900/95",
          tone === "success" && "border-emerald-500/20 bg-zinc-900/95",
          tone === "error" && "border-red-500/20 bg-zinc-900/95",
          tone === "warning" && "border-amber-500/20 bg-zinc-900/95"
        )}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="mt-0.5">{icons[tone]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-zinc-100 leading-tight">{title}</p>
          {message && (
            <p className="mt-1 text-xs text-zinc-400 leading-normal">{message}</p>
          )}
        </div>
      </div>
    </>
  );
}
