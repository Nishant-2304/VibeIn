"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, Star, Zap, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";
import {
  apiErrorMessage,
  eventApi,
  type EventDetail,
} from "../../../lib/client-api";

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const supabase = createClient();

    async function loadData() {
      try {
        const eventData = await eventApi.get(params.id);
        if (!active) return;
        setEvent(eventData);

        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;

        if (session?.user) {
          setCurrentUser(session.user);
          if (eventData.host.id !== session.user.id) {
            try {
              const reg = await eventApi.getRegistration(params.id, session.user.id);
              if (active) {
                setIsRegistered(reg.attendanceStatus === "REGISTERED");
              }
            } catch (regError) {
              if (active) setIsRegistered(false);
            }
          }
        }
      } catch (cause) {
        if (active) setError(apiErrorMessage(cause));
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadData();

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

  const canStartEvent = useMemo(() => {
    if (!event) return false;
    const now = new Date().getTime();
    const scheduledTime = new Date(event.scheduledAt).getTime();
    // 15 minutes before scheduled start time
    return now >= (scheduledTime - 15 * 60 * 1000);
  }, [event]);

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
      setIsRegistered(true);
      setNotice("You’re registered.");
    } catch (cause) {
      setError(apiErrorMessage(cause));
    } finally {
      setRegistering(false);
    }
  }

  async function unregister() {
    setRegistering(true);
    setError(null);
    setNotice(null);

    try {
      await eventApi.unregister(params.id);
      setEvent((current) =>
        current
          ? { ...current, currentAttendees: Math.max(0, current.currentAttendees - 1) }
          : current
      );
      setIsRegistered(false);
      setNotice("You’ve unregistered.");
    } catch (cause) {
      setError(apiErrorMessage(cause));
    } finally {
      setRegistering(false);
    }
  }

  async function updateEventStatus(newStatus: "ACTIVE" | "COMPLETED" | "CANCELLED") {
    setStatusUpdating(true);
    setError(null);
    setNotice(null);

    try {
      const updatedEvent = await eventApi.updateStatus(params.id, newStatus);
      setEvent(updatedEvent);
      if (newStatus === "CANCELLED") {
        setNotice("Event cancelled.");
      } else if (newStatus === "ACTIVE") {
        setNotice("Event started.");
      } else if (newStatus === "COMPLETED") {
        router.push(`/events/${params.id}/participants/reviews`);
      }
    } catch (cause) {
      setError(apiErrorMessage(cause));
    } finally {
      setStatusUpdating(false);
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

  const isHost = event && currentUser && event.host.id === currentUser.id;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto min-h-screen w-full max-w-md pb-10">
        <section className="relative h-[280px] overflow-hidden">
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute top-4 left-4 z-10 rounded-full bg-black/60 p-2 text-white transition active:scale-95 cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
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

          {!isHost && (
            <button
              type="button"
              onClick={() => void (isRegistered ? unregister() : register())}
              disabled={(!isRegistered && !registrationOpen) || registering}
              className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#b792ea] font-medium uppercase tracking-[0.18em] text-[#3b2466] disabled:opacity-40"
            >
              {registering
                ? (isRegistered ? "Unregistering..." : "Registering...")
                : isRegistered
                ? "Unregister"
                : registrationOpen
                ? "Register"
                : "Registration closed"}
              <Zap className="h-6 w-6" />
            </button>
          )}

          {isHost && (event.status === "UPCOMING" || event.status === "ACTIVE") && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-[#131313] p-5 space-y-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-purple-300">Host Controls</h3>
              
              <div className="flex flex-col gap-3">
                {event.status === "UPCOMING" && (
                  <div>
                    <button
                      type="button"
                      disabled={!canStartEvent || statusUpdating}
                      onClick={() => void updateEventStatus("ACTIVE")}
                      className="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-emerald-500 font-semibold uppercase tracking-[0.12em] text-black disabled:opacity-40 transition active:scale-[0.98] cursor-pointer"
                    >
                      {statusUpdating ? "Starting..." : "Start Event"}
                    </button>
                    {!canStartEvent && (
                      <p className="mt-2 text-xs text-gray-400 text-center font-medium">
                        Available starting 15 mins before scheduled time.
                      </p>
                    )}
                  </div>
                )}

                {event.status === "ACTIVE" && (
                  <button
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => void updateEventStatus("COMPLETED")}
                    className="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-purple-500 font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-40 transition active:scale-[0.98] cursor-pointer"
                  >
                    {statusUpdating ? "Finishing..." : "Finish Event"}
                  </button>
                )}

                <button
                  type="button"
                  disabled={statusUpdating}
                  onClick={() => {
                    if (window.confirm("Are you sure you want to cancel this event? This action cannot be undone.")) {
                      void updateEventStatus("CANCELLED");
                    }
                  }}
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-red-500/30 bg-red-950/20 font-semibold uppercase tracking-[0.12em] text-red-400 disabled:opacity-40 transition active:scale-[0.98] hover:bg-red-950/40 cursor-pointer"
                >
                  Cancel Event
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
