"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { apiClient } from "@/lib/api-client";
import { ApiResponse, ClientApiError } from "@/types/api";
import { RestaurantTable } from "@/types/table.types";

const schema = z.object({
  tableNumber: z
    .string()
    .trim()
    .min(1, "Table number is required")
    .max(10, "Table number too long")
    .regex(/^[A-Za-z0-9-]+$/, "Only letters, numbers, and hyphens allowed"),
});

type TableFormValues = z.infer<typeof schema>;

interface TableFormProps {
  table?: RestaurantTable;
  onSuccess: (table: RestaurantTable) => void;
  onCancel: () => void;
}

export function TableForm({ table, onSuccess, onCancel }: TableFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditMode = Boolean(table);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TableFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tableNumber: table?.tableNumber ?? "",
    },
  });

  const onSubmit = async (values: TableFormValues) => {
    setServerError(null);

    try {
      const payload = { tableNumber: values.tableNumber.trim() };
      const response = table
        ? await apiClient.put<ApiResponse<RestaurantTable>>(`/tables/${table.id}`, payload)
        : await apiClient.post<ApiResponse<RestaurantTable>>("/tables", payload);

      onSuccess(response.data.data);
    } catch (error) {
      const clientError = error as ClientApiError;
      setServerError(
        clientError.status === 409
          ? "Table number already exists"
          : clientError.message || "Unable to save table",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <Input
          label="Table Number"
          placeholder="e.g. T1, T2, VIP-1"
          error={errors.tableNumber?.message}
          {...register("tableNumber")}
        />
        <p className="mt-2 text-xs text-zinc-500">This will be encoded in the QR code.</p>
      </div>

      {isEditMode && table?.qrCodeUrl ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300/90">
          Changing the table number will automatically regenerate the QR code. Print the new QR
          code and replace the one on the table.
        </div>
      ) : (
        <div className="rounded-xl bg-zinc-800 p-3 text-xs text-zinc-400">
          A QR code will be automatically generated after the table is created.
        </div>
      )}

      {serverError ? <p className="text-sm text-red-400">{serverError}</p> : null}

      <div className="space-y-3">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Create Table"}
        </Button>
        <Button type="button" variant="secondary" className="w-full" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
