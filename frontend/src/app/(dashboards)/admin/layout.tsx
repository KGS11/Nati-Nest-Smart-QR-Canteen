'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AuthGuard } from '@/components/guards/AuthGuard'
import { useAuthStore } from '@/stores/authStore'
import { Role } from '@/types'

const navLinks = [
  { href: '/admin', label: 'Dashboard', icon: 'D' },
  { href: '/admin/menu/categories', label: 'Categories', icon: 'C' },
  { href: '/admin/menu/items', label: 'Menu Items', icon: 'M' },
  { href: '/admin/tables', label: 'Tables', icon: 'T' },
  { href: '/admin/staff', label: 'Staff', icon: 'S' },
  { href: '/admin/reports', label: 'Reports', icon: 'R' },
  { href: '/admin/catering', label: 'Catering', icon: 'L' },
  { href: '/admin/settings', label: 'Settings', icon: 'G' }
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  const isLinkActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin' || pathname === '/dashboards/admin'
    }
    return pathname === href || pathname === `/dashboards${href}` || pathname?.replace('/dashboards', '') === href
  }

  return (
    <AuthGuard allowedRoles={[Role.ADMIN]}>
      <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
        <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between h-full shrink-0">
          <div className="flex flex-col flex-1 overflow-y-auto">
            <div className="p-6 border-b border-zinc-800">
              <span className="text-xl font-bold text-amber-400 block tracking-tight">
                Nati Nest
              </span>
              <span className="text-xs text-zinc-500 block mt-1 font-semibold uppercase tracking-wider">
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all select-none border-r-2 ${
                      active
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border-transparent'
                    }`}
                  >
                    <span className="text-base leading-none">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-zinc-800 bg-zinc-950/20 flex flex-col gap-3 shrink-0">
            <div className="flex flex-col px-2">
              <span className="text-xs text-zinc-500 font-medium">Logged in as</span>
              <span className="text-sm text-zinc-350 font-bold truncate">
                {user?.name ?? 'Admin User'}
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 px-4 bg-transparent hover:bg-red-500/5 border border-zinc-800 hover:border-red-500/20 text-red-400 hover:text-red-300 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto bg-zinc-950 p-6">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
