"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  apiErrorMessage,
  eventApi,
  type EventDetail,
} from "../../../../lib/client-api";
import { getHostelsForGender } from "../../../../lib/constants";
import { createClient } from "../../../../lib/supabase/client";

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

const emptyForm: FormState = {
  name: "",
  description: "",
  hostel: "",
  floor: "",
  roomNumber: "",
  scheduledAt: "",
  maxAttendees: "8",
  durationMinutes: "120",
};

// Convert an ISO timestamp into the value expected by
// <input type="datetime-local"> (no seconds, no timezone, local time).
function toLocalInputValue(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return "";
  const tzOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

function detailToForm(event: EventDetail): FormState {
  return {
    name: event.name ?? "",
    description: event.description ?? "",
    hostel: event.hostel ?? "",
    floor: String(event.floor ?? ""),
    roomNumber: event.roomNumber ?? "",
    scheduledAt: toLocalInputValue(event.scheduledAt),
    maxAttendees: String(event.maxAttendees ?? ""),
    durationMinutes: String(
      (event as EventDetail & { durationMinutes?: number }).durationMinutes ?? 120
    ),
  };
}

function shallowEqualForm(a: FormState, b: FormState) {
  return (
    a.name === b.name &&
    a.description === b.description &&
    a.hostel === b.hostel &&
    a.floor === b.floor &&
    a.roomNumber === b.roomNumber &&
    a.scheduledAt === b.scheduledAt &&
    a.maxAttendees === b.maxAttendees &&
    a.durationMinutes === b.durationMinutes
  );
}

export default function EditEventPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [original, setOriginal] = useState<FormState | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The host's gender scopes the hostel dropdown. Fetched once on mount.
  const [userGender, setUserGender] = useState<"MALE" | "FEMALE" | null>(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      if (!session) {
        router.replace("/login");
        return;
      }
      try {
        const res = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (active && res.ok) {
          const me = await res.json();
          setUserGender(me?.gender ?? null);
        }
      } catch {
        // ignore — the gender filter is best-effort
      } finally {
        if (active) setIsUserLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    eventApi
      .get(params.id)
      .then((data) => {
        if (!active) return;
        const initial = detailToForm(data);
        setOriginal(initial);
        setForm(initial);
      })
      .catch((cause) => active && setError(apiErrorMessage(cause)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [params.id]);

  const allowedHostels = getHostelsForGender(userGender);

  // If the existing event has a legacy hostel value that's not in the
  // host's gender list, normalize it to the first allowed hostel and
  // treat that as the original value. This keeps `isDirty` false for
  // legacy data (no PATCH required on load) and lets the user pick a
  // new hostel if they actually want to change it.
  useEffect(() => {
    if (!isUserLoaded || !original) return;
    if (allowedHostels.length === 0) return;
    if (original.hostel && !allowedHostels.includes(original.hostel)) {
      const next = { ...original, hostel: allowedHostels[0] };
      setOriginal(next);
      setForm(next);
    }
  }, [isUserLoaded, original, allowedHostels]);

  function update(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const isDirty = useMemo(
    () => (original ? !shallowEqualForm(form, original) : false),
    [form, original]
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // If nothing changed, just go back to the event page (no PATCH).
    if (original && !isDirty) {
      router.push(`/events/${params.id}`);
      return;
    }

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
    if (!form.hostel || !allowedHostels.includes(form.hostel)) {
      setError("Select a valid hostel for your gender.");
      return;
    }
    if (!Number.isInteger(maxAttendees) || maxAttendees < 2) {
      setError("Maximum attendees must be at least 2.");
      return;
    }
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1) {
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
      // Build a PATCH body containing only the fields the user actually
      // changed. The backend treats every field as optional and applies
      // field-locking rules (name/hostel/floor/roomNumber locked after the
      // first registration, etc.), so omitting unchanged fields avoids
      // re-asserting the original values and tripping locked-field errors.
      const patch: Record<string, unknown> = {};
      if (!original || form.name !== original.name) patch.name = form.name.trim();
      if (!original || form.description !== original.description) patch.description = form.description.trim();
      if (!original || form.hostel !== original.hostel) patch.hostel = form.hostel.trim();
      if (!original || form.floor !== original.floor) patch.floor = floor;
      if (!original || form.roomNumber !== original.roomNumber) patch.roomNumber = form.roomNumber.trim();
      if (!original || form.scheduledAt !== original.scheduledAt)
        patch.scheduledAt = scheduledAt.toISOString();
      if (!original || form.maxAttendees !== original.maxAttendees) patch.maxAttendees = maxAttendees;
      if (!original || form.durationMinutes !== original.durationMinutes)
        patch.durationMinutes = durationMinutes;

      await eventApi.update(params.id, patch);
      router.push(`/events/${params.id}`);
    } catch (cause) {
      setError(apiErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    "mt-2 w-full rounded-2xl border border-white/15 bg-[#1c1c1e] px-4 py-3 text-white outline-none focus:border-[#b792ea]";

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <Loader2 className="w-7 h-7 text-[#9b72cf] animate-spin" />
        <p className="text-gray-400 text-sm font-medium mt-3">Loading event…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-md px-5 py-6">
        <header className="flex items-center gap-4">
          <Link href={`/events/${params.id}`} aria-label="Back">
            <ArrowLeft className="text-[#b792ea]" />
          </Link>
          <h1 className="text-[22px] font-extrabold">Edit Event</h1>
        </header>

        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block">Event name
            <input required minLength={3} maxLength={100} value={form.name} onChange={(e) => update("name", e.target.value)} className={fieldClass} />
          </label>
          <label className="block">Description
            <textarea rows={5} value={form.description} onChange={(e) => update("description", e.target.value)} className={fieldClass} />
          </label>
          <label className="block">Hostel
            <select
              required
              value={form.hostel}
              disabled={!isUserLoaded || allowedHostels.length === 0}
              onChange={(e) => update("hostel", e.target.value)}
              className={fieldClass}
            >
              {allowedHostels.map((hostel) => (
                <option key={hostel} value={hostel}>
                  {hostel}
                </option>
              ))}
            </select>
            {userGender && (
              <span className="block text-[11px] text-white/40 font-medium mt-1">
                {userGender === "MALE"
                  ? "Boys' hostels only — your event will only be visible to boys."
                  : "Girls' hostels only — your event will only be visible to girls."}
              </span>
            )}
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

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[#b792ea] py-4 font-semibold text-[#3b2466] disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/events/${params.id}`)}
              disabled={submitting}
              className="w-full rounded-2xl border border-white/15 bg-transparent py-4 font-semibold text-white disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
