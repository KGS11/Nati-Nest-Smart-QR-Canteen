"use client";

import { useEffect, useRef, useState } from "react";
import { MenuItem } from "@/types/domain";
import { MenuItemCard } from "../../modules/customer/MenuItemCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCart } from "@/hooks/useCart";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItem[];
  onAdd: (item: MenuItem) => void;
}

export function SearchOverlay({
  isOpen,
  onClose,
  items,
  onAdd,
}: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { items: cartItems, updateQuantity } = useCart();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    if (!debouncedQuery.trim()) return false;
    const q = debouncedQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col p-4 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onClose}
          className="text-brand-500 font-bold text-display-sm p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg shrink-0"
          aria-label="Back to menu"
        >
          ←
        </button>
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search menu..."
            className="w-full h-12 bg-surface-raised border border-border-default rounded-xl px-4 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="flex-1 space-y-4">
        {debouncedQuery.trim() === "" ? (
          <div className="text-center text-text-tertiary py-12">
            Type to search delicious dishes...
          </div>
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const cartItem = cartItems.find((ci) => ci.id === item.id);
            const quantity = cartItem?.quantity ?? 0;

            return (
              <MenuItemCard
                key={item.id}
                item={item}
                quantity={quantity}
                onAdd={() => onAdd(item)}
                onIncrement={() => updateQuantity(item.id, quantity + 1)}
                onDecrement={() => updateQuantity(item.id, quantity - 1)}
              />
            );
          })
        ) : (
          <EmptyState
            icon="🔍"
            title="No items found"
            description={`No results matching "${debouncedQuery}"`}
          />
        )}
      </div>
    </div>
  );
}
