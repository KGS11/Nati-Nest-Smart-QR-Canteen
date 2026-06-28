import clsx from "clsx";

export default function Loader({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={clsx("flex flex-col items-center gap-4 text-center", className)}>
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-border-primary border-t-accent-400" />
      {label ? <p className="text-sm text-text-secondary">{label}</p> : null}
    </div>
  );
}
