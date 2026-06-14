"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import PageHeader from "@/components/admin/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Loader from "@/components/ui/Loader";
import { Toast } from "@/components/ui/Toast";
import apiClient from "@/lib/api-client";
import { ApiResponse, ClientApiError } from "@/types/api";

interface AdminSettings {
  businessName: string;
  businessPhone: string;
  businessAddress: string;
  taxRate: number;
  notificationsEnabled: boolean;
  logoUrl: string;
  upiQrUrl: string;
  upiId: string;
}

type ToastState = {
  title: string;
  tone: "success" | "error" | "info";
};

type UploadTarget = "upi" | "logo";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState<UploadTarget | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const { register, handleSubmit, reset, formState } = useForm<AdminSettings>();

  const showToast = (nextToast: ToastState) => {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<ApiResponse<AdminSettings>>("/settings");
        setSettings(response.data.data);
        reset(response.data.data);
      } catch (loadError) {
        const clientError = loadError as ClientApiError;
        setError(clientError.message || "Unable to load settings.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadSettings();
  }, [reset]);

  const saveSettings = async (values: AdminSettings) => {
    setError(null);

    try {
      const response = await apiClient.put<ApiResponse<AdminSettings>>("/settings", {
        businessName: values.businessName,
        businessPhone: values.businessPhone,
        businessAddress: values.businessAddress,
        taxRate: Number(values.taxRate),
        notificationsEnabled: values.notificationsEnabled,
        upiId: values.upiId,
      });
      setSettings(response.data.data);
      reset(response.data.data);
      showToast({ title: "Settings saved", tone: "success" });
    } catch (saveError) {
      const clientError = saveError as ClientApiError;
      showToast({ title: clientError.message || "Unable to save settings", tone: "error" });
    }
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>, target: UploadTarget) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(target);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const endpoint = target === "upi" ? "/settings/upi-qr" : "/settings/logo";
      const response = await apiClient.post<
        ApiResponse<{ upiQrUrl?: string; logoUrl?: string }>
      >(endpoint, formData, { headers: { "Content-Type": "multipart/form-data" } });
      const nextSettings = {
        ...settings!,
        ...(response.data.data.upiQrUrl ? { upiQrUrl: response.data.data.upiQrUrl } : {}),
        ...(response.data.data.logoUrl ? { logoUrl: response.data.data.logoUrl } : {}),
      };
      setSettings(nextSettings);
      reset(nextSettings);
      showToast({ title: target === "upi" ? "UPI QR updated" : "Logo updated", tone: "success" });
    } catch (uploadError) {
      const clientError = uploadError as ClientApiError;
      showToast({ title: clientError.message || "Unable to upload image", tone: "error" });
    } finally {
      setIsUploading(null);
      event.target.value = "";
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-zinc-950 p-6 text-zinc-100">
      {toast ? (
        <div className="fixed right-6 top-6 z-50 w-full max-w-sm">
          <Toast title={toast.title} tone={toast.tone} />
        </div>
      ) : null}

      <PageHeader title="Settings" subtitle="Business, payment, tax, and notification settings" />

      {isLoading ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="h-64 bg-zinc-900 border border-zinc-850 rounded-xl animate-pulse" />
            <div className="h-48 bg-zinc-900 border border-zinc-850 rounded-xl animate-pulse" />
          </div>
          <div className="h-96 bg-zinc-900 border border-zinc-850 rounded-xl animate-pulse" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-red-300">
          {error}
        </div>
      ) : (
        <form onSubmit={handleSubmit(saveSettings)} className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="text-lg font-bold">Business Info</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Input label="Business Name" {...register("businessName", { required: true })} />
                <Input label="Business Phone" {...register("businessPhone")} />
                <div className="md:col-span-2">
                  <Input label="Merchant UPI ID (for dynamic QR codes)" {...register("upiId")} placeholder="e.g. merchant@okaxis" />
                </div>
                <label className="block space-y-2 text-left md:col-span-2">
                  <span className="text-sm font-medium text-zinc-200">Business Address</span>
                  <textarea
                    rows={4}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                    {...register("businessAddress")}
                  />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="text-lg font-bold">Taxes and Notifications</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Input
                  label="Tax Rate (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  {...register("taxRate", { valueAsNumber: true })}
                />
                <label className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm font-semibold text-zinc-200">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-amber-500"
                    {...register("notificationsEnabled")}
                  />
                  Notifications enabled
                </label>
              </div>
            </div>

            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Saving..." : "Save Settings"}
            </Button>
          </section>

          <aside className="space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="text-lg font-bold">Logo Upload</h2>
              <div className="mt-4 flex min-h-36 items-center justify-center rounded-xl bg-zinc-950 p-4">
                {settings?.logoUrl ? (
                  <img src={settings.logoUrl} alt="Business logo" className="max-h-28 object-contain" />
                ) : (
                  <span className="text-sm text-zinc-500">No logo uploaded</span>
                )}
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => void uploadImage(event, "logo")}
                className="mt-4 block w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-300"
              />
              {isUploading === "logo" ? <p className="mt-2 text-sm text-amber-400">Uploading...</p> : null}
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="text-lg font-bold">UPI QR</h2>
              <div className="mt-4 flex min-h-56 items-center justify-center rounded-xl bg-white p-4">
                {settings?.upiQrUrl ? (
                  <img src={settings.upiQrUrl} alt="UPI QR" className="max-h-48 object-contain" />
                ) : (
                  <span className="text-sm font-semibold text-zinc-500">No QR configured</span>
                )}
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => void uploadImage(event, "upi")}
                className="mt-4 block w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-300"
              />
              {isUploading === "upi" ? <p className="mt-2 text-sm text-amber-400">Uploading...</p> : null}
            </div>
          </aside>
        </form>
      )}
    </div>
  );
}
