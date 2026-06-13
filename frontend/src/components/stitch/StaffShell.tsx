"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { MaterialIcon } from "./MaterialIcon";
import { useAuthStore } from "@/stores/authStore";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface StaffShellProps {
  title: string;
  subtitle?: string;
  navItems: NavItem[];
  children: React.ReactNode;
  dark?: boolean;
}

export function StaffShell({ title, subtitle, navItems, children, dark = false }: StaffShellProps) {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();

  return (
    <div
      className={clsx(
        "flex min-h-screen overflow-hidden font-body-md",
        dark ? "bg-inverse-surface text-inverse-on-surface" : "bg-surface text-on-background",
      )}
    >
      <aside
        className={clsx(
          "hidden h-screen w-64 shrink-0 flex-col border-r px-md py-lg md:flex",
          dark
            ? "border-outline-variant/20 bg-inverse-surface"
            : "border-outline-variant bg-surface-container-lowest",
        )}
      >
        <div className="mb-xl px-sm">
          <h1 className={clsx("font-headline-md text-headline-md font-black", dark ? "text-primary-fixed" : "text-primary")}>
            {title}
          </h1>
          {subtitle ? (
            <p className={clsx("mt-xs font-label-sm text-label-sm", dark ? "text-primary-fixed-dim/80" : "text-on-surface-variant")}>
              {subtitle}
            </p>
          ) : null}
        </div>
        <nav className="flex-1 space-y-xs overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={clsx(
                  "flex items-center gap-md rounded-lg px-md py-sm font-label-md text-label-md transition-colors",
                  active
                    ? "bg-primary-container text-on-primary-container ring-2 ring-primary-container"
                    : dark
                      ? "text-primary-fixed-dim hover:bg-on-surface-variant/10"
                      : "text-secondary hover:bg-surface-container-low",
                )}
              >
                <MaterialIcon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className={clsx("border-t pt-md", dark ? "border-outline-variant/20" : "border-outline-variant")}>
          <div className="flex items-center gap-md px-sm py-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-primary">
              <MaterialIcon name="account_circle" />
            </div>
            <div className="min-w-0">
              <span className={clsx("block truncate font-label-md text-label-md", dark ? "text-primary-fixed" : "text-on-surface")}>
                {user?.name ?? "Staff Profile"}
              </span>
              <span className={clsx("font-label-sm text-label-sm", dark ? "text-primary-fixed-dim/70" : "text-on-surface-variant")}>
                {user?.role ?? "Staff"}
              </span>
            </div>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={clsx(
            "sticky top-0 z-40 flex h-touch-min shrink-0 items-center justify-between px-margin-mobile shadow-sm md:px-margin-desktop",
            dark ? "bg-inverse-surface text-primary-fixed-dim" : "bg-surface text-primary",
          )}
        >
          <div className="flex min-w-0 items-center gap-md">
            <MaterialIcon name="menu" className="md:hidden" />
            <div className="min-w-0">
              <h2 className="truncate font-headline-md text-headline-md">{subtitle ?? title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-container-high"
            aria-label="Logout"
          >
            <MaterialIcon name="logout" />
          </button>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        <nav
          className={clsx(
            "fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-around border-t px-2 md:hidden",
            dark ? "border-outline-variant/20 bg-inverse-surface" : "border-outline-variant bg-surface-container",
          )}
        >
          {navItems.slice(0, 4).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={clsx(
                  "flex flex-col items-center justify-center rounded-full px-4 py-1 font-label-sm text-label-sm",
                  active ? "bg-primary-container text-on-primary-container" : "text-secondary",
                )}
              >
                <MaterialIcon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
