"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  MapPin,
  Pencil,
  Star,
  Zap,
} from "lucide-react";

import { createClient } from "../../../lib/supabase/client";
import {
  apiErrorMessage,
  eventApi,
  type EventDetail,
} from "../../../lib/client-api";

export default function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
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
        console.log("EVENT DATA:", eventData);
        if (!active) return;

        setEvent(eventData);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) return;

        if (session?.user) {
          setCurrentUser(session.user);

          if (eventData.host?.id !== session.user.id) {
            try {
              const registration =
                await eventApi.getRegistration(
                  params.id,
                  session.user.id
                );

              if (active) {
                setIsRegistered(
                  registration.attendanceStatus ===
                  "REGISTERED"
                );
              }
            } catch {
              if (active) {
                setIsRegistered(false);
              }
            }
          }
        }
      } catch (cause) {
        if (active) {
          setError(apiErrorMessage(cause));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
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

    const now = Date.now();
    const scheduledTime = new Date(event.scheduledAt).getTime();

    return now >= scheduledTime - 15 * 60 * 1000;
  }, [event]);
  console.log("event", event);
  console.log("host", event?.host);
  console.log("currentUser", currentUser);
  const isHost =
    !!event &&
    !!currentUser &&
    event.host?.id === currentUser.id;

  const registrationOpen =
    !!event &&
    (event.status === "UPCOMING" ||
      event.status === "ACTIVE") &&
    event.currentAttendees < event.maxAttendees;

  const hostBgColor = "#9474cc";
  async function register() {
    setRegistering(true);
    setError(null);
    setNotice(null);

    try {
      await eventApi.register(params.id);

      setEvent((current) =>
        current
          ? {
            ...current,
            currentAttendees: current.currentAttendees + 1,
          }
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
          ? {
            ...current,
            currentAttendees: Math.max(
              0,
              current.currentAttendees - 1
            ),
          }
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

  async function updateEventStatus(
    newStatus: "ACTIVE" | "COMPLETED" | "CANCELLED"
  ) {
    setStatusUpdating(true);
    setError(null);
    setNotice(null);

    try {
      const updatedEvent = await eventApi.updateStatus(
        params.id,
        newStatus
      );

      setEvent(updatedEvent);

      if (newStatus === "CANCELLED") {
        setNotice("Event cancelled.");
      } else if (newStatus === "ACTIVE") {
        setNotice("Event started.");
      } else if (newStatus === "COMPLETED") {
        router.push(
          `/events/${params.id}/participants/reviews`
        );
      }
    } catch (cause) {
      setError(apiErrorMessage(cause));
    } finally {
      setStatusUpdating(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 relative px-5 pt-6 pb-10 flex flex-col items-center justify-center bg-[#121212] min-h-screen text-gray-400 font-sans z-50">
        <div className="w-8 h-8 border-2 border-[#9b72cf] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">Loading event…</p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-[#121212] p-8 text-white flex flex-col items-center justify-center z-50 relative">
        <p>{error || "Event not found."}</p>

        <button
          type="button"
          onClick={() => router.back()}
          className="mt-4 inline-block text-[#b792ea] font-bold hover:underline cursor-pointer"
        >
          Go Back
        </button>
      </main>
    );
  }

  const reviews = event.reviews ?? [];

  return (
    <main className="min-h-screen bg-[#121212] text-white relative z-50">
      <div className="mx-auto min-h-screen w-full max-w-md pb-10">

        {/* ================= HERO ================= */}

        <section className="relative h-[280px] overflow-hidden">
          <Image
            src="/Hero-Section.png"
            alt=""
            fill
            priority
            className="object-cover"
          />

          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#121212] to-transparent" />

          <button
            type="button"
            onClick={() => router.back()}
            className="absolute top-6 left-5 z-20 p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-all active:scale-95 shadow-lg cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          {isHost && (
            <Link
              href={`/events/${encodeURIComponent(event.id)}/edit`}
              className="absolute top-6 right-5 z-20 p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-all active:scale-95 shadow-lg cursor-pointer"
              aria-label="Edit event"
            >
              <Pencil className="w-5 h-5 stroke-[2.5]" />
            </Link>
          )}

          <div className="absolute bottom-4 right-4 rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-4 py-1.5 text-[#c8aaf5] font-bold text-sm shadow-lg">
            {event.currentAttendees} / {event.maxAttendees} Going
          </div>
        </section>
        <div className="px-5">
          {/* ================= TITLE ================= */}

          <h1 className="mt-2 text-3xl font-display font-black tracking-wide">
            {event.name}
          </h1>

          <p className="mt-3 text-sm font-medium leading-relaxed text-gray-300">
            {event.description}
          </p>

          {/* ================= LOGISTICS ================= */}

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/5 p-2.5 text-[#b594e6]">
                <Calendar className="h-5 w-5" />
              </div>

              <div>
                <p className="font-bold tracking-tight text-white">
                  {date}
                </p>

                <p className="text-xs font-medium text-gray-400">
                  {time}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/5 p-2.5 text-[#b594e6]">
                <MapPin className="h-5 w-5" />
              </div>

              <div>
                <p className="font-bold tracking-tight text-white">
                  {event.hostel}
                </p>

                <p className="text-xs font-medium text-gray-400">
                  {event.roomNumber || `Floor ${event.floor}`}
                </p>
              </div>
            </div>
          </div>

          {/* ================= HOST CARD ================= */}

          {event.host && (
            <Link
              href={`/user/${encodeURIComponent(event.host.id)}`}
              className="relative mt-8 block w-full select-none overflow-hidden rounded-3xl p-5 text-white shadow-lg transition-transform active:scale-[0.99]"
              style={{ backgroundColor: hostBgColor }}
            >
              <div
                className="absolute top-0 right-0 z-10 flex h-[44px] items-center justify-end rounded-tr-3xl bg-white pr-5 pl-10 shadow-sm"
                style={{
                  clipPath:
                    "polygon(0% 0,100% 0,100% 100%,30% 100%)",
                  color: hostBgColor,
                }}
              >
                <div className="mt-1 flex items-baseline gap-1">
                  <Star className="mb-0.5 h-4 w-4 fill-current" />

                  <span className="font-display text-2xl font-black leading-none">
                    {event.host.hostRating.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="relative z-10 flex flex-col">
                <span className="mb-1 text-[11px] font-bold uppercase tracking-wider text-white/90">
                  Hosted by
                </span>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/20 text-xl shadow-inner">
                    {event.host.pfp?.trim()
                      ? event.host.pfp
                      : event.host.displayName.charAt(0)}
                  </div>

                  <h3 className="font-display truncate pr-16 text-2xl font-black tracking-wide">
                    {event.host.displayName}
                  </h3>
                </div>
              </div>

              <div className="relative z-10 mt-5">
                <div className="mb-3 h-px w-1/3 bg-white/50" />

                <div className="flex items-center justify-between">
                  <span className="font-display text-lg tracking-wide">
                    View Profile
                  </span>

                  <div className="flex items-center justify-center rounded-xl bg-[#121212] px-5 py-1.5 text-white shadow-xl transition-all">
                    <ArrowRight className="h-5 w-5 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* ================= REVIEWS ================= */}

          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold">
                Reviews
              </h2>

              {event.status === "COMPLETED" && (
                <Link
                  href={`/events/${event.id}/reviews`}
                  className="text-sm font-medium text-[#b792ea]"
                >
                  Write review
                </Link>
              )}
            </div>

            {reviews.length ? (
              reviews.slice(0, 1).map((review) => (
                <article
                  key={review.id}
                  className="mt-4 rounded-2xl border border-white/5 bg-[#181818] p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">
                      {review.reviewer.displayName}
                    </span>

                    <span className="text-[#facc15]">
                      {review.rating}/5
                    </span>
                  </div>

                  {review.comment && (
                    <p className="mt-3 text-sm italic leading-relaxed text-gray-300">
                      "{review.comment}"
                    </p>
                  )}
                </article>
              ))
            ) : (
              <div className="mt-4 rounded-2xl border border-white/5 bg-[#181818] p-4 text-sm text-gray-400">
                No reviews yet.
              </div>
            )}

            {reviews.length > 1 && (
              <Link
                href={`/events/${event.id}/reviews`}
                className="mt-4 inline-block text-sm font-medium text-[#b792ea]"
              >
                View all reviews →
              </Link>
            )}
          </section>
          {/* ================= ALERTS ================= */}

          {(error || notice) && (
            <div
              className={`mt-6 rounded-xl border p-3 text-center text-sm font-bold ${error
                  ? "border-red-500/20 bg-red-500/10 text-red-400"
                  : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                }`}
            >
              {error || notice}
            </div>
          )}

          {/* ================= USER CTA ================= */}

          {!isHost && (
            <button
              type="button"
              onClick={() =>
                void (isRegistered ? unregister() : register())
              }
              disabled={
                (!isRegistered && !registrationOpen) || registering
              }
              className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#c8aaf5] font-display text-xl font-black tracking-wider text-[#2c124d] shadow-[0_4px_25px_rgba(155,114,207,0.3)] transition-all active:scale-[0.99] disabled:grayscale disabled:opacity-50 hover:bg-[#b894ec]"
            >
              {registering
                ? isRegistered
                  ? "Unregistering..."
                  : "Registering..."
                : isRegistered
                  ? "Unregister"
                  : registrationOpen
                    ? "Register"
                    : "Registration Closed"}

              <Zap className="h-5 w-5 stroke-[2.5]" />
            </button>
          )}

          {/* ================= HOST CONTROLS ================= */}

          {isHost &&
            (event.status === "UPCOMING" ||
              event.status === "ACTIVE") && (
              <section className="mt-8 space-y-4 rounded-3xl border border-white/10 bg-[#181818] p-5">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#c8aaf5]">
                  Host Controls
                </h3>

                {event.status === "UPCOMING" && (
                  <div>
                    <button
                      type="button"
                      disabled={
                        !canStartEvent || statusUpdating
                      }
                      onClick={() =>
                        void updateEventStatus("ACTIVE")
                      }
                      className="flex h-12 w-full items-center justify-center rounded-xl bg-emerald-500 font-bold uppercase tracking-wider text-black transition-all active:scale-[0.99] disabled:opacity-40"
                    >
                      {statusUpdating
                        ? "Starting..."
                        : "Start Event"}
                    </button>

                    {!canStartEvent && (
                      <p className="mt-2 text-center text-xs text-gray-400">
                        Available 15 minutes before the
                        scheduled start time.
                      </p>
                    )}
                  </div>
                )}

                {event.status === "ACTIVE" && (
                  <button
                    type="button"
                    disabled={statusUpdating}
                    onClick={() =>
                      void updateEventStatus("COMPLETED")
                    }
                    className="flex h-12 w-full items-center justify-center rounded-xl bg-purple-500 font-bold uppercase tracking-wider text-white transition-all active:scale-[0.99] disabled:opacity-40"
                  >
                    {statusUpdating
                      ? "Finishing..."
                      : "Finish Event"}
                  </button>
                )}

                <button
                  type="button"
                  disabled={statusUpdating}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to cancel this event? This action cannot be undone."
                      )
                    ) {
                      void updateEventStatus(
                        "CANCELLED"
                      );
                    }
                  }}
                  className="flex h-12 w-full items-center justify-center rounded-xl border border-red-500/30 bg-red-950/20 font-bold uppercase tracking-wider text-red-400 transition-all hover:bg-red-950/40 active:scale-[0.99] disabled:opacity-40"
                >
                  Cancel Event
                </button>
              </section>
            )}
        </div>
      </div>
    </main>
  );
}
