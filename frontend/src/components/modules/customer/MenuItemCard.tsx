"use client";

import Image from "next/image";
import { MenuItem } from "@/types/domain";
import { cn } from "@/utils/cn";
import { getValidImageUrl } from "@/utils/imageUrl";
import { MaterialIcon } from "@/components/stitch/MaterialIcon";

interface MenuItemCardProps {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

const fallbackImage =
  "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=400&q=80";

export function MenuItemCard({
  item,
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
}: MenuItemCardProps) {
  const isAvailable = item.isAvailable;
  const isPopular = item.isPopular;

  return (
    <div
      className={cn(
        "bg-surface-raised rounded-2xl overflow-hidden border border-border-primary active:scale-[0.99] transition-all flex flex-row md:flex-col",
        !isAvailable && "opacity-80"
      )}
    >
      {/* Image Section */}
      <div
        className={cn(
          "relative shrink-0",
          "w-24 h-24",
          "md:w-full md:h-40"
        )}
      >
        <Image
          src={getValidImageUrl(item.imageUrl) || fallbackImage}
          alt={item.name}
          fill
          sizes="(max-width: 768px) 96px, 250px"
          className={cn(
            "object-cover transition-all duration-300",
            !isAvailable && "grayscale opacity-60"
          )}
        />

        <div className="absolute top-0 left-0 flex flex-col items-start z-10">
          {!isAvailable ? (
            <span className="bg-surface-overlay text-text-secondary text-[10px] font-bold px-2 py-0.5 rounded-br-lg">
              SOLD OUT
            </span>
          ) : isPopular ? (
            <span className="bg-accent-500 text-surface-base text-[10px] font-bold px-2 py-0.5 rounded-br-lg">
              BESTSELLER
            </span>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 flex flex-col justify-between">
        <div>
          <span className="text-[10px] text-text-tertiary uppercase tracking-wider block">
            {item.category?.name || "Dish"}
          </span>
          <h3
            className={cn(
              "font-semibold text-sm leading-tight mt-0.5",
              isAvailable ? "text-text-primary" : "text-text-tertiary"
            )}
          >
            {item.name}
          </h3>
          <p className="text-xs text-text-tertiary mt-1 line-clamp-1 md:line-clamp-2 leading-relaxed">
            {item.description || "Freshly prepared canteen favorite"}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="flex items-center justify-between mt-3 gap-2">
          <span className="text-sm font-bold text-accent-400">
            Rs {Number(item.price).toFixed(2)}
          </span>

          <div className="flex-shrink-0">
            {!isAvailable ? (
              <span className="text-xs text-text-muted font-medium">Sold Out</span>
            ) : quantity === 0 ? (
              <button
                type="button"
                onClick={onAdd}
                className="h-9 px-4 rounded-xl bg-accent-500 text-surface-base hover:bg-accent-400 font-semibold text-xs active:scale-95 transition-all"
              >
                Add
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onDecrement}
                  className="w-8 h-8 rounded-lg bg-surface-overlay hover:bg-surface-overlay/80 flex items-center justify-center font-bold text-text-secondary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-accent-500"
                  aria-label={`Decrease ${item.name} quantity`}
                >
                  <MaterialIcon name="remove" className="text-sm" />
                </button>
                <span className="w-5 text-center text-accent-400 font-bold text-sm">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={onIncrement}
                  className="w-8 h-8 rounded-lg bg-accent-500/20 hover:bg-accent-500/30 flex items-center justify-center font-bold text-accent-400 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-accent-500"
                  aria-label={`Increase ${item.name} quantity`}
                >
                  <MaterialIcon name="add" className="text-sm" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
