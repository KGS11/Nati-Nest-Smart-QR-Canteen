"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialIcon } from "@/components/stitch/MaterialIcon";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/utils/cn";

interface CustomerBottomNavProps {
  onOpenHelp: () => void;
}

export function CustomerBottomNav({ onOpenHelp }: CustomerBottomNavProps) {
  const pathname = usePathname();
  const { itemCount, setIsOpen: setCartOpen } = useCart();

  const navItems = [
    {
      label: "Menu",
      icon: "restaurant_menu",
      href: "/customer/menu",
      active: pathname === "/customer/menu",
    },
    {
      label: "Cart",
      icon: "shopping_cart",
      onClick: () => setCartOpen(true),
      badge: itemCount > 0 ? itemCount : undefined,
    },
    {
      label: "Track",
      icon: "receipt_long",
      href: "/customer/track",
      active: pathname === "/customer/track",
    },
    {
      label: "Bill",
      icon: "payments",
      href: "/customer/bill",
      active: pathname === "/customer/bill",
    },
    {
      label: "Help",
      icon: "support_agent",
      onClick: onOpenHelp,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface-raised/95 border-t border-border-primary backdrop-blur-md grid grid-cols-5 pb-safe z-45 max-w-md mx-auto rounded-t-2xl shadow-2xl">
      {navItems.map((item, index) => {
        const isButton = item.onClick !== undefined;
        const active = item.active;

        const content = (
          <div className="flex flex-col items-center justify-center relative w-full h-full">
            <div className="relative flex items-center justify-center">
              <MaterialIcon
                name={item.icon}
                className={cn(
                  "text-xl transition-all duration-200",
                  active ? "text-accent-400 scale-110 font-bold" : "text-text-tertiary group-hover:text-text-primary"
                )}
              />
              {item.badge !== undefined && (
                <span className="absolute -top-2 -right-3.5 bg-accent-500 text-surface-base font-extrabold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-border-primary shadow-md">
                  {item.badge}
                </span>
              )}
            </div>
            <span
              className={cn(
                "text-[10px] font-semibold mt-1 tracking-wide",
                active ? "text-accent-400 font-bold" : "text-text-tertiary"
              )}
            >
              {item.label}
            </span>
          </div>
        );

        if (isButton) {
          return (
            <button
              key={index}
              onClick={item.onClick}
              className="flex items-center justify-center focus:outline-none transition-colors w-full h-full group py-1 min-h-[48px]"
              type="button"
              aria-label={item.label}
            >
              {content}
            </button>
          );
        }

        return (
          <Link
            key={index}
            href={item.href!}
            className="flex items-center justify-center transition-colors w-full h-full group py-1 min-h-[48px]"
            aria-label={item.label}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
