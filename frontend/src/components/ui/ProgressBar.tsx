import { cn } from "@/utils/cn";

interface ProgressBarProps {
  steps: string[];
  currentStep: number;
  variant: "horizontal" | "vertical";
}

export function ProgressBar({ steps, currentStep, variant }: ProgressBarProps) {
  if (variant === "horizontal") {
    return (
      <div className="w-full py-4">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-zinc-800 -z-10" />

          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-amber-500 transition-all duration-300 -z-10"
            style={{
              width: `${(Math.min(currentStep, steps.length - 1) / (steps.length - 1)) * 100}%`,
            }}
          />

          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            const isUpcoming = idx > currentStep;

            return (
              <div key={step} className="flex flex-col items-center flex-1 relative">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                    isCompleted && "bg-amber-500 text-zinc-950",
                    isCurrent && "bg-amber-500 ring-4 ring-amber-500/20 animate-pulse text-zinc-950",
                    isUpcoming && "bg-zinc-700 text-zinc-400"
                  )}
                >
                  <span className="text-[10px] font-bold">{idx + 1}</span>
                </div>

                <span
                  className={cn(
                    "text-xs mt-2 font-medium text-center absolute top-6 whitespace-nowrap",
                    isCompleted && "text-amber-400",
                    isCurrent && "text-zinc-100",
                    isUpcoming && "text-zinc-500"
                  )}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col py-2">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isCurrent = idx === currentStep;
        const isUpcoming = idx > currentStep;

        return (
          <div key={step} className="flex gap-4 items-start relative pb-8 last:pb-0">
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "absolute left-[11px] top-6 bottom-0 w-0.5 -z-10",
                  isCompleted ? "bg-amber-500" : "bg-zinc-800"
                )}
              />
            )}

            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300",
                isCompleted && "bg-amber-500 text-zinc-950",
                isCurrent && "bg-amber-500 ring-4 ring-amber-500/20 animate-pulse text-zinc-950",
                isUpcoming && "bg-zinc-700 text-zinc-400"
              )}
            >
              <span className="text-[10px] font-bold">{idx + 1}</span>
            </div>

            <span
              className={cn(
                "text-sm font-medium",
                isCompleted && "text-amber-400",
                isCurrent && "text-zinc-100",
                isUpcoming && "text-zinc-500"
              )}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}
