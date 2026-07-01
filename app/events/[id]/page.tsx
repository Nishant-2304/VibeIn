// app/events/[id]/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, Star, Zap, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";
import {
  apiErrorMessage,
  eventApi,
  type EventDetail,
  userApi,
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
    return (
      <main className="flex-1 relative px-5 pt-6 pb-10 flex flex-col items-center justify-center bg-[#121212] min-h-screen text-gray-400 font-sans z-50">
        <div className="w-8 h-8 border-2 border-[#9b72cf] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">Loading event…</p>
      </main>
    );
  }

  // Error State - removed bottom navbar padding
  if (!event) {
    return (
      <main className="min-h-screen bg-[#121212] p-8 text-white flex flex-col items-center justify-center z-50 relative">
        <p>{error || "Event not found."}</p>
        <button 
          onClick={() => router.back()} 
          className="mt-4 inline-block text-[#b792ea] font-bold hover:underline cursor-pointer"
        >
          Go Back
        </button>
      </main>
    );
  }

  const registrationOpen =
    (event.status === "UPCOMING" || event.status === "ACTIVE") &&
    event.currentAttendees < event.maxAttendees;

  const isHost = event && currentUser && event.host.id === currentUser.id;

  return (
    <main className="min-h-screen bg-[#121212] text-white relative z-50">
      <div className="mx-auto min-h-screen w-full max-w-md pb-10">
        
        {/* ================= HERO IMAGE ================= */}
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
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#121212] to-transparent" />
          
          {/* Floating Back Button */}
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute top-6 left-5 z-20 p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-all cursor-pointer shadow-lg active:scale-95"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Floating Edit Button (host only) */}
          {isHost && (
            <Link
              href={`/events/${encodeURIComponent(event.id)}/edit`}
              className="absolute top-6 right-5 z-20 p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-all cursor-pointer shadow-lg active:scale-95"
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
          {/* ================= TITLE & DESC ================= */}
          <h1 className="mt-2 text-3xl font-display font-black tracking-wide">{event.name}</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-gray-300">{event.description}</p>

          {/* ================= LOGISTICS ================= */}
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex gap-3 items-center">
              <div className="p-2.5 bg-white/5 rounded-xl text-[#b594e6]">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-white tracking-tight">{date}</p>
                <p className="text-xs font-medium text-gray-400">{time}</p>
              </div>
            </div>
            
            <div className="flex gap-3 items-center">
              <div className="p-2.5 bg-white/5 rounded-xl text-[#b594e6]">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-white tracking-tight">{event.hostel}</p>
                <p className="text-xs font-medium text-gray-400">
                  {event.roomNumber || `Floor ${event.floor}`}
                </p>
              </div>
            </div>
          </div>

          {/* ================= HOSTED BY ================= */}
          <Link
            href={`/user/${encodeURIComponent(event.host.id)}`}
            className="mt-8 block w-full rounded-3xl p-5 shadow-lg transition-transform active:scale-[0.99] select-none text-white relative overflow-hidden"
            style={{ backgroundColor: hostBgColor }}
          >
            {/* Top Right Ribbon (Rating) */}
            <div
              className="absolute top-0 right-0 bg-white h-[44px] flex items-center justify-end pr-5 pl-10 rounded-tr-3xl z-10 shadow-sm"
              style={{
                clipPath: "polygon(0% 0, 100% 0, 100% 100%, 30% 100%)",
                color: hostBgColor,
              }}
            >
              <div className="flex items-baseline gap-1 mt-1">
                <Star className="h-4 w-4 fill-current mb-0.5" />
                <span className="font-display text-2xl font-black leading-none">
                  {event.host.hostRating.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Top Left: Avatar and "Hosted by" */}
            <div className="flex flex-col z-10 relative">
              <span className="text-[11px] font-bold tracking-wider text-white/90 uppercase mb-1 drop-shadow-sm">
                Hosted by
              </span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black/20 border border-white/20 flex items-center justify-center text-xl shadow-inner shrink-0">
                  {event.host.pfp?.trim()
                    ? event.host.pfp
                    : event.host.displayName.charAt(0)}
                </div>
                <h3 className="font-display text-2xl font-black leading-none tracking-wide truncate pr-16">
                  {event.host.displayName}
                </h3>
              </div>
            </div>

            {/* Bottom: Divider & Action */}
            <div className="mt-5 relative z-10">
              <div className="w-1/3 h-px bg-white/50 mb-3" />
              <div className="flex items-center justify-between">
                <span className="font-display text-lg tracking-wide text-white drop-shadow-sm">
                  View Profile
                </span>
                <div className="bg-[#121212] hover:bg-black text-white px-5 py-1.5 rounded-xl shadow-xl transition-all flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>
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