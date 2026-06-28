import { InputHTMLAttributes } from "react";
import clsx from "clsx";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="block space-y-2 text-left">
      {label ? <span className="text-sm font-medium text-text-primary">{label}</span> : null}
      <input
        id={inputId}
        className={clsx(
          "h-11 w-full rounded-lg border border-border-primary bg-surface-base px-3 text-sm text-text-primary outline-none transition-all duration-200 placeholder:text-text-muted focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20",
          error && "border-semantic_error-500 focus:border-semantic_error-400 focus:ring-semantic_error-400/20",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-semantic_error-400">{error}</span> : null}
    </label>
  );
}
