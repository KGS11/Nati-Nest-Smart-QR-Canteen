"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, CreditCard, Utensils } from "lucide-react";
import clsx from "clsx";

const items = [
  { href: "/customer/menu", label: "Menu", Icon: Utensils },
  { href: "/customer/track", label: "Orders", Icon: ClipboardList },
  { href: "/customer/bill", label: "Bill", Icon: CreditCard },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 grid grid-cols-3 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur">
      {items.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className={clsx(
            "flex min-h-16 flex-col items-center justify-center gap-1 text-xs transition-all duration-200",
            pathname === href ? "text-amber-400" : "text-zinc-500 hover:text-zinc-200",
          )}
        >
          <Icon className="h-5 w-5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
