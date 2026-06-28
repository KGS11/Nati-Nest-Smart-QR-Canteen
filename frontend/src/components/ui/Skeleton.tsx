import { cn } from "@/utils/cn";

interface SkeletonProps {
  variant?: "text" | "card" | "image" | "circle";
  count?: number;
  className?: string;
}

export function Skeleton({ variant = "text", count = 1, className }: SkeletonProps) {
  const items = Array.from({ length: count });

  const getVariantStyles = () => {
    switch (variant) {
      case "circle":
        return "rounded-full";
      case "image":
        return "rounded-xl aspect-square w-full";
      case "card":
        return "rounded-2xl h-32 w-full";
      case "text":
      default:
        return "h-4 w-full rounded";
    }
  };

  return (
    <>
      {items.map((_, index) => (
        <div
          key={index}
          className={cn("bg-surface-raised animate-pulse shadow-sm", getVariantStyles(), className)}
        />
      ))}
    </>
  );
}

export function MenuItemSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-surface-base p-3 border border-border-default shadow-sm">
      <Skeleton variant="circle" className="h-20 w-20 shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton variant="text" className="h-5 w-1/3" />
        <Skeleton variant="text" className="h-4 w-3/4" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton variant="text" className="h-6 w-12" />
          <Skeleton variant="text" className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="rounded-2xl bg-surface-base border border-border-default p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="h-5 w-1/4" />
        <Skeleton variant="text" className="h-5 w-16" />
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" className="h-4 w-full" />
        <Skeleton variant="text" className="h-4 w-5/6" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton variant="text" className="h-4 w-20" />
        <Skeleton variant="text" className="h-8 w-24" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-surface-base border border-border-default p-5 space-y-2 shadow-sm">
      <Skeleton variant="text" className="h-4 w-1/3" />
      <Skeleton variant="text" className="h-8 w-2/3" />
    </div>
  );
}
