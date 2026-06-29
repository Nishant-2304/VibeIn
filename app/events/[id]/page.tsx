"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, Star, Zap } from "lucide-react";
import {
  apiErrorMessage,
  eventApi,
  type EventDetail,
} from "../../../lib/client-api";

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    eventApi
      .get(params.id)
      .then((data) => active && setEvent(data))
      .catch((cause) => active && setError(apiErrorMessage(cause)))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [params.id]);

  const date = useMemo(
    () =>
      event
        ? new Date(event.scheduledAt).toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
          })
        : "",
    [event]
  );
  const time = useMemo(
    () =>
      event
        ? new Date(event.scheduledAt).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
    [event]
  );

  async function register() {
    setRegistering(true);
    setError(null);
    setNotice(null);

    try {
      await eventApi.register(params.id);
      setEvent((current) =>
        current
          ? { ...current, currentAttendees: current.currentAttendees + 1 }
          : current
      );
      setNotice("You’re registered.");
    } catch (cause) {
      setError(apiErrorMessage(cause));
    } finally {
      setRegistering(false);
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-black p-8 text-white">Loading event…</main>;
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        <p>{error || "Event not found."}</p>
        <Link href="/events" className="mt-4 inline-block text-[#b792ea]">Back to events</Link>
      </main>
    );
  }

  const registrationOpen =
    (event.status === "UPCOMING" || event.status === "ACTIVE") &&
    event.currentAttendees < event.maxAttendees;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto min-h-screen w-full max-w-md pb-10">
        <section className="relative h-[280px] overflow-hidden">
          <Image src="/Hero-Section.png" alt="" fill priority className="object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />
          <div className="absolute bottom-3 right-3 rounded-full bg-black/80 px-4 py-1.5 text-purple-300">
            {event.currentAttendees} / {event.maxAttendees} Going
          </div>
        </section>

        <div className="px-5">
          <h1 className="mt-5 text-[22px] font-extrabold">{event.name}</h1>
          <p className="mt-3 text-[14px] leading-6 text-[#d1d5db]">{event.description}</p>

          <div className="mt-4 flex gap-3">
            <Calendar className="h-5 w-5 text-[#a78bfa]" />
            <div><p className="font-semibold">{date}</p><p className="text-sm text-[#9ca3af]">{time}</p></div>
          </div>
          <div className="mt-3 flex gap-3">
            <MapPin className="h-5 w-5 text-[#a78bfa]" />
            <div>
              <p className="font-semibold">{event.hostel}</p>
              <p className="text-sm text-[#9ca3af]">
                {event.roomNumber || `Floor ${event.floor}`}
              </p>
            </div>
          </div>

          <section className="mt-5 flex items-center justify-between rounded-2xl bg-[#1c1c1e] p-4">
            <div><p className="text-xs text-[#9ca3af]">Hosted by</p><p className="font-bold">{event.host.displayName}</p></div>
            <div className="flex items-center gap-1 text-[#facc15]">
              <Star className="h-4 w-4 fill-current" />
              {event.host.hostRating.toFixed(1)}
            </div>
          </section>

          <section className="mt-6">
            <div className="flex justify-between">
              <h2 className="font-extrabold">Reviews</h2>
              {event.status === "COMPLETED" && (
                <Link href={`/events/${event.id}/reviews`} className="text-sm text-[#a78bfa]">Write review</Link>
              )}
            </div>
            {event.reviews.length ? event.reviews.slice(0, 1).map((review) => (
              <article key={review.id} className="mt-4 rounded-2xl bg-[#111] p-4">
                <div className="flex justify-between"><b>{review.reviewer.displayName}</b><span className="text-[#facc15]">{review.rating}/5</span></div>
                {review.comment && <p className="mt-3 text-sm italic text-[#d1d5db]">“{review.comment}”</p>}
              </article>
            )) : <p className="mt-4 rounded-2xl bg-[#111] p-4 text-sm text-[#9ca3af]">No reviews yet.</p>}
          </section>

          {(error || notice) && <p className={`mt-4 text-sm ${error ? "text-red-300" : "text-emerald-300"}`}>{error || notice}</p>}

          <button
            type="button"
            onClick={() => void register()}
            disabled={!registrationOpen || registering}
            className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#b792ea] font-medium uppercase tracking-[0.18em] text-[#3b2466] disabled:opacity-40"
          >
            {registering ? "Registering" : registrationOpen ? "Register" : "Registration closed"}
            <Zap className="h-6 w-6" />
          </button>
        </div>
      </div>
    </main>
  );
}
