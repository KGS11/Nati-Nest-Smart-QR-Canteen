"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export type NavItem = {
  href: string;
  label: string;
};

export function Sidebar({ title, items }: { title: string; items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-64 border-r border-zinc-800 bg-zinc-950/95 p-5 lg:block">
      <p className="text-sm font-semibold text-amber-400">{title}</p>
      <nav className="mt-8 space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "block rounded-lg px-3 py-2 text-sm transition-all duration-200",
              pathname === item.href
                ? "bg-amber-500 text-zinc-950"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
