"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { MaterialIcon } from "@/components/stitch/MaterialIcon";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/authStore";
import { ApiResponse, ClientApiError } from "@/types/api";
import { Role, User } from "@/types";
import { loginSchema, LoginInput } from "@/validators/auth";
import Loader from "@/components/ui/Loader";

const roleRoutes = {
  [Role.ADMIN]: "/admin",
  [Role.SERVER]: "/server",
  [Role.KITCHEN]: "/kitchen",
};

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login, user } = useAuthStore();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>(Role.ADMIN);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "", password: "" },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(roleRoutes[user.role]);
    }
  }, [isAuthenticated, router, user]);

  const onSubmit = async (credentials: LoginInput) => {
    setApiError(null);
    try {
      const response = await apiClient.post<
        ApiResponse<{ token: string; refreshToken?: string; user: User }>
      >("/auth/login", { ...credentials, role: selectedRole });
      const { token, refreshToken, user: loggedInUser } = response.data.data;
      login(token, loggedInUser, refreshToken);
      router.replace(roleRoutes[loggedInUser.role]);
    } catch (error) {
      const clientError = error as ClientApiError;
      setApiError(clientError.message || "Invalid credentials or server unavailable.");
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-8 font-sans">
      {/* Background radial glow effect */}
      <div className="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-amber-500/10 opacity-50 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[30%] w-[30%] rounded-full bg-amber-500/5 opacity-50 blur-[100px]" />

      <div className="z-10 w-full max-w-md">
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
          
          {/* Glassmorphic Submitting Overlay */}
          {isSubmitting && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-md transition-all duration-300">
              <Loader label="Signing you in..." />
            </div>
          )}

          {/* Logo & Header */}
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-2 flex items-center gap-2">
              <MaterialIcon name="restaurant" className="text-3xl text-amber-400" />
              <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">
                Nati Nest
              </h1>
            </div>
            <p className="text-sm font-medium text-zinc-400">Staff Login</p>
          </div>

          {/* Error Container - Screen Reader Polite */}
          <div aria-live="polite" className="min-h-[64px] empty:min-h-0">
            {apiError && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 transition-all duration-300">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <MaterialIcon name="error" className="text-lg" />
                  Access Denied
                </div>
                <p className="mt-1 text-xs leading-relaxed text-zinc-300">{apiError}</p>
              </div>
            )}
          </div>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            {/* Access Role Selector */}
            <div className="space-y-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Access Role
              </span>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-950 p-1.5 border border-zinc-850">
                {[Role.ADMIN, Role.SERVER, Role.KITCHEN].map((role) => {
                  const isActive = selectedRole === role;
                  let iconName = "admin_panel_settings";
                  if (role === Role.SERVER) iconName = "room_service";
                  if (role === Role.KITCHEN) iconName = "soup_kitchen";

                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`flex flex-col items-center justify-center rounded-lg py-2.5 transition-all gap-1.5 border-0 ${
                        isActive
                          ? "bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/15"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                      }`}
                    >
                      <MaterialIcon name={iconName} className="text-lg" />
                      <span className="text-[10px] font-semibold tracking-wider">
                        {role}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Phone Number Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400" htmlFor="phone">
                Phone Number
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500">
                  <span className="border-r border-zinc-800 pr-3 text-sm font-bold">+91</span>
                </div>
                <input
                  id="phone"
                  type="tel"
                  disabled={isSubmitting}
                  placeholder="9876543210"
                  className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 pl-16 pr-4 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 disabled:opacity-60"
                  {...register("phone")}
                />
              </div>
              {errors.phone && (
                <p className="text-xs font-medium text-red-400 mt-1" role="alert">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400" htmlFor="password">
                Staff Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500">
                  <MaterialIcon name="lock" className="text-lg" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 pl-11 pr-12 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 disabled:opacity-60"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500 transition-colors hover:text-zinc-300 border-0 bg-transparent min-w-[44px] justify-end"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <MaterialIcon name={showPassword ? "visibility_off" : "visibility"} className="text-lg" />
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-medium text-red-400 mt-1" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 font-bold text-zinc-950 shadow-md shadow-amber-500/10 transition-all hover:bg-amber-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 border-0 text-sm"
            >
              <MaterialIcon name="login" className="text-lg" />
              Sign In
            </button>
          </form>

          {/* Help note */}
          <div className="mt-8 w-full border-t border-zinc-800/80 pt-6 text-center">
            <p className="text-xs text-zinc-500 leading-relaxed">
              Scanning to order? <br /> Use your{" "}
              <span className="font-semibold text-amber-400">table QR code</span> instead.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-zinc-600">
          <MaterialIcon name="verified_user" className="text-sm" />
          <span className="text-[11px] font-bold uppercase tracking-wider">Secure Staff Access Only</span>
        </div>
      </div>
    </main>
  );
}
