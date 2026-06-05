import { AuthGuard } from "@/components/guards/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { Role } from "@/types";

const navItems = [
  { href: "/admin", label: "Management" },
  { href: "/admin/live", label: "Live Analytics" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={[Role.ADMIN]}>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 lg:flex">
        <Sidebar title="Nati Nest Admin" items={navItems} />
        <div className="min-w-0 flex-1">
          <TopNavbar title="Admin Dashboard" subtitle="Management, reports, and live operations" />
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
