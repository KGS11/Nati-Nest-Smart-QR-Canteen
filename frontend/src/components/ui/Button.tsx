import * as React from "react";
import { cn } from "@/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "brand" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-label-md font-medium ring-offset-surface-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

    const variants = {
      default: "bg-neutral-900 text-neutral-50 hover:bg-neutral-800 shadow-sm",
      brand: "bg-brand-500 text-white hover:bg-brand-600 shadow-sm",
      destructive: "bg-semantic_error-500 text-white hover:bg-semantic_error-600 shadow-sm",
      outline: "border border-border-default bg-surface-base hover:bg-surface-overlay hover:text-text-primary",
      secondary: "bg-surface-overlay text-text-primary hover:bg-neutral-800",
      ghost: "hover:bg-surface-overlay hover:text-text-primary",
      link: "text-brand-500 underline-offset-4 hover:underline",
    };

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3 text-label-sm",
      lg: "h-11 rounded-md px-8 text-label-lg",
      icon: "h-10 w-10",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
