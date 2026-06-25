"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SessionGuard } from "@/components/guards/SessionGuard";
import { CustomerBottomNav } from "@/components/customer/CustomerBottomNav";
import { CartDrawer } from "@/components/customer/CartDrawer";
import { GlobalHelpModal } from "@/components/customer/GlobalHelpModal";
import { useCart } from "@/hooks/useCart";
import { useSocket } from "@/hooks/useSocket";
import { useSessionStore } from "@/stores/sessionStore";
import { customerService } from "@/services/customerService";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { socket } = useSocket();
  const { sessionId } = useSessionStore();

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const { isOpen: isCartOpen } = useCart();

  const [showBillBubble, setShowBillBubble] = useState(false);
  const [billBubbleDismissed, setBillBubbleDismissed] = useState(false);

  const checkActiveOrders = async () => {
    if (!sessionId) return;
    try {
      const response = await customerService.getOrders();
      const orders = response.orders || [];
      const activeOrders = orders.filter((o: any) => o.status !== "CANCELLED");
      
      const allDeliveredOrPaid = activeOrders.length > 0 && activeOrders.every(
        (o: any) => o.status === "DELIVERED" || o.status === "PAID"
      );
      
      setShowBillBubble(allDeliveredOrPaid);
    } catch (err: any) {
      setShowBillBubble(false);
      console.warn("Bill Bubble check skipped:", err?.message || err);
    }
  };

  useEffect(() => {
    setBillBubbleDismissed(false);
    setShowBillBubble(false);
  }, [sessionId]);

  useEffect(() => {
    if (pathname === "/customer/bill" || pathname === "/customer/feedback") {
      setBillBubbleDismissed(true);
      setShowBillBubble(false);
    } else {
      checkActiveOrders();
    }
  }, [pathname, sessionId]);

  useEffect(() => {
    if (!socket) return;

    const handleOrderDelivered = () => {
      checkActiveOrders();
    };

    socket.on("order:delivered", handleOrderDelivered);
    return () => {
      socket.off("order:delivered", handleOrderDelivered);
    };
  }, [socket, sessionId]);

  return (
    <SessionGuard>
      <div className="mx-auto min-h-screen max-w-md bg-zinc-950 font-body-md text-zinc-200 pb-24 relative">
        {children}
        
        <CustomerBottomNav onOpenHelp={() => setIsHelpOpen(true)} />
        
        {isCartOpen && <CartDrawer />}
        
        <GlobalHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

        {showBillBubble && !billBubbleDismissed && (
          <button
            onClick={() => {
              setBillBubbleDismissed(true);
              router.push("/customer/bill");
            }}
            className="fixed bottom-20 right-4 z-50 flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-2.5 rounded-full font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-sm border-0 cursor-pointer"
          >
            <span>🧾</span>
            <span>View Bill</span>
          </button>
        )}
      </div>
    </SessionGuard>
  );
}
