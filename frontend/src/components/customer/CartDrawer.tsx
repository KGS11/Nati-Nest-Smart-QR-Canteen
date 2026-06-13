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
        <div className="border-t border-zinc-800 pt-4 mt-4 bg-zinc-900 sticky bottom-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-zinc-400 text-sm">Subtotal</span>
            <span className="text-xl font-bold text-zinc-100">
              Rs {subtotal.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Taxes and charges included
          </p>

          {confirming ? (
            <div className="bg-zinc-800 border border-zinc-750 rounded-2xl p-4 mb-2 space-y-3">
              <p className="text-zinc-100 font-semibold text-sm">Confirm your order?</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 min-h-[48px] text-zinc-100"
                  onClick={() => setConfirming(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="flex-1 min-h-[48px] bg-amber-500 text-zinc-950 hover:bg-amber-400"
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
              variant="primary"
              className="w-full h-14 bg-amber-500 text-zinc-950 hover:bg-amber-400 font-semibold text-lg rounded-xl active:scale-95 transition-transform"
              onClick={() => setConfirming(true)}
            >
              Place Order - Rs {subtotal.toFixed(2)}
            </Button>
          )}

          <div className="flex justify-center mt-3">
            <button
              onClick={handleClearCart}
              className="text-xs text-zinc-500 hover:text-red-400 transition-colors py-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 rounded px-2"
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
