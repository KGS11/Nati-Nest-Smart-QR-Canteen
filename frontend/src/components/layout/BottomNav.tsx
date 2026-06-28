"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, CreditCard, Utensils } from "lucide-react";
import { cn } from "@/utils/cn";

const items = [
  { href: "/customer/menu", label: "Menu", Icon: Utensils },
  { href: "/customer/track", label: "Orders", Icon: ClipboardList },
  { href: "/customer/bill", label: "Bill", Icon: CreditCard },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 grid grid-cols-3 border-t border-border-default bg-surface-base/95 backdrop-blur-md pb-safe">
      {items.map(({ href, label, Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-h-[64px] flex-col items-center justify-center gap-1 transition-all duration-200",
              isActive
                ? "text-brand-500 font-semibold"
                : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            <Icon className={cn("h-5 w-5", isActive && "fill-brand-500/10")} />
            <span className="text-label-sm">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
