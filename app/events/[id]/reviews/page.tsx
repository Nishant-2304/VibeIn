"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Send, Star } from "lucide-react";
import {
  apiErrorMessage,
  eventApi,
  type EventDetail,
} from "../../../../lib/client-api";

const stars = [1, 2, 3, 4, 5];

function Rating({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <p className="font-semibold">{label}</p>
      <div className="mt-3 flex gap-2">
        {stars.map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`${label}: ${star} star${star === 1 ? "" : "s"}`}
            className="rounded-full border border-white/10 bg-[#1c1c1e] p-2.5"
          >
            <Star className={`h-6 w-6 ${star <= value ? "fill-[#facc15] text-[#facc15]" : "text-white/25"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SubmitEventReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [eventRating, setEventRating] = useState(0);
  const [eventComment, setEventComment] = useState("");
  const [hostRating, setHostRating] = useState(0);
  const [hostComment, setHostComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    eventApi
      .get(params.id)
      .then((data) => {
        if (!active) return;
        setEvent(data);
        // Prevent duplicate submissions in the UI: if the loaded event
        // already has the current user's review attached, skip the form
        // and bounce straight back to the event page.
        if (data.reviews && data.reviews.length > 0) {
          setAlreadySubmitted(true);
        }
      })
      .catch((cause) => active && setError(apiErrorMessage(cause)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [params.id]);

  useEffect(() => {
    if (!loading && alreadySubmitted) {
      router.replace(`/events/${params.id}`);
    }
  }, [loading, alreadySubmitted, params.id, router]);

  async function submit() {
    setError(null);
    if (!eventRating || !hostRating) {
      setError("Rate both the event and the host before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      await eventApi.submitEventReview(params.id, {
        eventRating,
        eventComment: eventComment.trim() || undefined,
        hostRating,
        hostComment: hostComment.trim() || undefined,
      });
      router.replace(`/events/${params.id}`);
    } catch (cause) {
      setError(apiErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-md px-5 py-6 pb-10">
        <header className="flex items-center gap-3">
          <Link href={`/events/${params.id}`} aria-label="Back to event" className="rounded-full bg-[#171717] p-2.5 text-[#c9b0ff]">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-[22px] font-extrabold">Submit Review</h1>
        </header>

        {loading ? (
          <p className="mt-8 text-[#9ca3af]">Loading event…</p>
        ) : !event ? (
          <p className="mt-8 text-red-300">{error || "Event not found."}</p>
        ) : alreadySubmitted ? (
          // Brief intermediate state while the redirect runs.
          <p className="mt-8 text-[#9ca3af]">You’ve already reviewed this event. Redirecting…</p>
        ) : (
          <>
            <section className="mt-6 rounded-[28px] border border-white/10 bg-[#131313] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#9ca3af]">Reviewing</p>
              <h2 className="mt-1 text-xl font-bold">{event.name}</h2>
              <p className="mt-1 text-sm text-[#9ca3af]">Hosted by {event.host.displayName}</p>
              {event.status !== "COMPLETED" && (
                <p className="mt-4 text-sm text-amber-300">Reviews open after the event is completed.</p>
              )}
            </section>

            <section className="mt-6 space-y-7 rounded-[28px] border border-white/10 bg-[#131313] p-4">
              <Rating label="How was the event?" value={eventRating} onChange={setEventRating} />
              <label className="block text-sm">Event comment (optional)
                <textarea maxLength={500} rows={4} value={eventComment} onChange={(e) => setEventComment(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#1c1c1e] p-4 outline-none focus:border-[#b792ea]" />
                <span className="mt-1 block text-right text-xs text-[#9ca3af]">{eventComment.length}/500</span>
              </label>
              <Rating label={`How was ${event.host.displayName} as a host?`} value={hostRating} onChange={setHostRating} />
              <label className="block text-sm">Host comment (optional)
                <textarea maxLength={500} rows={4} value={hostComment} onChange={(e) => setHostComment(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#1c1c1e] p-4 outline-none focus:border-[#b792ea]" />
                <span className="mt-1 block text-right text-xs text-[#9ca3af]">{hostComment.length}/500</span>
              </label>
            </section>

            {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
            <button
              type="button"
              onClick={() => void submit()}
              disabled={submitting || event.status !== "COMPLETED"}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#b792ea] py-4 font-semibold text-[#3b2466] disabled:opacity-40"
            >
              {submitting ? "Submitting…" : "Submit both reviews"} <Send className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </main>
  );
}
