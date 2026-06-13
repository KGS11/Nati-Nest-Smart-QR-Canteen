import { MaterialIcon } from "./MaterialIcon";

interface StatePanelProps {
  title: string;
  message: string;
  tone?: "neutral" | "error";
  action?: React.ReactNode;
}

export function StatePanel({ title, message, tone = "neutral", action }: StatePanelProps) {
  const icon = tone === "error" ? "error" : "hourglass_empty";

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg text-center shadow-stitch">
      <div className="mx-auto mb-sm flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-primary">
        <MaterialIcon name={icon} />
      </div>
      <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
      <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">{message}</p>
      {action ? <div className="mt-md">{action}</div> : null}
    </div>
  );
}
