"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/authStore";
import { ApiResponse, ClientApiError } from "@/types/api";
import { Role, User } from "@/types";
import { loginSchema, LoginInput } from "@/validators/auth";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login, user } = useAuthStore();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (user.role === Role.ADMIN) router.replace("/admin");
    else if (user.role === Role.KITCHEN) router.replace("/kitchen");
    else if (user.role === Role.SERVER) router.replace("/server");
  }, [isAuthenticated, router, user]);

  const onSubmit = async (credentials: LoginInput) => {
    setApiError(null);

    try {
      const response = await apiClient.post<ApiResponse<{ token: string; user: User }>>(
        "/auth/login",
        credentials,
      );
      const { token, user: loggedInUser } = response.data.data;

      login(token, loggedInUser);

      if (loggedInUser.role === Role.ADMIN) router.replace("/admin");
      else if (loggedInUser.role === Role.KITCHEN) router.replace("/kitchen");
      else if (loggedInUser.role === Role.SERVER) router.replace("/server");
      else setApiError("Unauthorized role profile detected.");
    } catch (error) {
      const clientError = error as ClientApiError;
      setApiError(clientError.message || "Invalid credentials or server unavailable.");
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-12 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.14),transparent_34rem)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

      <Card className="relative w-full max-w-md border-amber-500/25 p-7 shadow-2xl shadow-black/40 sm:p-8">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Nati Nest Canteen
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-50">
            Staff Portal Access
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Sign in with your registered phone number to manage canteen workflows.
          </p>
        </div>

        {apiError ? (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-300"
          >
            <div className="flex items-center gap-2 font-medium text-red-200">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              Login failed
            </div>
            <p className="mt-1 text-xs leading-5 text-red-300/90">{apiError}</p>
          </div>
        ) : null}

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Phone Number"
            type="tel"
            autoComplete="tel"
            placeholder="Enter phone number"
            disabled={isSubmitting}
            error={errors.phone?.message}
            {...register("phone")}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter password"
              disabled={isSubmitting}
              error={errors.password?.message}
              className="pr-12"
              {...register("password")}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              disabled={isSubmitting}
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-2 top-8 flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 transition-colors hover:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-h-11 w-full text-base font-semibold shadow-lg shadow-amber-500/20"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </Card>
    </main>
  );
}
