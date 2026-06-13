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
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-zinc-800 pb-6 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 md:text-3xl">
          Today's Menu
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Configure available items for customer order taking. Master catalog is unaffected.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-850 rounded-xl px-4 py-2 text-sm select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-zinc-500">Active:</span>
          <span className="font-semibold text-zinc-200">{formattedDate}</span>
          <span className="text-zinc-400 font-bold">({totalItems})</span>
        </div>

        <Button
          variant="secondary"
          onClick={onHistoryClick}
          className="rounded-xl border border-zinc-800 hover:border-zinc-700 gap-2 shrink-0 min-h-11"
        >
          <span>📅</span> History
        </Button>

        <Button
          variant="primary"
          onClick={onCopyClick}
          disabled={isCopyDisabled}
          className="rounded-xl gap-2 font-bold shrink-0 min-h-11 shadow-lg shadow-amber-500/10"
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
