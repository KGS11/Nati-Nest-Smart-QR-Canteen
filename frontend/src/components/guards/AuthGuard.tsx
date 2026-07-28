"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/common/Loader";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/authStore";
import { Role } from "@/types";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, isAuthenticated, token, login, logout } = useAuthStore();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(false);
  const allowedRoleKey = useMemo(() => allowedRoles.join(","), [allowedRoles]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    if (isAuthenticated && !token) {
      let isActive = true;

      setIsRestoringSession(true);
      apiClient
        .post("/auth/refresh", {})
        .then((response) => {
          if (!isActive) return;
          const { token: refreshedToken, refreshToken, user: refreshedUser } = response.data.data;
          setIsRestoringSession(false);
          login(refreshedToken, refreshedUser, refreshToken);
        })
        .catch(() => {
          if (!isActive) return;
          setIsRestoringSession(false);
          logout();
          router.replace("/login");
        });

      return () => {
        isActive = false;
      };
    }

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
  }, [hasMounted, isAuthenticated, token, user, allowedRoleKey, allowedRoles, router, login, logout]);

  if (!hasMounted || isRestoringSession || !isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-base text-text-primary">
        <Loader label="Verifying authorization..." />
      </div>
    );
  }

  return <>{children}</>;
}
