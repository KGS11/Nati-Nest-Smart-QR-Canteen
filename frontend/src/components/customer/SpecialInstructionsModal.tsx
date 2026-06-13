"use client";

import { useState } from "react";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";

interface SpecialInstructionsModalProps {
  itemName: string;
  currentInstructions: string;
  onSave: (instructions: string) => void;
  onClose: () => void;
}

export function SpecialInstructionsModal({
  itemName,
  currentInstructions,
  onSave,
  onClose,
}: SpecialInstructionsModalProps) {
  const isMobile = useIsMobile();
  const [text, setText] = useState(currentInstructions);

  const handleSave = () => {
    onSave(text);
    onClose();
  };

  const content = (
    <div className="flex flex-col">
      <h3 className="text-lg font-bold text-zinc-100 mb-2">
        Add note for {itemName}
      </h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 200))}
        placeholder="e.g. no sugar, extra spicy, no onion..."
        rows={3}
        maxLength={200}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
      />
      <div className="text-right text-xs text-zinc-500 mt-1.5">
        {text.length}/200
      </div>

      <div className="flex gap-3 mt-6">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          className="flex-1 bg-amber-500 text-zinc-950 hover:bg-amber-400"
          onClick={handleSave}
        >
          Save
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet isOpen={true} onClose={onClose}>
        {content}
      </BottomSheet>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        {content}
      </div>
    </div>
  );
}
