import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-accent-500 text-surface-base hover:bg-accent-400",
        variant === "secondary" && "bg-surface-overlay text-text-primary hover:bg-surface-overlay/80",
        variant === "danger" && "bg-semantic_error-500 text-white hover:bg-semantic_error-400",
        className,
      )}
      {...props}
    />
  );
}
