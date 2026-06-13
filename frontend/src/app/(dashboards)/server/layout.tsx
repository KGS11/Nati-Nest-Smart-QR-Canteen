import { AuthGuard } from "@/components/guards/AuthGuard";
import { Role } from "@/types";

export default function ServerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={[Role.ADMIN, Role.SERVER]}>
      {children}
    </AuthGuard>
  );
}
