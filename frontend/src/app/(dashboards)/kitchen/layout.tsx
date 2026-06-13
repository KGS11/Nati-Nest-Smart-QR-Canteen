import { AuthGuard } from "@/components/guards/AuthGuard";
import { Role } from "@/types";

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard allowedRoles={[Role.ADMIN, Role.KITCHEN]}>{children}</AuthGuard>;
}
