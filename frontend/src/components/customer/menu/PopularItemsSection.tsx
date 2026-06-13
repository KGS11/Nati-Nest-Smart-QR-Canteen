"use client";

import Image from "next/image";
import { MenuItem } from "@/types/domain";
import { useCart } from "@/hooks/useCart";

interface PopularItemsSectionProps {
  items: MenuItem[];
}

const fallbackImage =
  "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=400&q=80";

export function PopularItemsSection({ items }: PopularItemsSectionProps) {
  const { items: cartItems, addItem, updateQuantity } = useCart();

  const popularItems = items
    .filter((item) => item.isAvailable)
    .filter((item) => item.isPopular)
    .slice(0, 5);

  if (popularItems.length === 0) return null;

  return (
    <div className="py-4">
      <h2 className="text-base font-bold text-zinc-100 px-4 mb-3 flex items-center gap-1.5">
        <span>⭐</span> Popular Items
      </h2>

      <div className="hide-scrollbar flex gap-3 overflow-x-auto px-4 pb-2">
        {popularItems.map((item) => {
          const cartItem = cartItems.find((ci) => ci.id === item.id);
          const quantity = cartItem?.quantity ?? 0;

          return (
            <div
              key={item.id}
              className="w-36 flex-shrink-0 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm"
            >
              <div className="relative w-full h-28 bg-zinc-800 shrink-0">
                <Image
                  src={item.imageUrl || fallbackImage}
                  alt={item.name}
                  fill
                  sizes="144px"
                  className="object-cover"
                />
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-100 line-clamp-2 leading-tight">
                    {item.name}
                  </h3>
                  <p className="text-sm font-bold text-amber-400 mt-1">
                    ₹{Number(item.price).toFixed(2)}
                  </p>
                </div>

                <div className="mt-3">
                  {quantity > 0 ? (
                    <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-lg h-8 px-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, quantity - 1)}
                        className="text-amber-400 font-bold px-1.5 py-0.5 hover:bg-amber-500/20 rounded text-sm transition-colors focus:outline-none"
                      >
                        -
                      </button>
                      <span className="text-amber-400 font-bold text-xs">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, quantity + 1)}
                        className="text-amber-400 font-bold px-1.5 py-0.5 hover:bg-amber-500/20 rounded text-sm transition-colors focus:outline-none"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addItem(item)}
                      className="w-full h-8 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs active:scale-95 transition-all focus:outline-none"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
