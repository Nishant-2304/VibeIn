"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, Star, Zap, ArrowLeft, Pencil, ArrowRight, MessageSquare } from "lucide-react";
import { EventDetailSkeleton } from "../../../components/ui/SkeletonScreens";
import { createClient } from "../../../lib/supabase/client";
import {
  ApiError,
  apiErrorMessage,
  eventApi,
  type EventDetail,
} from "../../../lib/client-api";
import {
  getRegisteredEventIds,
  recordRegistered,
  recordUnregistered,
  subscribeRegistrationChanges,
} from "../../../lib/registration-events";

function isAuthError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [registering, setRegistering] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [errorNeedsLogin, setErrorNeedsLogin] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  
  const [attendanceStatus, setAttendanceStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);
    setErrorNeedsLogin(false);

    const supabase = createClient();

    // If the user just registered for this event on another page
    // (e.g. the home feed) before navigating here, the home page's
    // `recordRegistered` call has already persisted that to sessionStorage.
    // Apply it optimistically so the page doesn't briefly show "Register"
    // while the server fetch is still in flight.
    const previouslyRegistered = getRegisteredEventIds().has(id);
    if (previouslyRegistered) {
      setIsRegistered(true);
      setAttendanceStatus("REGISTERED");
    }

    async function loadData() {
      try {
        const eventData = await eventApi.get(id);
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
                  id,
                  session.user.id
                );

              if (active) {
                setAttendanceStatus(registration.attendanceStatus);
                setIsRegistered(
                  registration.attendanceStatus === "REGISTERED" ||
                  registration.attendanceStatus === "ATTENDED"
                );
              }
            } catch {
              // getRegistration 404s when the user isn't registered. Keep
              // the optimistic value from sessionStorage if we had one;
              // otherwise fall back to "not registered".
              if (active && !previouslyRegistered) {
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

    // React in real time when the user registers/unregisters on another
    // open page (e.g. the home feed) while this page is mounted.
    const unsubscribe = subscribeRegistrationChanges((change) => {
      if (!active) return;
      if (change.eventId !== id) return;
      if (change.type === "registered") {
        setIsRegistered(true);
        setAttendanceStatus("REGISTERED");
        setEvent((current) =>
          current
            ? { ...current, currentAttendees: current.currentAttendees + 1 }
            : current
        );
      } else {
        setIsRegistered(false);
        setAttendanceStatus(null);
        setEvent((current) =>
          current
            ? {
                ...current,
                currentAttendees: Math.max(0, current.currentAttendees - 1),
              }
            : current
        );
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [id]);

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

  const hideRoomNumberBecauseFull =
    !!event &&
    event.status !== "COMPLETED" &&
    event.currentAttendees >= event.maxAttendees;

  const isOnline = event?.hostel === "ONLINE";
  const isOffline = typeof event?.hostel === "string" && event.hostel.startsWith("OFFLINE-");

  const locationDetail =
    event?.roomNumber && !hideRoomNumberBecauseFull
      ? event.roomNumber
      : event
      ? `Floor ${event.floor}`
      : "";

  const offlineAudienceLabel =
    event?.hostel === "OFFLINE-CO_ED"
      ? "Co-ed"
      : event?.hostel === "OFFLINE-YOUR_GENDER"
        ? "Your Gender"
        : null;

  const hostBgColor = "#9474cc";
  const manageAttendeesBgColor = "#3d8ba8";
  
  async function register() {
    if (isHost) {
      setError("Hosts cannot register for their own event.");
      return;
    }

    if (!currentUser) {
      router.push("/login");
      return;
    }

    setRegistering(true);
    setError(null);
    setErrorNeedsLogin(false);
    setNotice(null);

    try {
      await eventApi.register(id);

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
      // Persist + broadcast so any other open page sees the change too.
      recordRegistered(id);
    } catch (cause) {
      // If the user was actually already registered (race: another tab
      // registered first), the server returns 409. Treat that as success
      // so the UI snaps to the correct state and we don't show a confusing
      // "already registered" error.
      if (
        cause instanceof ApiError &&
        (cause.status === 409 ||
          cause.message?.toLowerCase().includes("already registered"))
      ) {
        setIsRegistered(true);
        setAttendanceStatus("REGISTERED");
        setError(null);
        setErrorNeedsLogin(false);
        recordRegistered(id);
      } else {
        setError(apiErrorMessage(cause));
        setErrorNeedsLogin(isAuthError(cause));
      }
    } finally {
      setRegistering(false);
    }
  }

  async function unregister() {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    setRegistering(true);
    setError(null);
    setErrorNeedsLogin(false);
    setNotice(null);

    try {
      await eventApi.unregister(id);

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
      recordUnregistered(id);
    } catch (cause) {
      setError(apiErrorMessage(cause));
      setErrorNeedsLogin(isAuthError(cause));
    } finally {
      setRegistering(false);
    }
  }

  async function updateEventStatus(
    newStatus: "ACTIVE" | "COMPLETED" | "CANCELLED"
  ) {
    setStatusUpdating(true);
    setError(null);
    setErrorNeedsLogin(false);
    setNotice(null);

    try {
      const updatedEvent = await eventApi.updateStatus(
        id,
        newStatus
      );

      setEvent(updatedEvent);

      if (newStatus === "CANCELLED") {
        setNotice("Event cancelled.");
      } else if (newStatus === "ACTIVE") {
        setNotice("Event started.");
      } else if (newStatus === "COMPLETED") {
        router.push(
          `/events/${id}/participants/reviews`
        );
      }
    } catch (cause) {
      setError(apiErrorMessage(cause));
      setErrorNeedsLogin(isAuthError(cause));
    } finally {
      setStatusUpdating(false);
    }
  }

  if (loading) {
    return <EventDetailSkeleton />;
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

            {isOnline && event.roomNumber ? (
              <a
                href={event.roomNumber.startsWith("http") ? event.roomNumber : `https://${event.roomNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full p-2.5 -m-2.5 rounded-2xl hover:bg-white/5 active:scale-[0.99] transition-all cursor-pointer group"
              >
                <div className="rounded-xl bg-[#c8aaf5]/10 p-2.5 text-[#b792ea] group-hover:bg-[#c8aaf5]/20 transition-colors">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold tracking-tight text-[#b792ea] flex items-center gap-1.5">
                    ONLINE EVENT
                    <span className="text-[10px] font-black tracking-wider bg-[#b792ea]/20 text-[#c8aaf5] px-1.5 py-0.5 rounded-md uppercase">
                      Open Link ↗
                    </span>
                  </p>
                  <p className="text-xs font-medium text-gray-400 truncate pr-4 underline decoration-gray-600 group-hover:text-gray-300">
                    {event.roomNumber}
                  </p>
                </div>
              </a>
            ) : isOnline ? (
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#c8aaf5]/10 p-2.5 text-[#b792ea]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold tracking-tight text-[#b792ea]">ONLINE EVENT</p>
                  <p className="text-xs font-medium text-gray-400">
                    {isRegistered
                      ? "Access link will be available when registration opens."
                      : "Register to get the access link."}
                  </p>
                </div>
              </div>
            ) : isOffline ? (
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/5 p-2.5 text-[#b594e6]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold tracking-tight text-[#b792ea]">OFFLINE CAMPUS EVENT</p>
                  <p className="text-xs font-medium text-gray-400">{offlineAudienceLabel ?? "Campus event"}</p>
                  <p className="text-xs font-medium text-gray-400">{locationDetail}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/5 p-2.5 text-[#b594e6]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold tracking-tight text-white">{event.hostel}</p>
                  <p className="text-xs font-medium text-gray-400">{locationDetail}</p>
                  {hideRoomNumberBecauseFull && (
                    <p className="mt-1 text-[11px] font-semibold text-[#c8aaf5]">
                      Can&apos;t see room number because event is full.
                    </p>
                  )}
                </div>
              </div>
            )}
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
            <div className={`mt-6 rounded-xl border p-3 text-center text-sm font-bold ${error ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
              <p>{error || notice}</p>
              {errorNeedsLogin && (
                <Link
                  href="/login"
                  className="mt-3 inline-flex h-11 min-w-32 items-center justify-center rounded-xl bg-[#c8aaf5] px-5 font-display text-base font-black tracking-wide text-[#2c124d] shadow-[0_4px_20px_rgba(200,170,245,0.25)] transition active:scale-[0.98]"
                >
                  Login
                </Link>
              )}
            </div>
          )}

          {/* ================= PARTICIPANT CONTROLS ================= */}
          {!isHost && (
            <div className="mt-8 flex flex-col gap-3">
              {/* 💡 CHAT ACTION LAYER: Automatically presents the chat gateway button once registered */}
              {isRegistered && (event.status === "UPCOMING" || event.status === "ACTIVE") ? (
                <div className="flex flex-col gap-2.5">
                  <Link
                    href={`/events/${id}/chat`}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#b792ea] hover:bg-[#a67fd3] font-display font-black text-xl tracking-wider text-black transition-all active:scale-[0.99] shadow-[0_4px_25px_rgba(183,146,234,0.3)]"
                  >
                    Join Group Chat
                    <MessageSquare className="h-5 w-5 fill-current" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => void unregister()}
                    disabled={registering}
                    className="text-xs text-red-400/60 hover:text-red-400 font-semibold tracking-wide py-2 transition active:scale-95"
                  >
                    Leave Event & Chat
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void register()}
                  disabled={!registrationOpen || registering || event.status === "COMPLETED" || event.status === "CANCELLED"}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#c8aaf5] hover:bg-[#b894ec] font-display font-black text-xl tracking-wider text-[#2c124d] disabled:opacity-50 disabled:grayscale transition-all active:scale-[0.99] shadow-[0_4px_25px_rgba(155,114,207,0.3)]"
                >
                  {registering
                    ? "Registering..."
                    : event.status === "COMPLETED"
                    ? "Event Completed"
                    : event.status === "CANCELLED"
                    ? "Event Cancelled"
                    : registrationOpen
                    ? "Register"
                    : "Registration Closed"}
                  <Zap className="h-5 w-5 stroke-[2.5]" />
                </button>
              )}

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
                    onClick={() => router.push(`/events/${id}/reviews`)}
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
                href={`/events/${id}/participants`}
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
                      <span className="text-base font-black opacity-80">/{event.maxAttendees}</span>
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
                  className="relative w-full rounded-[24px] p-5 shadow-lg select-none text-white overflow-hidden border border-[#9474cc]/30 bg-[#231b2e]"
                >
                  <div
                    className="absolute top-0 right-0 bg-[#c8aaf5] h-[44px] flex items-center justify-end pr-5 pl-8 rounded-tr-[24px] z-10 shadow-sm"
                    style={{ clipPath: "polygon(0% 0, 100% 0, 100% 100%, 25% 100%)" }}
                  >
                    <div className="flex items-baseline gap-1 mt-1 text-[#2c124d]">
                      <span className="font-display text-lg font-black leading-none tracking-wide">
                        {event.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col z-10 relative">
                    <span className="text-[11px] font-bold tracking-wider text-[#c8aaf5] uppercase mb-1 drop-shadow-sm">
                      Action Center
                    </span>
                    <h3 className="font-display text-2xl font-black leading-none tracking-wide truncate">
                      Live Controls
                    </h3>
                  </div>

                  <div className="mt-5 relative z-10">
                    <div className="w-1/3 h-px bg-[#c8aaf5]/30 mb-5" />
                    
                    <div className="flex flex-col gap-3">
                      {/* 💡 HOST CHAT GATEWAY: Renders a dedicated button for the host since they are always room admins */}
                      <Link
                        href={`/events/${id}/chat`}
                        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-[#b792ea]/40 bg-[#b792ea]/10 hover:bg-[#b792ea]/20 font-display font-black text-xl tracking-wider text-[#c8aaf5] transition-all active:scale-[0.99] shadow-sm mb-1"
                      >
                        Open Event Chat
                        <MessageSquare className="h-5 w-5" />
                      </Link>

                      {event.status === "UPCOMING" && (
                        <div>
                          <button
                            type="button"
                            disabled={!canStartEvent || statusUpdating}
                            onClick={() => void updateEventStatus("ACTIVE")}
                            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#3d8ba8] hover:bg-[#347992] font-display font-black text-xl tracking-wider text-white disabled:opacity-40 disabled:grayscale transition-all active:scale-[0.99] shadow-[0_4px_20px_rgba(61,139,168,0.25)]"
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
