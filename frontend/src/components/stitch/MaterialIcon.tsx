import clsx from "clsx";

export function MaterialIcon({ name, className }: { name: string; className?: string }) {
  return <span className={clsx("material-symbols-outlined", className)}>{name}</span>;
}
