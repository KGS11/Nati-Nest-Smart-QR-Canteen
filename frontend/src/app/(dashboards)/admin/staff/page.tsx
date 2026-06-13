"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import PageHeader from "@/components/admin/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Loader from "@/components/ui/Loader";
import { Toast } from "@/components/ui/Toast";
import apiClient from "@/lib/api-client";
import { ApiResponse, ClientApiError } from "@/types/api";
import { StaffFormValues, StaffListResponse, StaffMember, StaffRole } from "@/types/staff.types";

const roles: StaffRole[] = ["ADMIN", "KITCHEN", "SERVER"];

const schema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    phone: z.string().trim().min(6, "Phone is too short").max(20),
    password: z.string().optional(),
    role: z.enum(["ADMIN", "KITCHEN", "SERVER"]),
    isActive: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.password !== undefined && value.password !== "" && value.password.length < 6) {
      context.addIssue({
        code: "custom",
        path: ["password"],
        message: "Password must be at least 6 characters",
      });
    }
  });

type ModalState =
  | { type: "create" }
  | { type: "edit"; staff: StaffMember }
  | null;

type ToastState = {
  title: string;
  tone: "success" | "error" | "info";
};

function RoleBadge({ role }: { role: StaffRole }) {
  return (
    <span
      className={clsx(
        "rounded-full border px-2.5 py-1 text-xs font-bold",
        role === "ADMIN" && "border-red-500/20 bg-red-500/10 text-red-300",
        role === "KITCHEN" && "border-blue-500/20 bg-blue-500/10 text-blue-300",
        role === "SERVER" && "border-green-500/20 bg-green-500/10 text-green-300",
      )}
    >
      {role}
    </span>
  );
}

