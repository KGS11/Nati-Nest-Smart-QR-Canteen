"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { customerService, CateringLeadPayload } from "@/services/customerService";
import { ClientApiError } from "@/types/api";

const eventTypes: CateringLeadPayload["eventType"][] = [
  "CORPORATE",
  "BIRTHDAY",
  "WEDDING",
  "SPORTS",
  "OTHER",
];

export default function CustomerCateringPage() {
  const router = useRouter();
  const [form, setForm] = useState<CateringLeadPayload>({
    name: "",
    phone: "",
    eventType: "CORPORATE",
    eventDate: "",
    guestCount: 25,
    location: "",
    notes: "",
    preferredContactTime: "MORNING",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof CateringLeadPayload>(key: K, value: CateringLeadPayload[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await customerService.createCateringLead({
        ...form,
        guestCount: Number(form.guestCount),
        notes: form.notes?.trim() || undefined,
      });
      router.push("/customer/menu");
    } catch (err) {
      const clientError = err as ClientApiError;
      setError(clientError.message || "Unable to submit catering request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-surface-base px-4 py-6 text-text-primary">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-400">Nati Nest</p>
        <h1 className="mt-1 text-2xl font-bold">Plan a catering event</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Tell us the basics and our team will contact you with options.
        </p>
      </header>

      {error ? (
        <div role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <form onSubmit={submit} className="space-y-4">
        <input
          required
          minLength={2}
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          placeholder="Your name"
          className="min-h-12 w-full rounded-xl border border-border-primary bg-surface-raised px-4 text-sm outline-none focus:border-accent-500"
        />
        <input
          required
          inputMode="numeric"
          pattern="\d{10}"
          value={form.phone}
          onChange={(event) => update("phone", event.target.value)}
          placeholder="10 digit phone"
          className="min-h-12 w-full rounded-xl border border-border-primary bg-surface-raised px-4 text-sm outline-none focus:border-accent-500"
        />
        <select
          value={form.eventType}
          onChange={(event) => update("eventType", event.target.value as CateringLeadPayload["eventType"])}
          className="min-h-12 w-full rounded-xl border border-border-primary bg-surface-raised px-4 text-sm outline-none focus:border-accent-500"
        >
          {eventTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          required
          type="date"
          value={form.eventDate}
          onChange={(event) => update("eventDate", event.target.value)}
          className="min-h-12 w-full rounded-xl border border-border-primary bg-surface-raised px-4 text-sm outline-none focus:border-accent-500"
        />
        <input
          required
          type="number"
          min={5}
          max={10000}
          value={form.guestCount}
          onChange={(event) => update("guestCount", Number(event.target.value))}
          placeholder="Guest count"
          className="min-h-12 w-full rounded-xl border border-border-primary bg-surface-raised px-4 text-sm outline-none focus:border-accent-500"
        />
        <input
          required
          minLength={3}
          value={form.location}
          onChange={(event) => update("location", event.target.value)}
          placeholder="Event location"
          className="min-h-12 w-full rounded-xl border border-border-primary bg-surface-raised px-4 text-sm outline-none focus:border-accent-500"
        />
        <textarea
          value={form.notes}
          maxLength={500}
          onChange={(event) => update("notes", event.target.value)}
          placeholder="Notes, menu ideas, or timing"
          className="min-h-28 w-full rounded-xl border border-border-primary bg-surface-raised px-4 py-3 text-sm outline-none focus:border-accent-500"
        />
        <Button type="submit" disabled={submitting} className="min-h-12 w-full bg-accent-500 text-surface-base">
          {submitting ? "Submitting..." : "Submit Request"}
        </Button>
      </form>

      <Link href="/customer/menu" className="mt-4 text-center text-sm text-text-secondary">
        Back to menu
      </Link>
    </main>
  );
}
