"use client";

import { useState } from "react";
import Image from "next/image";
import { CartItem } from "@/stores/cartStore";
import { SpecialInstructionsModal } from "./SpecialInstructionsModal";
import { MaterialIcon } from "@/components/stitch/MaterialIcon";

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (id: string, qty: number) => void;
  onUpdateInstructions: (id: string, text: string) => void;
  onRemove: (id: string) => void;
}

export function CartItemRow({
  item,
  onUpdateQuantity,
  onUpdateInstructions,
  onRemove,
}: CartItemRowProps) {
  const [showNoteModal, setShowNoteModal] = useState(false);

  return (
    <div className="flex gap-3 py-3 border-b border-zinc-800 last:border-0">
      {item.imageUrl ? (
        <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 text-xl">
          🍽️
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <h4 className="font-medium text-zinc-100 truncate text-sm">
            {item.name}
          </h4>
          {item.instructions ? (
            <p
              onClick={() => setShowNoteModal(true)}
              className="text-xs text-zinc-500 italic truncate cursor-pointer hover:text-zinc-400 mt-0.5"
            >
              "{item.instructions}"
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setShowNoteModal(true)}
          className="text-xs text-amber-400 font-medium mt-1 flex items-center gap-1 w-fit focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 rounded px-1"
        >
          <MaterialIcon name="edit_note" className="text-xs" />
          {item.instructions ? "Edit note" : "Add note"}
        </button>
      </div>

      <div className="flex flex-col items-end justify-between py-0.5 flex-shrink-0">
        <span className="font-semibold text-amber-400 text-sm">
          ₹ {(item.price * item.quantity).toFixed(2)}
        </span>

        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className={`w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold transition-colors hover:bg-zinc-700 focus:outline-none ${
              item.quantity === 1 ? "text-red-400" : "text-zinc-300"
            }`}
            aria-label={item.quantity === 1 ? `Remove ${item.name}` : `Decrease ${item.name}`}
          >
            {item.quantity === 1 ? (
              <MaterialIcon name="delete" className="text-sm" />
            ) : (
              <MaterialIcon name="remove" className="text-sm" />
            )}
          </button>

          <span className="w-6 text-center font-bold text-zinc-100 text-sm">
            {item.quantity}
          </span>

          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold transition-colors hover:bg-amber-500/30 focus:outline-none"
            aria-label={`Increase ${item.name}`}
          >
            <MaterialIcon name="add" className="text-sm" />
          </button>
        </div>

        {showNoteModal && (
          <SpecialInstructionsModal
            itemName={item.name}
            currentInstructions={item.instructions || ""}
            onSave={(text) => onUpdateInstructions(item.id, text)}
            onClose={() => setShowNoteModal(false)}
          />
        )}
      </div>
    </div>
  );
}
