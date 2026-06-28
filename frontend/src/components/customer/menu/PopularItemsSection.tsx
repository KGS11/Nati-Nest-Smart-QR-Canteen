"use client";

import Image from "next/image";
import { MenuItem } from "@/types/domain";
import { useCart } from "@/hooks/useCart";
import { getValidImageUrl } from "@/utils/imageUrl";

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
      <h2 className="text-display-xs font-bold text-text-primary px-4 mb-3 flex items-center gap-1.5">
        <span>⭐</span> Popular Items
      </h2>

      <div className="hide-scrollbar flex gap-3 overflow-x-auto px-4 pb-2">
        {popularItems.map((item) => {
          const cartItem = cartItems.find((ci) => ci.id === item.id);
          const quantity = cartItem?.quantity ?? 0;

          return (
            <div
              key={item.id}
              className="w-36 flex-shrink-0 bg-surface-raised border border-border-default rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm"
            >
              <div className="relative h-32 w-full bg-surface-base">
                <Image
                  src={getValidImageUrl(item.imageUrl) || fallbackImage}
                  alt={item.name}
                  fill
                  sizes="144px"
                  className="object-cover"
                />
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-label-xs font-semibold text-text-primary line-clamp-2 leading-tight">
                    {item.name}
                  </h3>
                  <p className="text-label-sm font-bold text-brand-500 mt-1">
                    ₹{Number(item.price).toFixed(2)}
                  </p>
                </div>

                <div className="mt-3">
                  {quantity > 0 ? (
                    <div className="flex items-center justify-between bg-brand-500/10 border border-brand-500/20 rounded-lg h-8 px-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, quantity - 1)}
                        className="text-brand-500 font-bold px-1.5 py-0.5 hover:bg-brand-500/20 rounded text-label-sm transition-colors focus:outline-none"
                      >
                        -
                      </button>
                      <span className="text-brand-500 font-bold text-label-xs">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, quantity + 1)}
                        className="text-brand-500 font-bold px-1.5 py-0.5 hover:bg-brand-500/20 rounded text-label-sm transition-colors focus:outline-none"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addItem(item)}
                      className="w-full h-8 rounded-lg bg-brand-500 hover:bg-brand-400 text-brand-950 font-bold text-label-xs active:scale-95 transition-all focus:outline-none"
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
