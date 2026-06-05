"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/common/Loader";
import { useAuthStore } from "@/stores/authStore";
import { Role } from "@/types";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, isAuthenticated, token } = useAuthStore();
  const router = useRouter();
  const allowedRoleKey = useMemo(() => allowedRoles.join(","), [allowedRoles]);

  useEffect(() => {
    if (!token || !isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user && !allowedRoles.includes(user.role)) {
      if (user.role === Role.ADMIN) router.replace("/admin");
      else if (user.role === Role.KITCHEN) router.replace("/kitchen");
      else if (user.role === Role.SERVER) router.replace("/server");
      else router.replace("/login");
    }
  }, [isAuthenticated, token, user, allowedRoleKey, allowedRoles, router]);

  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-amber-50">
        <Loader label="Verifying authorization..." />
      </div>
    );
  }

  return <>{children}</>;
}
