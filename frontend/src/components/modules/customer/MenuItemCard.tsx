"use client";

import Image from "next/image";
import { MenuItem } from "@/types/domain";
import { cn } from "@/utils/cn";
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
        "bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 active:scale-[0.99] transition-all flex flex-row md:flex-col",
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
          src={item.imageUrl || fallbackImage}
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
            <span className="bg-zinc-700 text-zinc-350 text-[10px] font-bold px-2 py-0.5 rounded-br-lg">
              SOLD OUT
            </span>
          ) : isPopular ? (
            <span className="bg-amber-500 text-zinc-950 text-[10px] font-bold px-2 py-0.5 rounded-br-lg">
              BESTSELLER
            </span>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 flex flex-col justify-between">
        <div>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
            {item.category?.name || "Dish"}
          </span>
          <h3
            className={cn(
              "font-semibold text-sm leading-tight mt-0.5",
              isAvailable ? "text-zinc-100" : "text-zinc-500"
            )}
          >
            {item.name}
          </h3>
          <p className="text-xs text-zinc-500 mt-1 line-clamp-1 md:line-clamp-2 leading-relaxed">
            {item.description || "Freshly prepared canteen favorite"}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="flex items-center justify-between mt-3 gap-2">
          <span className="text-sm font-bold text-amber-400">
            Rs {Number(item.price).toFixed(2)}
          </span>

          <div className="flex-shrink-0">
            {!isAvailable ? (
              <span className="text-xs text-zinc-650 font-medium">Sold Out</span>
            ) : quantity === 0 ? (
              <button
                type="button"
                onClick={onAdd}
                className="h-9 px-4 rounded-xl bg-amber-500 text-zinc-950 hover:bg-amber-400 font-semibold text-xs active:scale-95 transition-all"
              >
                Add
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onDecrement}
                  className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center font-bold text-zinc-300 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
                  aria-label={`Decrease ${item.name} quantity`}
                >
                  <MaterialIcon name="remove" className="text-sm" />
                </button>
                <span className="w-5 text-center text-amber-400 font-bold text-sm">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={onIncrement}
                  className="w-8 h-8 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 flex items-center justify-center font-bold text-amber-400 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
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
