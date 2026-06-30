"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, X, Users } from "lucide-react";
import {
  apiErrorMessage,
  eventApi,
  type EventDetail,
  type Registration,
} from "../../../../lib/client-api";

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
          >
            <ArrowLeft className="text-[#b792ea]" />
          </Link>

          <div>
            <h1 className="text-xl font-extrabold">
              Participants
            </h1>

            <p className="text-sm text-[#9ca3af]">
              {event.name}
            </p>
          </div>
        </header>

        <section className="mt-6 rounded-[24px] border border-white/10 bg-[#171717] p-5">
          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-lg font-bold">
                {event.name}
              </h2>

              <p className="mt-1 text-sm text-[#9ca3af]">
                {event.hostel}
                {" • "}
                Floor {event.floor}
                {event.roomNumber
                  ? ` • Room ${event.roomNumber}`
                  : ""}
              </p>
            </div>

            <div className="rounded-full bg-[#b792ea]/15 px-4 py-2 text-sm font-semibold text-[#d7b9ff]">
              {registrations.length} Joined
            </div>

          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3">

          <div className="rounded-2xl bg-[#1b1b1d] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#7d7d84]">
              Registered
            </p>

            <p className="mt-2 text-2xl font-bold">
              {stats.registered}
            </p>
          </div>

          <div className="rounded-2xl bg-[#1b1b1d] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#7d7d84]">
              Attended
            </p>

            <p className="mt-2 text-2xl font-bold text-green-400">
              {stats.attended}
            </p>
          </div>

          <div className="rounded-2xl bg-[#1b1b1d] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#7d7d84]">
              No Show
            </p>

            <p className="mt-2 text-2xl font-bold text-red-400">
              {stats.noShow}
            </p>
          </div>

          <div className="rounded-2xl bg-[#1b1b1d] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#7d7d84]">
              Cancelled
            </p>

            <p className="mt-2 text-2xl font-bold text-[#9ca3af]">
              {stats.cancelled}
            </p>
          </div>

        </section>

        <section className="mt-8 space-y-4">

          {registrations.map((registration) => {

            const pending =
              registration.attendanceStatus === "REGISTERED";

            return (

              <article
                key={registration.id}
                className="rounded-[24px] border border-white/10 bg-[#242326] p-4"
              >

                <Link
                  href={`/user/${registration.user.id}`}
                  className="flex items-center justify-between"
                >

                  <div className="flex items-center gap-3">

                    <div className="flex h-13 w-13 items-center justify-center rounded-full border border-white/10 bg-[#171717] text-2xl">
  {registration.user.pfp?.trim()
    ? registration.user.pfp
    : registration.user.displayName.charAt(0).toUpperCase()}
</div>

                    <div>

                      <h3 className="font-semibold hover:text-[#b792ea]">

                        {registration.user.displayName}

                      </h3>

                      <p className="text-sm text-[#9ca3af]">

                        ⭐{" "}
                        {registration.user.participantRating.toFixed(
                          1
                        )}

                      </p>

                    </div>

                  </div>
                                    <div>

                    {registration.attendanceStatus === "REGISTERED" && (
                      <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
                        REGISTERED
                      </span>
                    )}

                    {registration.attendanceStatus === "ATTENDED" && (
                      <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-300">
                        ATTENDED
                      </span>
                    )}

                    {registration.attendanceStatus === "NO_SHOW" && (
                      <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-300">
                        NO SHOW
                      </span>
                    )}

                    {registration.attendanceStatus === "CANCELLED" && (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#9ca3af]">
                        CANCELLED
                      </span>
                    )}

                  </div>

                </Link>

                {pending && (
                  <div className="mt-5 grid grid-cols-2 gap-3">

                    <button
                      type="button"
                      disabled={updatingUserId === registration.user.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        void markAttendance(
                          registration.user.id,
                          "ATTENDED"
                        );
                      }}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-green-600 py-3 font-medium transition hover:bg-green-500 disabled:opacity-50"
                    >
                      <Check className="h-5 w-5" />
                      Attended
                    </button>

                    <button
                      type="button"
                      disabled={updatingUserId === registration.user.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        void markAttendance(
                          registration.user.id,
                          "NO_SHOW"
                        );
                      }}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 font-medium transition hover:bg-red-500 disabled:opacity-50"
                    >
                      <X className="h-5 w-5" />
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
            className="mt-8 flex w-full items-center justify-center rounded-2xl bg-[#b792ea] py-4 font-semibold text-[#3b2466]"
          >
            Review Participants
          </Link>
        )}

      </div>
    </main>
  );
}