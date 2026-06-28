"use client";

import { useEffect, useRef } from "react";
import { MenuCategory } from "@/types/domain";
import { cn } from "@/utils/cn";

interface CategoryTabBarProps {
  categories: MenuCategory[];
  activeCategory: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryTabBar({
  categories,
  activeCategory,
  onSelect,
}: CategoryTabBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector("[data-active='true']");
    if (activeEl && typeof activeEl.scrollIntoView === "function") {
      activeEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeCategory]);

  return (
    <div className="sticky top-0 z-20 bg-neutral-950/80 backdrop-blur-md border-b border-border-default w-full">
      <div
        ref={containerRef}
        className="hide-scrollbar flex overflow-x-auto gap-2 px-4 py-3"
      >
        <button
          type="button"
          data-active={activeCategory === null}
          onClick={() => onSelect(null)}
          className={cn(
            "flex-shrink-0 px-4 py-2 rounded-full text-label-sm font-medium transition-all active:scale-95",
            activeCategory === null
              ? "bg-brand-500 text-brand-950"
              : "bg-surface-raised text-text-tertiary hover:bg-surface-base hover:text-text-primary"
          )}
        >
          All
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            data-active={activeCategory === category.id}
            onClick={() => onSelect(category.id)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-label-sm font-medium transition-all active:scale-95",
              activeCategory === category.id
                ? "bg-brand-500 text-brand-950"
                : "bg-surface-raised text-text-tertiary hover:bg-surface-base hover:text-text-primary"
            )}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
