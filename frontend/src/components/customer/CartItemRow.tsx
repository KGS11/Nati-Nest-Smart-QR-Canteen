"use client";

import { useState } from "react";
import Image from "next/image";
import { CartItem } from "@/stores/cartStore";
import { SpecialInstructionsModal } from "./SpecialInstructionsModal";
import { MaterialIcon } from "@/components/stitch/MaterialIcon";
import { formatCurrency } from "@/utils/format";
import { getValidImageUrl } from "@/utils/imageUrl";

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
    <div className="flex gap-3 py-3 border-b border-border-default last:border-0">
      {item.imageUrl ? (
        <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-surface-raised">
          <Image
            src={getValidImageUrl(item.imageUrl)!}
            alt={item.name}
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-xl bg-surface-raised flex items-center justify-center flex-shrink-0 text-xl">
          🍽️
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <h4 className="font-medium text-text-primary truncate text-label-sm">
            {item.name}
          </h4>
          {item.instructions ? (
            <p
              onClick={() => setShowNoteModal(true)}
              className="text-body-xs text-text-tertiary italic truncate cursor-pointer hover:text-text-secondary mt-0.5"
            >
              "{item.instructions}"
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setShowNoteModal(true)}
          className="text-label-xs text-brand-500 font-medium mt-1 flex items-center gap-1 w-fit focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 rounded px-1"
        >
          <MaterialIcon name="edit_note" className="text-body-sm" />
          {item.instructions ? "Edit note" : "Add note"}
        </button>
      </div>

      <div className="flex flex-col items-end justify-between py-0.5 flex-shrink-0">
        <span className="font-semibold text-brand-500 text-label-sm">
          {formatCurrency(item.price * item.quantity)}
        </span>

        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className={`w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center font-bold transition-colors hover:bg-surface-raised/80 focus:outline-none ${
              item.quantity === 1 ? "text-semantic_error-400" : "text-text-primary"
            }`}
            aria-label={item.quantity === 1 ? `Remove ${item.name}` : `Decrease ${item.name}`}
          >
            {item.quantity === 1 ? (
              <MaterialIcon name="delete" className="text-sm" />
            ) : (
              <MaterialIcon name="remove" className="text-sm" />
            )}
          </button>

          <span className="w-6 text-center font-bold text-text-primary text-label-sm">
            {item.quantity}
          </span>

          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-500 flex items-center justify-center font-bold transition-colors hover:bg-brand-500/30 focus:outline-none"
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
