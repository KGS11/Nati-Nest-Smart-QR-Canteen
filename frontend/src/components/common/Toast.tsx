import clsx from "clsx";

type ToastProps = {
  title: string;
  message?: string;
  tone?: "info" | "success" | "error";
};

export function Toast({ title, message, tone = "info" }: ToastProps) {
  return (
    <div
      className={clsx(
        "rounded-lg border bg-zinc-900 px-4 py-3 shadow-glow",
        tone === "info" && "border-amber-400/30",
        tone === "success" && "border-emerald-400/30",
        tone === "error" && "border-red-400/30",
      )}
    >
      <p className="text-sm font-medium text-zinc-100">{title}</p>
      {message ? <p className="mt-1 text-xs text-zinc-400">{message}</p> : null}
    </div>
  );
}
