import { Button } from "@/components/ui/Button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="text-5xl mb-4 text-red-500 opacity-80 select-none">⚠️</div>
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <p className="text-sm text-text-tertiary mt-2 max-w-xs mx-auto leading-relaxed">
        {description}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 px-5 py-2.5 rounded-xl border border-accent-500/30 bg-accent-500/10 text-accent-400 font-semibold text-sm hover:bg-accent-500/20 active:scale-95 transition-all"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
