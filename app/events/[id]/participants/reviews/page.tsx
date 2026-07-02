"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import {
  apiErrorMessage,
  eventApi,
  type EventDetail,
  type Registration,
} from "../../../../../lib/client-api";

type Draft = { rating: number; comment: string };

export default function SubmitParticipantReviewsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pageError, setPageError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([eventApi.get(params.id), eventApi.registrations(params.id)])
      .then(([eventData, registrationData]) => {
        if (!active) return;
        const eligible = registrationData.registrations.filter((registration) =>
          registration.attendanceStatus === "ATTENDED" ||
          registration.attendanceStatus === "NO_SHOW"
        );
        setEvent(eventData);
        setRegistrations(eligible);
        setDrafts(Object.fromEntries(eligible.map(({ user }) => [user.id, { rating: 0, comment: "" }])));
      })
      .catch((cause) => active && setPageError(apiErrorMessage(cause)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [params.id]);

  function changeDraft(userId: string, patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [userId]: { ...current[userId], ...patch },
    }));
  }

  async function submitReview(userId: string) {
    const draft = drafts[userId];
    if (!draft?.rating) {
      setErrors((current) => ({ ...current, [userId]: "Choose a rating first." }));
      return;
    }

    setSubmitting((current) => ({ ...current, [userId]: true }));
    setErrors((current) => ({ ...current, [userId]: "" }));
    try {
      await eventApi.submitParticipantReview(params.id, userId, {
        rating: draft.rating,
        comment: draft.comment.trim() || undefined,
      });
      setSubmitted((current) => ({ ...current, [userId]: true }));
      router.replace(`/events/${params.id}`);
    } catch (cause) {
      setErrors((current) => ({ ...current, [userId]: apiErrorMessage(cause) }));
    } finally {
      setSubmitting((current) => ({ ...current, [userId]: false }));
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-md px-5 py-6 pb-10">
        <header className="flex items-center gap-4">
          <Link href={`/events/${params.id}`} aria-label="Back to event"><ArrowLeft className="text-[#b792ea]" /></Link>
          <div>
            <h1 className="text-xl font-extrabold">Review participants</h1>
            {event && <p className="text-sm text-[#9ca3af]">{event.name}</p>}
          </div>
        </header>

        {loading && <p className="mt-8 text-[#9ca3af]">Loading participants…</p>}
        {pageError && <p role="alert" className="mt-8 text-red-300">{pageError}</p>}
        {!loading && !pageError && registrations.length === 0 && (
          <p className="mt-8 rounded-2xl bg-[#171717] p-4 text-[#9ca3af]">No attended or no-show participants are ready for review.</p>
        )}

        <section className="mt-8 space-y-5">
          {registrations.map((registration) => {
            const draft = drafts[registration.user.id] || { rating: 0, comment: "" };
            const done = submitted[registration.user.id];
            return (
              <article
                key={registration.id}
                className="rounded-[24px] border border-white/10 p-5 bg-[#131313] shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{registration.user.displayName}</h2>
                    <p className="text-xs font-semibold text-[#a78bfa]">{registration.attendanceStatus === "NO_SHOW" ? "No show" : "Attended"}</p>
                  </div>
                  <span className="text-xs text-[#9ca3af] font-medium">Community {registration.user.participantRating.toFixed(1)}</span>
                </div>

                <div className="mt-4 flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button key={rating} type="button" disabled={done} onClick={() => changeDraft(registration.user.id, { rating })} aria-label={`Rate ${registration.user.displayName} ${rating} stars`}>
                      <Star
                        className={`h-7 w-7 ${rating <= draft.rating ? "fill-current text-[#facc15]" : "text-white/20"}`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  maxLength={500}
                  disabled={done}
                  value={draft.comment}
                  onChange={(e) => changeDraft(registration.user.id, { comment: e.target.value })}
                  placeholder="Optional comment"
                  rows={3}
                  className="mt-4 w-full rounded-2xl border border-white/10 bg-[#1c1c1e] p-4 outline-none focus:border-[#b792ea] disabled:opacity-50 text-white placeholder-white/20 text-sm font-medium"
                />
                {errors[registration.user.id] && <p className="mt-2 text-sm text-red-300">{errors[registration.user.id]}</p>}
                <button
                  type="button"
                  disabled={done || submitting[registration.user.id]}
                  onClick={() => void submitReview(registration.user.id)}
                  className="mt-4 w-full rounded-2xl bg-[#b792ea] py-3 font-semibold text-[#3c235f] disabled:opacity-50 transition active:scale-[0.98] cursor-pointer"
                >
                  {done ? "Review submitted" : submitting[registration.user.id] ? "Submitting…" : "Submit review"}
                </button>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
