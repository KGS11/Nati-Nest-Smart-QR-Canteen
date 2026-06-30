"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { apiClient } from "@/lib/api-client";
import { MaterialIcon } from "@/components/stitch/MaterialIcon";
import { useAuthStore } from "@/stores/authStore";
import { ApiResponse, ClientApiError } from "@/types/api";
import { Role, User } from "@/types";
import { loginSchema, LoginInput } from "@/validators/auth";

const roleRoutes = {
  [Role.ADMIN]: "/admin",
  [Role.SERVER]: "/server",
  [Role.KITCHEN]: "/kitchen",
};

const ROLES = [
  { role: Role.ADMIN, label: "Admin", icon: "admin_panel_settings" },
  { role: Role.SERVER, label: "Server", icon: "room_service" },
  { role: Role.KITCHEN, label: "Kitchen", icon: "soup_kitchen" },
];

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login, user } = useAuthStore();

  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>(Role.ADMIN);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "", password: "" },
  });

  const phoneValue = watch("phone");
  const passwordValue = watch("password");

  useEffect(() => {
    setApiError(null);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(roleRoutes[user.role]);
    }
  }, [isAuthenticated, router, user]);

  useEffect(() => {
    setApiError(null);
  }, [phoneValue, passwordValue, selectedRole]);

  const getLoginErrorMessage = (error: ClientApiError) => {
    const backendMessage = error.data?.message || error.message;

    switch (error.status) {
      case 400:
        return backendMessage || "Please check your login details.";
      case 401:
        return "Invalid phone number or password";
      case 403:
        return "You do not have permission.";
      case 429:
        return backendMessage || "Too many authentication attempts from this network. Try again later.";
      case 500:
        return "Server unavailable. Please try again later.";
      default:
        return "Unexpected error. Please try again.";
    }
  };

  const onSubmit = async (credentials: LoginInput) => {
    setApiError(null);
    try {
      const response = await apiClient.post<
        ApiResponse<{ token: string; refreshToken?: string; user: User }>
      >("/auth/login", { phone: credentials.phone, password: credentials.password });
      const { token, refreshToken, user: loggedInUser } = response.data.data;
      login(token, loggedInUser, refreshToken);
      setApiError(null);
      router.replace(roleRoutes[loggedInUser.role]);
    } catch (error) {
      const clientError = error as ClientApiError;
      setApiError(getLoginErrorMessage(clientError));
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center overflow-x-hidden bg-neutral-950 px-4 py-8 text-neutral-50 sm:px-6 lg:px-8">
      <section
        className="relative w-full max-w-[480px] overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/95 shadow-2xl shadow-black/40"
        aria-labelledby="staff-login-title"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-orange-500" />

        {isSubmitting && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-neutral-950/85 px-6 text-center backdrop-blur-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            <p className="text-sm font-semibold text-neutral-300">Signing you in...</p>
          </div>
        )}

        <div className="flex flex-col items-center gap-3 px-5 pb-6 pt-8 text-center sm:px-8 sm:pt-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/25">
            <MaterialIcon name="restaurant" className="text-[30px]" />
          </div>
          <div className="space-y-1">
            <h1 id="staff-login-title" className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Nati Nest
            </h1>
            <p className="text-sm font-medium text-neutral-400">Staff Login</p>
          </div>
        </div>

        <div className="px-5 pb-6 sm:px-8">
          <div aria-live="polite" className="mb-5">
            {apiError && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-500/35 bg-red-950/45 px-4 py-3.5 text-left shadow-sm">
                <MaterialIcon name="error" className="mt-0.5 shrink-0 text-[20px] text-red-300" />
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-5 text-red-100">Unable to sign in</p>
                  <p className="mt-1 break-words text-sm leading-5 text-red-100/80">{apiError}</p>
                </div>
              </div>
            )}
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            <fieldset className="space-y-3">
              <legend className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                Access Role
              </legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {ROLES.map(({ role, label, icon }) => {
                  const isActive = selectedRole === role;

                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={[
                        "flex h-16 w-full items-center justify-center gap-2 rounded-2xl border px-3 text-center text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 sm:h-[78px] sm:flex-col sm:gap-1.5",
                        isActive
                          ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                          : "border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800 hover:text-white",
                      ].join(" ")}
                      aria-pressed={isActive}
                    >
                      <MaterialIcon name={icon} className="text-[22px] leading-none" />
                      <span className="leading-none">{label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="space-y-2">
              <label
                htmlFor="phone"
                className="block text-xs font-bold uppercase tracking-widest text-neutral-400"
              >
                Phone Number
              </label>
              <div className="flex h-14 overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-950 transition focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/25">
                <span className="flex h-full items-center border-r border-neutral-800 px-4 text-sm font-bold text-neutral-400">
                  +91
                </span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  disabled={isSubmitting}
                  placeholder="9876543210"
                  className="h-full min-w-0 flex-1 bg-transparent px-4 text-base font-medium text-white placeholder:text-neutral-600 focus:outline-none disabled:opacity-60"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                  {...register("phone")}
                />
              </div>
              {errors.phone && (
                <p id="phone-error" className="text-sm font-medium text-red-300" role="alert">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-widest text-neutral-400"
              >
                Staff Password
              </label>
              <div className="flex h-14 items-center overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-950 transition focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/25">
                <span className="flex h-full items-center pl-4 text-neutral-500">
                  <MaterialIcon name="lock" className="text-[20px]" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  disabled={isSubmitting}
                  placeholder="Enter password"
                  className="h-full min-w-0 flex-1 bg-transparent px-3 pr-2 text-base font-medium text-white placeholder:text-neutral-600 focus:outline-none disabled:opacity-60"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="flex h-full w-14 shrink-0 items-center justify-center text-neutral-400 transition hover:bg-neutral-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <MaterialIcon
                    name={showPassword ? "visibility_off" : "visibility"}
                    className="text-[22px]"
                  />
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-sm font-medium text-red-300" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-orange-500 px-5 text-base font-extrabold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
            >
              Sign In
            </button>
          </form>
        </div>

        <div className="border-t border-neutral-800 px-5 py-5 text-center sm:px-8">
          <p className="text-xs leading-relaxed text-neutral-500">
            Scanning to order?{" "}
            <span className="font-semibold text-orange-400">Use your table QR code</span>{" "}
            instead.
          </p>
        </div>
      </section>

      <p className="sr-only">Secure staff access only</p>
    </main>
  );
}
