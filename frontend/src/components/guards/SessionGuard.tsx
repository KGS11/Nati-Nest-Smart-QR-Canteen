"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Loader from "@/components/common/Loader";
import { useSessionStore } from "@/stores/sessionStore";

interface SessionGuardProps {
  children: React.ReactNode;
}

export function SessionGuard({ children }: SessionGuardProps) {
  const { sessionToken, sessionId } = useSessionStore();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!sessionToken || !sessionId) {
      if (!pathname.startsWith("/scan")) {
        router.replace("/");
      }
    } else {
      setChecking(false);
    }
  }, [sessionToken, sessionId, pathname, router]);

  if (checking && !pathname.startsWith("/scan")) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-amber-50">
        <Loader label="Validating table session..." />
      </div>
    );
  }

  return <>{children}</>;
}
