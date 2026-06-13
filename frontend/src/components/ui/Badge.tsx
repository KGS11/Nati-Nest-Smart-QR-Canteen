import { cn } from "@/utils/cn";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  children: React.ReactNode;
  pulse?: boolean;
}

export function Badge({
  variant = "default",
  size = "md",
  children,
  pulse = false,
}: BadgeProps) {
  const variantStyles = {
    default: "bg-zinc-700 text-zinc-300",
    success: "bg-green-500/20 text-green-400 border border-green-500/20",
    warning: "bg-amber-500/20 text-amber-400 border border-amber-500/20",
    danger: "bg-red-500/20 text-red-400 border border-red-500/20",
    info: "bg-blue-500/20 text-blue-400 border border-blue-500/20",
  };

  const dotStyles = {
    default: "bg-zinc-400",
    success: "bg-green-400",
    warning: "bg-amber-400",
    danger: "bg-red-400",
    info: "bg-blue-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        variantStyles[variant]
      )}
    >
      {pulse && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full animate-pulse",
            dotStyles[variant]
          )}
        />
      )}
      {children}
    </span>
  );
}
