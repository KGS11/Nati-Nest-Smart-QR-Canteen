import { AuthGuard } from "@/components/guards/AuthGuard";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { Role } from "@/types";

export default function ServerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={[Role.ADMIN, Role.SERVER]}>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <TopNavbar title="Server Workspace" subtitle="Tables, payments, and requests foundation" />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
