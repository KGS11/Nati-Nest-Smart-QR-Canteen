import * as React from "react";
import { cn } from "@/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "brand" | "secondary" | "outline" | "destructive" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-label-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2";

  const variants = {
    default: "border-transparent bg-neutral-900 text-neutral-50 hover:bg-neutral-800",
    brand: "border-transparent bg-brand-500 text-white hover:bg-brand-600 shadow-sm",
    secondary: "border-transparent bg-surface-overlay text-text-secondary hover:bg-neutral-800",
    destructive: "border-transparent bg-semantic_error-500 text-white hover:bg-semantic_error-600 shadow-sm",
    success: "border-transparent bg-success-500 text-white shadow-sm",
    warning: "border-transparent bg-warning-500 text-white shadow-sm",
    outline: "text-neutral-950 border-border-default",
  };

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props} />
  );
}

export { Badge };
