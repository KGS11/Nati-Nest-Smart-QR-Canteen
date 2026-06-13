"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import apiClient from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import { ClientApiError } from "@/types/api";

interface CateringEnquiryFormProps {
  isOpen: boolean;
  onClose: () => void;
}

type EventType = "CORPORATE" | "BIRTHDAY" | "WEDDING" | "SPORTS" | "OTHER";
type ContactTime = "MORNING" | "AFTERNOON" | "EVENING";

interface CateringFormState {
  name: string;
  phone: string;
  eventType: EventType;
  eventDate: string;
  guestCount: number;
  location: string;
  preferredContactTime: ContactTime;
  notes: string;
}

const eventTypes: EventType[] = ["CORPORATE", "BIRTHDAY", "WEDDING", "SPORTS", "OTHER"];
const contactTimes: ContactTime[] = ["MORNING", "AFTERNOON", "EVENING"];

const initialForm: CateringFormState = {
  name: "",
  phone: "",
  eventType: "CORPORATE",
  eventDate: "",
  guestCount: 25,
  location: "",
  preferredContactTime: "MORNING",
  notes: "",
};

const tomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
};

export function CateringEnquiryForm({ isOpen, onClose }: CateringEnquiryFormProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<CateringFormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => firstFieldRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSuccess) {
        onClose();
      }

      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        "button, input, select, textarea, a[href]",
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isSuccess, onClose]);

  if (!isOpen) return null;

  const update = <K extends keyof CateringFormState>(key: K, value: CateringFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (form.name.trim().length < 2) nextErrors.name = "Name must be at least 2 characters.";
    if (!/^\d{10}$/.test(form.phone)) nextErrors.phone = "Phone must be 10 digits.";
    if (!form.eventDate || new Date(form.eventDate) <= new Date()) {
      nextErrors.eventDate = "Event date must be in the future.";
    }
    if (form.guestCount < 5) nextErrors.guestCount = "Guest count must be at least 5.";
    if (form.location.trim().length < 3) nextErrors.location = "Location is required.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await apiClient.post("/catering/enquiries", {
        ...form,
        name: form.name.trim(),
        location: form.location.trim(),
        notes: form.notes.trim() || undefined,
      });
      setIsSuccess(true);
      setForm(initialForm);
    } catch (err) {
      const clientError = err as ClientApiError;
      setApiError(clientError.message || "Unable to send enquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        onClick={() => {
          if (!isSuccess) onClose();
        }}
        aria-label="Close catering enquiry"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Catering enquiry form"
        className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-100 shadow-2xl sm:rounded-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-amber-400">Nati Nest</p>
            <h2 className="mt-1 text-xl font-bold">Catering enquiry</h2>
            <p className="mt-1 text-sm text-zinc-400">Tell us about your event and our team will call you.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-11 rounded-full border border-zinc-800 text-zinc-400"
            aria-label="Close catering enquiry form"
          >
            X
          </button>
        </div>

        {isSuccess ? (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-5 text-center">
            <h3 className="text-lg font-bold text-green-300">Enquiry sent</h3>
            <p className="mt-2 text-sm text-zinc-300">Our catering team will contact you shortly.</p>
            <Button type="button" className="mt-5 w-full bg-amber-500 text-zinc-950" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {apiError ? (
              <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {apiError}
              </p>
            ) : null}

            <label className="block">
              <span className="text-xs font-bold text-zinc-400">Name</span>
              <input
                ref={firstFieldRef}
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                className="mt-1 min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
              />
              {errors.name ? <span className="text-xs text-red-400">{errors.name}</span> : null}
            </label>

            <label className="block">
              <span className="text-xs font-bold text-zinc-400">Phone</span>
              <input
                value={form.phone}
                inputMode="numeric"
                maxLength={10}
                onChange={(event) => update("phone", event.target.value.replace(/\D/g, ""))}
                className="mt-1 min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
              />
              {errors.phone ? <span className="text-xs text-red-400">{errors.phone}</span> : null}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold text-zinc-400">Event type</span>
                <select
                  value={form.eventType}
                  onChange={(event) => update("eventType", event.target.value as EventType)}
                  className="mt-1 min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-sm outline-none focus:border-amber-500"
                >
                  {eventTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold text-zinc-400">Event date</span>
                <input
                  type="date"
                  min={tomorrowDate()}
                  value={form.eventDate}
                  onChange={(event) => update("eventDate", event.target.value)}
                  className="mt-1 min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-sm outline-none focus:border-amber-500"
                />
                {errors.eventDate ? <span className="text-xs text-red-400">{errors.eventDate}</span> : null}
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold text-zinc-400">Guests</span>
                <input
                  type="number"
                  min={5}
                  value={form.guestCount}
                  onChange={(event) => update("guestCount", Number(event.target.value))}
                  className="mt-1 min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-sm outline-none focus:border-amber-500"
                />
                {errors.guestCount ? <span className="text-xs text-red-400">{errors.guestCount}</span> : null}
              </label>
              <label className="block">
                <span className="text-xs font-bold text-zinc-400">Preferred contact</span>
                <select
                  value={form.preferredContactTime}
                  onChange={(event) => update("preferredContactTime", event.target.value as ContactTime)}
                  className="mt-1 min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-sm outline-none focus:border-amber-500"
                >
                  {contactTimes.map((time) => <option key={time} value={time}>{time}</option>)}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-bold text-zinc-400">Location</span>
              <input
                value={form.location}
                onChange={(event) => update("location", event.target.value)}
                className="mt-1 min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-sm outline-none focus:border-amber-500"
              />
              {errors.location ? <span className="text-xs text-red-400">{errors.location}</span> : null}
            </label>

            <label className="block">
              <span className="text-xs font-bold text-zinc-400">Requirements / Notes (Optional)</span>
              <textarea
                value={form.notes}
                maxLength={500}
                rows={3}
                onChange={(event) => update("notes", event.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-amber-500"
              />
              <span className="text-xs text-zinc-500">{form.notes.length}/500</span>
            </label>

            <Button
              type="submit"
              disabled={submitting}
              className="min-h-12 w-full bg-amber-500 text-zinc-950"
            >
              {submitting ? <Loader label="" /> : "Send Enquiry"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
