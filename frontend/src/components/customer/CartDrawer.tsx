"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { CartItemRow } from "./CartItemRow";
import { Button } from "@/components/ui/Button";
import { customerService } from "@/services/customerService";
import { Toast } from "@/components/ui/Toast";
import { ClientApiError } from "@/types/api";

export function CartDrawer() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const {
    items,
    itemCount,
    subtotal,
    isOpen,
    setIsOpen,
    updateQuantity,
    updateInstructions,
    removeItem,
    clearCart,
  } = useCart();

  const [confirming, setConfirming] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [toast, setToast] = useState<{ title: string; tone: "success" | "error" | "info" } | null>(null);

  const showToast = (title: string, tone: "success" | "error" | "info") => {
    setToast({ title, tone });
    setTimeout(() => setToast(null), 3500);
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setPlacing(true);
    try {
      await customerService.placeOrder(items);
      clearCart();
      setIsOpen(false);
      showToast("Order placed successfully!", "success");
      setTimeout(() => {
        router.push("/customer/track");
      }, 500);
    } catch (err) {
      const clientError = err as ClientApiError;
      showToast(clientError.message || "Failed to place order.", "error");
    } finally {
      setPlacing(false);
      setConfirming(false);
    }
  };

  const handleClearCart = () => {
    if (confirm("Are you sure you want to clear all items from your cart?")) {
      clearCart();
    }
  };

  const drawerContent = (
    <div className="flex flex-col h-full justify-between">
      <div className="flex-1 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <EmptyState
            icon="Cart"
            title="Your cart is empty"
            description="Add items from the menu to start your order."
          />
        ) : (
          <div className="space-y-1">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onUpdateInstructions={updateInstructions}
                onRemove={removeItem}
              />
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="border-t border-border-default pt-4 mt-4 bg-surface-base sticky bottom-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-text-tertiary text-label-sm">Subtotal</span>
            <span className="text-display-sm font-bold text-text-primary">
              Rs {subtotal.toFixed(2)}
            </span>
          </div>
          <p className="text-body-xs text-text-tertiary mb-4">
            Taxes and charges included
          </p>

          {confirming ? (
            <div className="bg-surface-raised border border-border-default rounded-2xl p-4 mb-2 space-y-3">
              <p className="text-text-primary font-semibold text-label-sm">Confirm your order?</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 min-h-[48px]"
                  onClick={() => setConfirming(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="brand"
                  className="flex-1 min-h-[48px]"
                  onClick={handlePlaceOrder}
                  disabled={placing}
                >
                  {placing ? "Placing..." : "Confirm"}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="brand"
              className="w-full min-h-[56px] text-label-lg rounded-xl"
              onClick={() => setConfirming(true)}
            >
              Place Order - Rs {subtotal.toFixed(2)}
            </Button>
          )}

          <div className="flex flex-col gap-2 mt-3">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full h-11 border border-border-default hover:border-text-tertiary bg-surface-raised/50 text-text-secondary text-label-sm font-semibold rounded-xl active:scale-95 transition-all py-2 focus:outline-none"
            >
              Continue Shopping
            </button>
            <button
              onClick={handleClearCart}
              className="text-label-xs text-text-tertiary hover:text-semantic_error-400 transition-colors py-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 rounded px-2 mx-auto block mt-1"
            >
              Clear cart
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-80 animate-slide-in">
          <Toast title={toast.title} tone={toast.tone} />
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title="Your Order">
        <div className="pb-4">
          {drawerContent}
        </div>
      </BottomSheet>
    );
  }

  return (
    <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title="Your Order">
      {drawerContent}
    </Drawer>
  );
}
