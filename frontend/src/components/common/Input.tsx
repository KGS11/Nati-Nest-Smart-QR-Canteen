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
      {label ? <span className="text-sm font-medium text-zinc-200">{label}</span> : null}
      <input
        id={inputId}
        className={clsx(
          "h-11 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition-all duration-200 placeholder:text-zinc-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20",
          error && "border-red-500 focus:border-red-400 focus:ring-red-400/20",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-red-400">{error}</span> : null}
    </label>
  );
}
