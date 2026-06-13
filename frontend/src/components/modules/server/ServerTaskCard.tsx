import { MaterialIcon } from "@/components/stitch/MaterialIcon";
import { StitchButton } from "@/components/stitch/StitchButton";

interface ServerTaskCardProps {
  icon: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  busy?: boolean;
  onAction: () => void;
}

export function ServerTaskCard({
  icon,
  title,
  subtitle,
  actionLabel,
  busy,
  onAction,
}: ServerTaskCardProps) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-stitch">
      <div className="flex items-start gap-md">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-primary">
          <MaterialIcon name={icon} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
          <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">{subtitle}</p>
        </div>
      </div>
      <StitchButton type="button" onClick={onAction} disabled={busy} className="mt-md w-full">
        <MaterialIcon name={busy ? "sync" : "done"} />
        {busy ? "Updating..." : actionLabel}
      </StitchButton>
    </div>
  );
}
