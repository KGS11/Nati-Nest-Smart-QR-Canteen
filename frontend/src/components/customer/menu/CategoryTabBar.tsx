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
    <div className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50 w-full">
      <div
        ref={containerRef}
        className="hide-scrollbar flex overflow-x-auto gap-2 px-4 py-3"
      >
        <button
          type="button"
          data-active={activeCategory === null}
          onClick={() => onSelect(null)}
          className={cn(
            "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95",
            activeCategory === null
              ? "bg-amber-500 text-zinc-950"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
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
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95",
              activeCategory === category.id
                ? "bg-amber-500 text-zinc-950"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
            )}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
