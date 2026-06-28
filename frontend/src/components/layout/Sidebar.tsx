"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import { MaterialIcon } from "@/components/stitch/MaterialIcon";

export type NavItem = {
  href: string;
  label: string;
  icon?: string;
};

export function Sidebar({ title, items }: { title: string; items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-64 border-r border-border-default bg-surface-base p-5 lg:flex flex-col">
      <div className="flex items-center gap-2 mb-8">
        <MaterialIcon name="restaurant" className="text-brand-500" />
        <p className="text-label-md font-bold text-text-primary tracking-tight">{title}</p>
      </div>
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-label-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-brand-500/10 text-brand-600"
                  : "text-text-secondary hover:bg-surface-raised hover:text-text-primary"
              )}
            >
              {item.icon && (
                <MaterialIcon
                  name={item.icon}
                  className={cn("text-[20px]", isActive ? "text-brand-500" : "text-text-tertiary")}
                />
              )}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
