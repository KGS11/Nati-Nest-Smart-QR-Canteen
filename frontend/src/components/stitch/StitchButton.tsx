import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type StitchButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
};

export function StitchButton({ className, variant = "primary", ...props }: StitchButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-touch-min items-center justify-center gap-sm rounded-lg px-md py-sm font-label-md text-label-md transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-primary-container text-white shadow-sm hover:brightness-110",
        variant === "secondary" && "bg-secondary text-on-secondary hover:opacity-90",
        variant === "ghost" && "text-primary hover:bg-surface-container",
        variant === "outline" && "border border-outline-variant text-primary hover:bg-surface-container",
        className,
      )}
      {...props}
    />
  );
}
