"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import PageHeader from "@/components/admin/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
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
  let variant: "destructive" | "brand" | "success" = "brand";
  if (role === "ADMIN") variant = "destructive";
  if (role === "SERVER") variant = "success";

  return (
    <Badge variant={variant} className="w-fit text-label-xs px-2.5 py-0.5">
      {role}
    </Badge>
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
        <span className="text-label-sm text-text-primary">Role</span>
        <select
          {...register("role")}
          className="h-11 w-full rounded-lg border border-border-default bg-surface-raised px-3 text-body-sm text-text-primary outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-3 text-label-sm text-text-primary">
        <input type="checkbox" className="h-4 w-4 rounded border-border-default bg-surface-raised accent-brand-500" {...register("isActive")} />
        Active account
      </label>

      {serverError ? <p className="text-body-sm font-semibold text-semantic_error-400">{serverError}</p> : null}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" className="flex-1 min-h-[44px]" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="brand" className="flex-1 min-h-[44px]" disabled={isSubmitting}>
          {isSubmitting ? <Loader /> : staff ? "Save" : "Create"}
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
    <div className="flex flex-col space-y-6">
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
          className="h-[44px] rounded-lg border border-border-default bg-surface-base px-3 text-body-sm text-text-primary outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
          <div className="h-10 w-full bg-surface-raised border border-border-default rounded-xl animate-pulse" />
          <div className="h-14 w-full bg-surface-raised border border-border-default rounded-xl animate-pulse" />
          <div className="h-14 w-full bg-surface-raised border border-border-default rounded-xl animate-pulse" />
          <div className="h-14 w-full bg-surface-raised border border-border-default rounded-xl animate-pulse" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-semantic_error-500/20 bg-semantic_error-500/5 p-6">
          <p className="text-body-sm font-semibold text-semantic_error-300">{error}</p>
          <Button type="button" className="mt-4" onClick={() => void fetchStaff()}>
            Retry
          </Button>
        </div>
      ) : (
        <Card className="overflow-hidden border-border-default">
          <div className="grid grid-cols-[1.3fr_1fr_120px_120px_160px] gap-4 border-b border-border-default bg-surface-raised px-6 py-4 text-label-xs uppercase text-text-tertiary">
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
                className="grid grid-cols-[1.3fr_1fr_120px_120px_160px] items-center gap-4 border-b border-border-default px-6 py-4 last:border-b-0 transition-colors hover:bg-surface-raised/50"
              >
                <span className="text-body-sm font-semibold text-text-primary">{member.name}</span>
                <span className="text-body-sm text-text-tertiary">{member.phone}</span>
                <RoleBadge role={member.role} />
                <Badge variant={member.isActive ? "success" : "secondary"} className="w-fit text-label-xs px-2.5 py-0.5">
                  {member.isActive ? "Active" : "Inactive"}
                </Badge>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-9 px-4 text-label-sm"
                    onClick={() => setModal({ type: "edit", staff: member })}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant={member.isActive ? "destructive" : "secondary"}
                    className="min-h-9 px-4 text-label-sm"
                    onClick={() => void updateStatus(member)}
                  >
                    {member.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-16 text-center text-body-md text-text-tertiary font-medium">No staff found.</div>
          )}
        </Card>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-border-default pt-6 text-label-sm text-text-tertiary">
        <span>
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pagination.page <= 1}
            className="min-h-[40px] px-4"
            onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pagination.page >= pagination.totalPages}
            className="min-h-[40px] px-4"
            onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}
          >
            Next
          </Button>
        </div>
      </div>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 shadow-2xl border-border-default relative overflow-hidden">
            <h2 className="mb-6 text-display-sm font-bold text-text-primary tracking-tight">
              {modal.type === "create" ? "Add Staff Member" : `Edit ${modal.staff.name}`}
            </h2>
            <StaffForm
              staff={modal.type === "edit" ? modal.staff : undefined}
              onCancel={() => setModal(null)}
              onSuccess={handleSaved}
            />
          </Card>
        </div>
      ) : null}
    </div>
  );
}
