// app/events/[id]/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, Star, Zap, ArrowLeft, Pencil, ArrowRight } from "lucide-react";
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
  
  // NEW: Track exact attendance status to ensure attendees can review
  const [attendanceStatus, setAttendanceStatus] = useState<string | null>(null);

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
                // Save the exact status (REGISTERED, ATTENDED, NO_SHOW, etc.)
                setAttendanceStatus(registration.attendanceStatus);
                
                // Consider them "Registered" for button UI purposes if they are registered OR attended
                setIsRegistered(
                  registration.attendanceStatus === "REGISTERED" || 
                  registration.attendanceStatus === "ATTENDED"
                );
              }
            } catch {
              if (active) {
                setIsRegistered(false);
                setAttendanceStatus(null);
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
  const manageAttendeesBgColor = "#3d8ba8";
  
  async function register() {
    // Frontend guard: the event host must never be able to register for
    // their own event. The host controls (Manage Attendees, Live Controls)
    // are shown in their place. This is a defensive check on top of the
    // conditional render below, in case the host relationship is computed
    // after the button mounts.
    if (isHost) {
      setError("Hosts cannot register for their own event.");
      return;
    }

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
      setAttendanceStatus("REGISTERED");
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
      setAttendanceStatus(null);
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

  return (
    <main className="min-h-screen bg-[#121212] text-white relative z-50">
      <div className="mx-auto min-h-screen w-full max-w-md pb-10">

        {/* ================= HERO ================= */}
        <section className="relative h-[280px] overflow-hidden">
          <Image src="/Hero-Section.png" alt="" fill priority className="object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#121212] to-transparent" />
          
          {/* Floating Back Button */}
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
                <p className="font-bold tracking-tight text-white">{date}</p>
                <p className="text-xs font-medium text-gray-400">{time}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/5 p-2.5 text-[#b594e6]">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold tracking-tight text-white">{event.hostel}</p>
                <p className="text-xs font-medium text-gray-400">
                  {event.roomNumber || `Floor ${event.floor}`}
                </p>
              </div>
            </div>
          </div>

          {/* ================= HOSTED BY CARD ================= */}
          <Link
            href={`/user/${encodeURIComponent(event.host.id)}`}
            className="mt-8 block w-full rounded-[24px] p-5 shadow-lg transition-transform active:scale-[0.99] select-none text-white relative overflow-hidden"
            style={{ backgroundColor: hostBgColor }}
          >
            <div
              className="absolute top-0 right-0 bg-white h-[44px] flex items-center justify-end pr-5 pl-10 rounded-tr-[24px] z-10 shadow-sm"
              style={{ clipPath: "polygon(0% 0, 100% 0, 100% 100%, 30% 100%)", color: hostBgColor }}
            >
              <div className="flex items-baseline gap-1 mt-1">
                <Star className="h-4 w-4 fill-current mb-0.5" />
                <span className="font-display text-2xl font-black leading-none">
                  {event.host.hostRating.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="flex flex-col z-10 relative">
              <span className="text-[11px] font-bold tracking-wider text-white/90 uppercase mb-1 drop-shadow-sm">
                Hosted by
              </span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black/20 border border-white/20 flex items-center justify-center text-xl shadow-inner shrink-0">
                  {event.host.pfp?.trim() ? event.host.pfp : event.host.displayName.charAt(0)}
                </div>
                <h3 className="font-display text-2xl font-black leading-none tracking-wide truncate pr-16">
                  {event.host.displayName}
                </h3>
              </div>
            </div>

            <div className="mt-5 relative z-10">
              <div className="w-1/3 h-px bg-white/50 mb-3" />
              <div className="flex items-center justify-between">
                <span className="font-display text-lg tracking-wide text-white drop-shadow-sm">View Profile</span>
                <div className="bg-[#121212] text-white px-5 py-1.5 rounded-xl shadow-xl flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>
            </div>
          </Link>

          {(error || notice) && (
            <p className={`mt-6 p-3 rounded-xl text-center text-sm font-bold border ${error ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
              {error || notice}
            </p>
          )}

          {/* ================= PARTICIPANT CONTROLS =================
              Hidden for the host. The host sees the Manage Attendees card
              and Live Controls below instead — the host must never be
              able to register for their own event. */}
          {!isHost && (
            <div className="mt-8 flex flex-col gap-3">
              {/* Register/Unregister Button.
                  Disabled (and the event is treated as "closed") when the
                  event is COMPLETED or CANCELLED. The host never sees
                  this block because of the surrounding !isHost gate. */}
              <button
                type="button"
                onClick={() => void (isRegistered ? unregister() : register())}
                disabled={(!isRegistered && !registrationOpen) || registering || event.status === "COMPLETED" || event.status === "CANCELLED"}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#c8aaf5] hover:bg-[#b894ec] font-display font-black text-xl tracking-wider text-[#2c124d] disabled:opacity-50 disabled:grayscale transition-all active:scale-[0.99] shadow-[0_4px_25px_rgba(155,114,207,0.3)]"
              >
                {registering
                  ? (isRegistered ? "Unregistering..." : "Registering...")
                  : event.status === "COMPLETED"
                  ? "Event Completed"
                  : event.status === "CANCELLED"
                  ? "Event Cancelled"
                  : isRegistered
                  ? "Unregister"
                  : registrationOpen
                  ? "Register"
                  : "Registration Closed"}
                <Zap className="h-5 w-5 stroke-[2.5]" />
              </button>

              {/* Review eligibility:
                  - Show the Submit Review button only for ATTENDED
                    participants once the event is COMPLETED.
                  - REGISTERED (event already COMPLETED): the host has not
                    marked attendance yet. Show a soft info message and
                    no clickable button.
                  - NO_SHOW or CANCELLED: not eligible. Show why.
                  - Event not COMPLETED: show a soft info message
                    ("Reviews open once the event is completed") so the
                    user understands when they can review. */}
              {event.status === "COMPLETED" &&
                (attendanceStatus === "REGISTERED" ? (
                  <div
                    role="status"
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 text-center text-sm font-semibold text-amber-300"
                  >
                    Attendance is pending. The host has not marked your attendance yet.
                  </div>
                ) : attendanceStatus === "NO_SHOW" || attendanceStatus === "CANCELLED" ? (
                  <div
                    role="status"
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-center text-sm font-semibold text-white/60"
                  >
                    Only attended participants can submit reviews.
                  </div>
                ) : attendanceStatus === "ATTENDED" ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/events/${params.id}/reviews`)}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#1e1e1e] hover:bg-white/10 text-white border border-white/10 font-display font-black text-xl tracking-wider transition-all active:scale-[0.99] shadow-md cursor-pointer"
                  >
                    Submit Review
                    <Pencil className="h-5 w-5 stroke-[2.5]" />
                  </button>
                ) : null)}

              {event.status !== "COMPLETED" &&
                (attendanceStatus === "REGISTERED" ||
                  attendanceStatus === "ATTENDED") && (
                  <div
                    role="status"
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-center text-sm font-semibold text-white/60"
                  >
                    Reviews open once the event is completed.
                  </div>
                )}
            </div>
          )}

          {/* ================= HOST CONTROLS ================= */}
          {isHost && (
            <div className="mt-8 flex flex-col gap-5">
              
              {/* Manage Attendees Card */}
              <Link
                href={`/events/${params.id}/participants`}
                className="block w-full rounded-[24px] p-5 shadow-lg transition-transform active:scale-[0.99] select-none text-white relative overflow-hidden"
                style={{ backgroundColor: manageAttendeesBgColor }}
              >
                <div
                  className="absolute top-0 right-0 bg-white h-[44px] flex items-center justify-end pr-5 pl-10 rounded-tr-[24px] z-10 shadow-sm"
                  style={{ clipPath: "polygon(0% 0, 100% 0, 100% 100%, 30% 100%)", color: manageAttendeesBgColor }}
                >
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-display text-2xl font-black leading-none">
                      {event.currentAttendees}
                    </span>
                    <span className="font-bold text-xs opacity-90 tracking-tighter">JOINED</span>
                  </div>
                </div>

                <div className="flex flex-col z-10 relative">
                  <span className="text-[11px] font-bold tracking-wider text-white/90 uppercase mb-1 drop-shadow-sm">
                    Event Management
                  </span>
                  <h3 className="font-display text-2xl font-black leading-none tracking-wide truncate">
                    Manage Attendees
                  </h3>
                </div>

                <div className="mt-6 relative z-10">
                  <div className="w-1/3 h-px bg-white/50 mb-3" />
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg tracking-wide text-white drop-shadow-sm">Mark Attendance</span>
                    <div className="bg-[#121212] text-white px-5 py-1.5 rounded-xl shadow-xl flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Start/Finish/Cancel Controls */}
              {(event.status === "UPCOMING" || event.status === "ACTIVE") && (
                <div 
                  className="relative w-full rounded-[24px] p-5 shadow-lg select-none text-white overflow-hidden border border-white/5 bg-[#1e1e1e]"
                >
                  {/* Top Right Ribbon (Dynamic Event Status) */}
                  <div
                    className="absolute top-0 right-0 bg-white h-[44px] flex items-center justify-end pr-5 pl-8 rounded-tr-[24px] z-10 shadow-sm"
                    style={{ clipPath: "polygon(0% 0, 100% 0, 100% 100%, 25% 100%)" }}
                  >
                    <div className="flex items-baseline gap-1 mt-1 text-[#1e1e1e]">
                      <span className="font-display text-lg font-black leading-none tracking-wide">
                        {event.status}
                      </span>
                    </div>
                  </div>

                  {/* Top Left: Title Structure */}
                  <div className="flex flex-col z-10 relative">
                    <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-1 drop-shadow-sm">
                      Action Center
                    </span>
                    <h3 className="font-display text-2xl font-black leading-none tracking-wide truncate">
                      Live Controls
                    </h3>
                  </div>

                  <div className="mt-5 relative z-10">
                    {/* The signature partial divider */}
                    <div className="w-1/3 h-px bg-white/10 mb-5" />
                    
                    <div className="flex flex-col gap-3">
                      {event.status === "UPCOMING" && (
                        <div>
                          <button
                            type="button"
                            disabled={!canStartEvent || statusUpdating}
                            onClick={() => void updateEventStatus("ACTIVE")}
                            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#10b981] hover:bg-[#059669] font-display font-black text-xl tracking-wider text-black disabled:opacity-40 disabled:grayscale transition-all active:scale-[0.99] shadow-[0_4px_20px_rgba(16,185,129,0.2)]"
                          >
                            {statusUpdating ? "Starting..." : "Start Event"}
                            <Zap className="h-5 w-5 stroke-[2.5]" />
                          </button>
                          {!canStartEvent && (
                            <p className="mt-3 text-xs text-gray-400 text-center font-medium">
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
                          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#c8aaf5] hover:bg-[#b894ec] font-display font-black text-xl tracking-wider text-[#2c124d] disabled:opacity-40 disabled:grayscale transition-all active:scale-[0.99] shadow-[0_4px_20px_rgba(200,170,245,0.3)]"
                        >
                          {statusUpdating ? "Finishing..." : "Finish Event"}
                          <Zap className="h-5 w-5 stroke-[2.5]" />
                        </button>
                      )}

                      {event.status === "UPCOMING" && (
                        <button
                          type="button"
                          disabled={statusUpdating}
                          onClick={() => {
                            if (window.confirm("Are you sure you want to cancel this event? This action cannot be undone.")) {
                              void updateEventStatus("CANCELLED");
                            }
                          }}
                          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 font-display font-black text-xl tracking-wider text-red-400 disabled:opacity-40 transition-all active:scale-[0.99]"
                        >
                          Cancel Event
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}