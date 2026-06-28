import { HTMLAttributes } from "react";
import clsx from "clsx";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-lg border border-border-primary bg-surface-raised/80 p-6 shadow-glow backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}
