"use client";

import { useState } from "react";
import { SessionGuard } from "@/components/guards/SessionGuard";
import { CustomerBottomNav } from "@/components/customer/CustomerBottomNav";
import { CartDrawer } from "@/components/customer/CartDrawer";
import { GlobalHelpModal } from "@/components/customer/GlobalHelpModal";
import { useCart } from "@/hooks/useCart";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const { isOpen: isCartOpen } = useCart();

  return (
    <SessionGuard>
      <div className="mx-auto min-h-screen max-w-md bg-zinc-950 font-body-md text-zinc-200 pb-24 relative">
        {children}
        
        <CustomerBottomNav onOpenHelp={() => setIsHelpOpen(true)} />
        
        {isCartOpen && <CartDrawer />}
        
        <GlobalHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </div>
    </SessionGuard>
  );
}
