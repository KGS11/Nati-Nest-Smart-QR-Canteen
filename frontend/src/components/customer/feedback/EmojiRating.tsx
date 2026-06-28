"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { MaterialIcon } from "@/components/stitch/MaterialIcon";

interface EmojiRatingProps {
  value: number | null;
  onChange: (rating: number) => void;
}

const EMOJIS: Record<number, { marker: string; label: string }> = {
  1: { marker: "1/5", label: "Poor" },
  2: { marker: "2/5", label: "Fair" },
  3: { marker: "3/5", label: "Good" },
  4: { marker: "4/5", label: "Great" },
  5: { marker: "5/5", label: "Amazing" },
};

export function EmojiRating({ value, onChange }: EmojiRatingProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (value) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 300);
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="flex justify-between w-full max-w-xs px-2">
        {[1, 2, 3, 4, 5].map((num) => {
          const item = EMOJIS[num];
          const isSelected = value === num;

          return (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              className="flex flex-col items-center gap-1.5 focus:outline-none"
            >
              <span
                className={cn(
                  "text-4xl transition-all duration-200 select-none active:scale-110 hover:scale-105",
                  isSelected ? "scale-125 opacity-100" : "scale-100 opacity-50 grayscale-[20%]"
                )}
              >
                {item.marker}
              </span>
              <span
                className={cn(
                  "text-[10px] transition-colors",
                  isSelected ? "text-accent-400 font-bold" : "text-text-tertiary"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-1 justify-center mt-2">
        {[1, 2, 3, 4, 5].map((num) => {
          const isFilled = value !== null && num <= value;
          return (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              className="focus:outline-none p-1 active:scale-90 transition-transform"
              aria-label={`Rate ${num} stars`}
            >
              <MaterialIcon
                name={isFilled ? "star" : "star_outline"}
                className={cn(
                  "text-2xl transition-colors",
                  isFilled ? "text-accent-400" : "text-text-muted"
                )}
              />
            </button>
          );
        })}
      </div>

      {value && (
        <div
          className={cn(
            "text-lg font-bold text-text-primary transition-all duration-200",
            animate ? "scale-110 opacity-80" : "scale-100 opacity-100"
          )}
        >
          {EMOJIS[value].label}
        </div>
      )}
    </div>
  );
}
