"use client";

import { useState } from "react";
import { DailyMenuRemovalReason } from "@/types/daily-menu.types";

interface RemoveItemModalProps {
  itemName: string;
  onConfirm: (reason: string, reasonType: DailyMenuRemovalReason) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function RemoveItemModal({
  itemName,
  onConfirm,
  onCancel,
  isSubmitting,
}: RemoveItemModalProps) {
  const [reasonType, setReasonType] = useState<DailyMenuRemovalReason>(
    DailyMenuRemovalReason.OUT_OF_STOCK
  );
  const [reasonText, setReasonText] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);

    const trimmedReason = reasonText.trim();
    if (!trimmedReason) {
      setErrorText("Please provide a detailed description of the reason.");
      return;
    }

    try {
      await onConfirm(trimmedReason, reasonType);
    } catch (err) {
      // Store handles error state
    }
  };

  const reasonOptions = [
    {
      type: DailyMenuRemovalReason.OUT_OF_STOCK,
      label: "Out of Stock",
      icon: "📦",
      desc: "Item inventory is completely depleted",
    },
    {
      type: DailyMenuRemovalReason.INGREDIENT_FINISHED,
      label: "Ingredient Finished",
      icon: "🥕",
      desc: "Key ingredients are unavailable",
    },
    {
      type: DailyMenuRemovalReason.MACHINE_PROBLEM,
      label: "Equipment Issue",
      icon: "⚙️",
      desc: "Kitchen machinery failure",
    },
    {
      type: DailyMenuRemovalReason.KITCHEN_CLOSED,
      label: "Kitchen Closed",
      icon: "🚪",
      desc: "Section/kitchen is offline",
    },
    {
      type: DailyMenuRemovalReason.OTHER,
      label: "Other Reason",
      icon: "📝",
      desc: "Other administrative reason",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-start justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-surface-raised border border-border-primary rounded-3xl max-w-lg w-full mx-auto mt-20 p-6 shadow-2xl relative animate-in zoom-in duration-200">
        
        {/* Title */}
        <h3 className="text-xl font-extrabold text-text-primary flex items-center gap-2 mb-1">
          <span>⚠️</span> Deactivate Item
        </h3>
        <p className="text-xs text-text-secondary mb-6">
          Removing <span className="text-accent-400 font-bold">{itemName}</span> from today's active menu. Please document the audit reason.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reason Type Grid */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Select Deactivation Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {reasonOptions.map((opt) => {
                const isSelected = reasonType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setReasonType(opt.type)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer select-none group min-h-[64px] ${
                      isSelected
                        ? "bg-red-500/10 border-red-500/40 text-text-primary"
                        : "bg-surface-base/40 border-border-primary text-text-secondary hover:border-border-secondary"
                    }`}
                  >
                    <span className="text-2xl pt-0.5 shrink-0">{opt.icon}</span>
                    <div>
                      <div className={`text-sm font-bold transition-colors ${isSelected ? "text-red-400" : "text-text-secondary group-hover:text-text-primary"}`}>
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-text-muted leading-snug mt-0.5">
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed text reason */}
          <div className="space-y-2.5">
            <label htmlFor="reasonText" className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Detailed Audit Notes
            </label>
            <textarea
              id="reasonText"
              rows={3}
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="e.g. Tomato purée finished, waiting for evening delivery..."
              className="w-full bg-surface-base/80 border border-border-primary rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-red-500/50 resize-none font-medium"
            />
            {errorText && (
              <p className="text-xs font-semibold text-red-400 animate-pulse">{errorText}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onCancel}
              className="flex-1 py-3 border border-border-primary text-text-secondary hover:text-text-primary hover:bg-surface-overlay rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-transparent cursor-pointer min-h-[48px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-text-primary rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 border-0 cursor-pointer min-h-[48px]"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-1.5 animate-pulse">
                  <span>Deactivating...</span>
                </span>
              ) : (
                "Deactivate Item"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
