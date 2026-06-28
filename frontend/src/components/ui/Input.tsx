import * as React from "react";
import { cn } from "@/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    const inputElement = (
      <input
        id={inputId}
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-border-default bg-surface-base px-3 py-2 text-body-md ring-offset-surface-base file:border-0 file:bg-transparent file:text-label-sm file:font-medium placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          error && "border-semantic_error-500 focus-visible:ring-semantic_error-500/20 focus-visible:border-semantic_error-500",
          className
        )}
        ref={ref}
        {...props}
      />
    );

    if (label || error) {
      return (
        <div className="block space-y-2 text-left w-full">
          {label && (
            <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
              {label}
            </label>
          )}
          {inputElement}
          {error && (
            <span className="text-xs text-semantic_error-400">{error}</span>
          )}
        </div>
      );
    }

    return inputElement;
  }
);
Input.displayName = "Input";

export { Input };
