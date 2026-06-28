'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Toast } from '@/components/common/Toast'
import { AuthGuard } from '@/components/guards/AuthGuard'
import { useSocket } from '@/hooks/useSocket'
import { useAuthStore } from '@/stores/authStore'
import { Role } from '@/types'

const navLinks = [
  { href: '/admin', label: 'Dashboard', icon: 'D' },
  { href: '/admin/menu/categories', label: 'Categories', icon: 'C' },
  { href: '/admin/menu/items', label: 'Menu Items', icon: 'M' },
  { href: '/admin/daily-menu', label: "Today's Menu", icon: '📅' },
  { href: '/admin/tables', label: 'Tables', icon: 'T' },
  { href: '/admin/staff', label: 'Staff', icon: 'S' },
  { href: '/admin/reports', label: 'Reports', icon: 'R' },
  { href: '/admin/catering', label: 'Catering', icon: 'L' },
  { href: '/admin/settings', label: 'Settings', icon: 'G' }
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { socket } = useSocket()
  const [cateringToast, setCateringToast] = useState<{ name: string } | null>(null)

  useEffect(() => {
    if (!socket) return

    const handleNewLead = (payload: { name?: string }) => {
      setCateringToast({ name: payload.name ?? 'a guest' })
      window.setTimeout(() => setCateringToast(null), 6000)
    }

    socket.on('catering:new', handleNewLead)
    return () => {
      socket.off('catering:new', handleNewLead)
    }
  }, [socket])

  const isLinkActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin' || pathname === '/dashboards/admin'
    }
    return pathname === href || pathname === `/dashboards${href}` || pathname?.replace('/dashboards', '') === href
  }

  return (
    <AuthGuard allowedRoles={[Role.ADMIN]}>
      <div className="flex h-screen w-screen overflow-hidden bg-surface-base text-text-primary">
        {cateringToast ? (
          <div className="fixed right-4 top-4 z-[90] w-[min(360px,calc(100vw-2rem))]">
            <Toast
              title={`New catering enquiry from ${cateringToast.name}`}
              message="Open Catering to follow up."
              tone="warning"
            />
          </div>
        ) : null}
        <aside className="w-64 bg-surface-raised border-r border-border-default flex flex-col justify-between h-full shrink-0">
          <div className="flex flex-col flex-1 overflow-y-auto">
            <div className="p-6 border-b border-border-default">
              <span className="text-display-sm font-bold text-brand-500 block tracking-tight">
                Nati Nest
              </span>
              <span className="text-label-xs text-text-tertiary block mt-1 font-semibold uppercase tracking-wider">
                Admin Panel
              </span>
            </div>

            <nav className="p-4 space-y-1">
              {navLinks.map((link) => {
                const active = isLinkActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-label-sm font-semibold transition-all select-none border-r-2 ${
                      active
                        ? 'bg-brand-500/10 text-brand-500 border-brand-500'
                        : 'text-text-tertiary hover:text-text-primary hover:bg-surface-overlay border-transparent'
                    }`}
                  >
                    <span className="text-body-md leading-none">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-border-default bg-surface-base/20 flex flex-col gap-3 shrink-0">
            <div className="flex flex-col px-2">
              <span className="text-label-xs text-text-tertiary font-medium">Logged in as</span>
              <span className="text-label-sm text-text-secondary font-bold truncate">
                {user?.name ?? 'Admin User'}
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 px-4 bg-transparent hover:bg-semantic_error-500/5 border border-border-default hover:border-semantic_error-500/20 text-semantic_error-400 hover:text-semantic_error-300 rounded-xl text-label-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto bg-surface-base p-6">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