function StaffForm({
  staff,
  onCancel,
  onSuccess,
}: {
  staff?: StaffMember;
  onCancel: () => void;
  onSuccess: (staff: StaffMember) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: staff?.name ?? "",
      phone: staff?.phone ?? "",
      password: "",
      role: staff?.role ?? "SERVER",
      isActive: staff?.isActive ?? true,
    },
  });

  const onSubmit = async (values: StaffFormValues) => {
    setServerError(null);

    if (!staff && !values.password) {
      setServerError("Password is required for new staff");
      return;
    }

    try {
      const payload = {
        name: values.name,
        phone: values.phone,
        role: values.role,
        isActive: values.isActive,
        ...(values.password ? { password: values.password } : {}),
      };
      const response = staff
        ? await apiClient.put<ApiResponse<{ staff: StaffMember }>>(`/staff/${staff.id}`, payload)
        : await apiClient.post<ApiResponse<{ staff: StaffMember }>>("/staff", {
            ...payload,
            password: values.password,
          });

      onSuccess(response.data.data.staff);
    } catch (error) {
      const clientError = error as ClientApiError;
      setServerError(
        clientError.status === 409
          ? "Phone number already exists"
          : clientError.message || "Unable to save staff member",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Name" error={errors.name?.message} {...register("name")} />
      <Input label="Phone" error={errors.phone?.message} {...register("phone")} />
      <Input
        label={staff ? "New Password" : "Password"}
        type="password"
        error={errors.password?.message}
        {...register("password", { required: !staff })}
      />

      <label className="block space-y-2 text-left">
        <span className="text-sm font-medium text-zinc-200">Role</span>
        <select
          {...register("role")}
          className="h-11 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-3 text-sm font-semibold text-zinc-200">
        <input type="checkbox" className="h-4 w-4 accent-amber-500" {...register("isActive")} />
        Active account
      </label>

      {serverError ? <p className="text-sm font-semibold text-red-400">{serverError}</p> : null}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : staff ? "Save" : "Create"}
        </Button>
      </div>
    </form>
  );
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<StaffRole | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (nextToast: ToastState) => {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 3500);
  };

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<ApiResponse<StaffListResponse>>("/staff", {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: search || undefined,
          role: role || undefined,
        },
      });
      setStaff(response.data.data.items);
      setPagination(response.data.data.pagination);
    } catch (fetchError) {
      const clientError = fetchError as ClientApiError;
      setError(clientError.message || "Unable to load staff.");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.limit, pagination.page, role, search]);

  useEffect(() => {
    void fetchStaff();
  }, [fetchStaff]);

  const handleSaved = (savedStaff: StaffMember) => {
    setModal(null);
    showToast({ title: `Staff ${savedStaff.name} saved`, tone: "success" });
    void fetchStaff();
  };

  const updateStatus = async (member: StaffMember) => {
    const previousStaff = staff;
    const isActive = !member.isActive;
    setStaff((current) =>
      current.map((item) => (item.id === member.id ? { ...item, isActive } : item)),
    );

    try {
      await apiClient.patch<ApiResponse<{ staff: StaffMember }>>(`/staff/${member.id}/status`, {
        isActive,
      });
      showToast({
        title: `${member.name} ${isActive ? "activated" : "deactivated"}`,
        tone: "success",
      });
    } catch (statusError) {
      const clientError = statusError as ClientApiError;
      setStaff(previousStaff);
      showToast({ title: clientError.message || "Unable to update status", tone: "error" });
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-zinc-950 p-6">
      {toast ? (
        <div className="fixed right-6 top-6 z-50 w-full max-w-sm">
          <Toast title={toast.title} tone={toast.tone} />
        </div>
      ) : null}

      <PageHeader
        title="Staff Management"
        subtitle={`${pagination.total} staff members`}
        action={{ label: "Add Staff", onClick: () => setModal({ type: "create" }) }}
      />

      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_180px]">
        <Input
          value={search}
          onChange={(event) => {
            setPagination((current) => ({ ...current, page: 1 }));
            setSearch(event.target.value);
          }}
          placeholder="Search name or phone..."
          aria-label="Search staff"
        />
        <select
          value={role}
          onChange={(event) => {
            setPagination((current) => ({ ...current, page: 1 }));
            setRole(event.target.value as StaffRole | "");
          }}
          className="h-11 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
        >
          <option value="">All Roles</option>
          {roles.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-10 w-full bg-zinc-900 border border-zinc-850 rounded-xl animate-pulse" />
          <div className="h-14 w-full bg-zinc-905 bg-zinc-900 border border-zinc-850 rounded-xl animate-pulse" />
          <div className="h-14 w-full bg-zinc-905 bg-zinc-900 border border-zinc-850 rounded-xl animate-pulse" />
          <div className="h-14 w-full bg-zinc-905 bg-zinc-900 border border-zinc-850 rounded-xl animate-pulse" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <p className="text-sm font-semibold text-red-300">{error}</p>
          <Button type="button" className="mt-4" onClick={() => void fetchStaff()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="grid grid-cols-[1.3fr_1fr_120px_120px_160px] gap-4 border-b border-zinc-800 px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-500">
            <span>Name</span>
            <span>Phone</span>
            <span>Role</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          {staff.length ? (
            staff.map((member) => (
              <div
                key={member.id}
                className="grid grid-cols-[1.3fr_1fr_120px_120px_160px] items-center gap-4 border-b border-zinc-800 px-4 py-4 last:border-b-0"
              >
                <span className="font-semibold text-zinc-100">{member.name}</span>
                <span className="text-sm text-zinc-400">{member.phone}</span>
                <RoleBadge role={member.role} />
                <span
                  className={clsx(
                    "w-fit rounded-full px-2.5 py-1 text-xs font-bold",
                    member.isActive
                      ? "bg-green-500/10 text-green-300"
                      : "bg-zinc-700 text-zinc-300",
                  )}
                >
                  {member.isActive ? "Active" : "Inactive"}
                </span>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-9 px-3 py-1 text-xs"
                    onClick={() => setModal({ type: "edit", staff: member })}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant={member.isActive ? "danger" : "secondary"}
                    className="min-h-9 px-3 py-1 text-xs"
                    onClick={() => void updateStatus(member)}
                  >
                    {member.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-12 text-center text-sm text-zinc-500">No staff found.</div>
          )}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-zinc-800 pt-4 text-sm text-zinc-400">
        <span>
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={pagination.page <= 1}
            onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}
          >
            Next
          </Button>
        </div>
      </div>

      {modal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <h2 className="mb-5 text-xl font-bold text-zinc-100">
              {modal.type === "create" ? "Add Staff" : `Edit ${modal.staff.name}`}
            </h2>
            <StaffForm
              staff={modal.type === "edit" ? modal.staff : undefined}
              onCancel={() => setModal(null)}
              onSuccess={handleSaved}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
