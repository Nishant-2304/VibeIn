"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, X, Users, MapPin } from "lucide-react";
import {
  apiErrorMessage,
  eventApi,
  type EventDetail,
  type Registration,
} from "../../../../lib/client-api";

const PARTICIPANT_CARD_COLORS = [
  "var(--color-card-yellow)",
  "var(--color-card-purple)",
  "var(--color-card-blue)",
  "var(--color-card-pink)",
];

export default function EventParticipantsPage({
  params,
}: {
  params: { id: string };
}) {
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [eventData, registrationData] = await Promise.all([
          eventApi.get(params.id),
          eventApi.registrations(params.id),
        ]);

        if (!active) return;

        setEvent(eventData);
        setRegistrations(registrationData.registrations);
      } catch (error) {
        if (active) {
          setPageError(apiErrorMessage(error));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [params.id]);

  const stats = useMemo(() => {
    return {
      registered: registrations.filter(
        (r) => r.attendanceStatus === "REGISTERED"
      ).length,

      attended: registrations.filter(
        (r) => r.attendanceStatus === "ATTENDED"
      ).length,

      noShow: registrations.filter(
        (r) => r.attendanceStatus === "NO_SHOW"
      ).length,

      cancelled: registrations.filter(
        (r) => r.attendanceStatus === "CANCELLED"
      ).length,
    };
  }, [registrations]);

  async function markAttendance(
    userId: string,
    status: "ATTENDED" | "NO_SHOW"
  ) {
    setUpdatingUserId(userId);

    try {
      await eventApi.updateAttendance(params.id, userId, status);

      setRegistrations((current) =>
        current.map((registration) =>
          registration.user.id === userId
            ? {
                ...registration,
                attendanceStatus: status,
              }
            : registration
        )
      );
    } catch (error) {
      alert(apiErrorMessage(error));
    } finally {
      setUpdatingUserId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        Loading participants...
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        <p>{pageError || "Could not load participants."}</p>

        <Link
          href={`/events/${params.id}`}
          className="mt-5 inline-block text-[#b792ea]"
        >
          Back to Event
        </Link>
      </main>
    );
  }
    return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-md px-5 py-6 pb-10">

        <header className="flex items-center gap-4">
          <Link
            href={`/events/${params.id}`}
            aria-label="Back to event"
            className="rounded-full bg-[#171717] p-2.5 text-[#c9b0ff] transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="h-6 w-6 text-[#b792ea]" />
          </Link>

          <div>
            <h1 className="text-xl font-extrabold">
              Participants
            </h1>
            <p className="text-xs text-[#9ca3af] mt-0.5">
              Host Panel
            </p>
          </div>
        </header>

        {/* Redesigned Event Metadata Section mimicking Host Section on event detail page */}
        <section className="mt-6 flex items-center justify-between rounded-2xl bg-[#1c1c1e] border border-white/5 p-4">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-[#9ca3af]">Event Name</p>
            <h2 className="font-bold text-white text-base leading-snug mt-0.5">{event.name}</h2>
            <p className="mt-1 text-xs text-[#9ca3af] flex items-center gap-1">
              <MapPin className="h-3 w-3 text-[#b792ea]" />
              {event.hostel} • Floor {event.floor}{event.roomNumber ? ` • Room ${event.roomNumber}` : ""}
            </p>
          </div>
          <div className="rounded-full bg-[#b594e6]/10 border border-[#b594e6]/20 px-3.5 py-1.5 text-[10px] font-bold text-[#CAA6FF] tracking-wider uppercase shrink-0">
            {registrations.length} Joined
          </div>
        </section>

        {/* Redesigned Premium Stats Section mimicking Public Profile Ratings Row */}
        <section className="mt-5 grid grid-cols-2 gap-3">
          {/* Registered */}
          <div className="bg-[#1c1826] border border-[#b594e6]/30 rounded-2xl p-4 flex flex-col justify-between shadow-lg h-24">
            <span className="text-[10px] font-bold tracking-wider text-purple-300 uppercase block">
              Registered
            </span>
            <span 
              style={{ fontFamily: "'Jaro', sans-serif" }} 
              className="text-3xl font-black text-[#b594e6]"
            >
              {stats.registered}
            </span>
          </div>

          {/* Attended */}
          <div className="bg-[#12231b] border border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-lg h-24">
            <span className="text-[10px] font-bold tracking-wider text-emerald-300 uppercase block">
              Attended
            </span>
            <span 
              style={{ fontFamily: "'Jaro', sans-serif" }} 
              className="text-3xl font-black text-emerald-400"
            >
              {stats.attended}
            </span>
          </div>

          {/* No Show */}
          <div className="bg-[#241315] border border-red-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-lg h-24">
            <span className="text-[10px] font-bold tracking-wider text-red-300 uppercase block">
              No Show
            </span>
            <span 
              style={{ fontFamily: "'Jaro', sans-serif" }} 
              className="text-3xl font-black text-red-400"
            >
              {stats.noShow}
            </span>
          </div>

          {/* Cancelled */}
          <div className="bg-[#19191b] border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-lg h-24">
            <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase block">
              Cancelled
            </span>
            <span 
              style={{ fontFamily: "'Jaro', sans-serif" }} 
              className="text-3xl font-black text-gray-300"
            >
              {stats.cancelled}
            </span>
          </div>
        </section>

        {/* Redesigned Participants cards list cycling in card colors with dark text */}
        <section className="mt-8 space-y-4">
          {registrations.map((registration, idx) => {
            const pending = registration.attendanceStatus === "REGISTERED";
            const cardBg = PARTICIPANT_CARD_COLORS[idx % PARTICIPANT_CARD_COLORS.length];

            return (
              <article
                key={registration.id}
                style={{ backgroundColor: cardBg }}
                className="w-full rounded-2xl p-4 flex flex-col justify-between shadow-md transition-transform active:scale-[0.99] select-none text-[#1e1e1e]"
              >
                <div className="flex items-center justify-between w-full">
                  <Link
                    href={`/user/${registration.user.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/5 text-xl">
                      {registration.user.pfp?.trim()
                        ? registration.user.pfp
                        : registration.user.displayName.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="min-w-0">
                      <h3 className="font-bold text-base leading-snug truncate hover:underline">
                        {registration.user.displayName}
                      </h3>
                      <p className="text-xs font-semibold text-black/60 flex items-center gap-1 mt-0.5">
                        ⭐ {registration.user.participantRating.toFixed(1)}
                      </p>
                    </div>
                  </Link>

                  <div className="shrink-0">
                    {registration.attendanceStatus === "REGISTERED" && (
                      <span className="rounded-full bg-black/10 border border-black/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black/80">
                        Registered
                      </span>
                    )}
                    {registration.attendanceStatus === "ATTENDED" && (
                      <span className="rounded-full bg-emerald-950/10 border border-emerald-950/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                        Attended
                      </span>
                    )}
                    {registration.attendanceStatus === "NO_SHOW" && (
                      <span className="rounded-full bg-red-950/10 border border-red-950/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-900">
                        No Show
                      </span>
                    )}
                    {registration.attendanceStatus === "CANCELLED" && (
                      <span className="rounded-full bg-black/5 border border-black/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black/40">
                        Cancelled
                      </span>
                    )}
                  </div>
                </div>

                {pending && (
                  <div className="mt-3.5 grid grid-cols-2 gap-2 w-full pt-3.5 border-t border-black/10">
                    <button
                      type="button"
                      disabled={updatingUserId === registration.user.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        void markAttendance(registration.user.id, "ATTENDED");
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-black text-white text-xs font-bold py-2.5 transition hover:bg-neutral-800 disabled:opacity-50 cursor-pointer active:scale-95"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Attended
                    </button>

                    <button
                      type="button"
                      disabled={updatingUserId === registration.user.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        void markAttendance(registration.user.id, "NO_SHOW");
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-black/35 text-black bg-transparent text-xs font-bold py-2.5 transition hover:bg-black/5 disabled:opacity-50 cursor-pointer active:scale-95"
                    >
                      <X className="h-3.5 w-3.5" />
                      No Show
                    </button>
                  </div>
                )}
              </article>
            );
          })}

          {registrations.length === 0 && (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-[#171717] p-8 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-[#7d7d84]" />
              <p className="font-medium">
                Nobody has registered yet.
              </p>
              <p className="mt-2 text-sm text-[#9ca3af]">
                Once people register, they'll appear here.
              </p>
            </div>
          )}
        </section>

        {event.status === "COMPLETED" && (
          <Link
            href={`/events/${params.id}/participants/reviews`}
            className="mt-8 flex w-full items-center justify-center rounded-2xl bg-[#b792ea] py-4 font-semibold text-[#3b2466] hover:bg-[#a37dd6] transition active:scale-[0.98] cursor-pointer"
          >
            Review Participants
          </Link>
        )}

      </div>
    </main>
  );
}