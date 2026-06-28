import { Button } from "@/components/common/Button";

interface DailyMenuHeaderProps {
  dateString: string;
  totalItems: number;
  onCopyClick: () => void;
  isCopyDisabled: boolean;
  isCopying: boolean;
  onHistoryClick: () => void;
}

export function DailyMenuHeader({
  dateString,
  totalItems,
  onCopyClick,
  isCopyDisabled,
  isCopying,
  onHistoryClick,
}: DailyMenuHeaderProps) {
  const formattedDate = dateString ? new Date(dateString + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  }) : "...";

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border-default pb-6 mb-6">
      <div>
        <h1 className="text-display-md font-bold tracking-tight text-text-primary md:text-display-lg">
          Today's Menu
        </h1>
        <p className="mt-1 text-body-sm text-text-tertiary">
          Configure available items for customer order taking. Master catalog is unaffected.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-surface-raised border border-border-default rounded-xl px-4 py-2 text-label-sm select-none">
          <span className="w-2 h-2 rounded-full bg-semantic_success-500 animate-pulse" />
          <span className="text-text-tertiary">Active:</span>
          <span className="font-semibold text-text-secondary">{formattedDate}</span>
          <span className="text-text-tertiary font-bold">({totalItems})</span>
        </div>

        <Button
          variant="secondary"
          onClick={onHistoryClick}
          className="rounded-xl border border-border-default hover:border-border-hover gap-2 shrink-0 min-h-11"
        >
          <span>📅</span> History
        </Button>

        <Button
          variant="primary"
          onClick={onCopyClick}
          disabled={isCopyDisabled}
          className="rounded-xl gap-2 font-bold shrink-0 min-h-11 shadow-lg shadow-brand-500/10"
        >
          {isCopying ? (
            <span className="inline-block animate-spin mr-1">⏳</span>
          ) : (
            <span className="mr-1">📋</span>
          )}
          Copy Yesterday
        </Button>
      </div>
    </div>
  );
}
