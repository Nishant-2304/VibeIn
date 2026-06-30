"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { apiErrorMessage, eventApi } from "../../../lib/client-api";

type FormState = {
  name: string;
  description: string;
  hostel: string;
  floor: string;
  roomNumber: string;
  scheduledAt: string;
  maxAttendees: string;
  durationMinutes: string;
};

const initialForm: FormState = {
  name: "",
  description: "",
  hostel: "",
  floor: "",
  roomNumber: "",
  scheduledAt: "",
  maxAttendees: "8",
  durationMinutes: "120",
};

export default function CreateEventPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const floor = Number(form.floor);
    const maxAttendees = Number(form.maxAttendees);
    const durationMinutes = Number(form.durationMinutes);
    if (form.name.trim().length < 3 || form.name.trim().length > 100) {
      setError("Event name must be between 3 and 100 characters.");
      return;
    }
    if (!Number.isInteger(floor) || floor < 0) {
      setError("Enter a valid floor number.");
      return;
    }
    if (!Number.isInteger(maxAttendees) || maxAttendees < 2) {
      setError("Maximum attendees must be at least 2.");
      return;
    }
    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 1
    ) {
      setError("Duration must be a positive whole number of minutes.");
      return;
    }
    const scheduledAt = new Date(form.scheduledAt);
    if (Number.isNaN(scheduledAt.valueOf()) || scheduledAt <= new Date()) {
      setError("Choose a date and time in the future.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await eventApi.create({
        name: form.name.trim(),
        description: form.description.trim(),
        hostel: form.hostel.trim(),
        floor,
        roomNumber: form.roomNumber.trim(),
        scheduledAt: scheduledAt.toISOString(),
        maxAttendees,
        durationMinutes,
      });
      router.push(`/events/${created.id}`);
    } catch (cause) {
      setError(apiErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass = "mt-2 w-full rounded-2xl border border-white/15 bg-[#1c1c1e] px-4 py-3 text-white outline-none focus:border-[#b792ea]";

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-md px-5 py-6">
        <header className="flex items-center gap-4">
          <Link href="/events" aria-label="Back"><ArrowLeft className="text-[#b792ea]" /></Link>
          <h1 className="text-[22px] font-extrabold">Create Event</h1>
        </header>

        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block">Event name
            <input required minLength={3} maxLength={100} value={form.name} onChange={(e) => update("name", e.target.value)} className={fieldClass} />
          </label>
          <label className="block">Description
            <textarea rows={5} value={form.description} onChange={(e) => update("description", e.target.value)} className={fieldClass} />
          </label>
          <label className="block">Hostel
            <input required value={form.hostel} onChange={(e) => update("hostel", e.target.value)} className={fieldClass} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>Floor<input required type="number" min={0} value={form.floor} onChange={(e) => update("floor", e.target.value)} className={fieldClass} /></label>
            <label>Room number<input required value={form.roomNumber} onChange={(e) => update("roomNumber", e.target.value)} className={fieldClass} /></label>
          </div>
          <label className="block">Date and time
            <input required type="datetime-local" value={form.scheduledAt} onChange={(e) => update("scheduledAt", e.target.value)} className={fieldClass} />
          </label>
          <label className="block">Maximum attendees
            <input required type="number" min={2} value={form.maxAttendees} onChange={(e) => update("maxAttendees", e.target.value)} className={fieldClass} />
          </label>
          <label className="block">Duration (minutes)
            <input required type="number" min={1} step={1} value={form.durationMinutes} onChange={(e) => update("durationMinutes", e.target.value)} className={fieldClass} />
          </label>

          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
          <button disabled={submitting} className="w-full rounded-2xl bg-[#b792ea] py-4 font-semibold text-[#3b2466] disabled:opacity-60">
            {submitting ? "Creating…" : "Create Event"}
          </button>
        </form>
      </div>
    </main>
  );
}
