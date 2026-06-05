import { AuthGuard } from "@/components/guards/AuthGuard";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { Role } from "@/types";

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={[Role.ADMIN, Role.KITCHEN]}>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <TopNavbar title="Kitchen Workspace" subtitle="Realtime order processing foundation" />
        <main className="grid gap-4 p-4 lg:grid-cols-[1fr_22rem] lg:p-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
