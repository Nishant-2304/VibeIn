// app/page.tsx
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { AlertCircle, Bell, ChevronRight, Loader2, Plus, X, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EventCard, { EventCardProps } from "../components/event/EventCard";
import { eventApi, userApi, EventListItem, apiErrorMessage } from "../lib/client-api";

// Card color tokens come from global.css (@theme). Different sections can use
// different "random-looking" but stable orders. The seed is fixed per section
// so the order is the same on every render and reload.
const CARD_COLOR_VARS = [
  "var(--color-card-yellow)",
  "var(--color-card-purple)",
  "var(--color-card-blue)",
  "var(--color-card-pink)",
];

// Tiny seeded PRNG (mulberry32). Same seed => same sequence on every run.
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function next() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffledStableOrder(seed: number) {
  const rng = mulberry32(seed);
  const arr = [...CARD_COLOR_VARS];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const HAPPENING_NOW_COLOR_ORDER = shuffledStableOrder(0xa1b2c3d4);
const COMING_UP_COLOR_ORDER = shuffledStableOrder(0x5f6e7d8c);

function formatScheduledAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate();

  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (sameDay) return `Tonight, ${time}`;
  if (isTomorrow) return `Tomorrow, ${time}`;

  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
  return `${weekday}, ${time}`;
}

function toCardProps(
  event: EventListItem,
  colorOrder: readonly string[],
  index: number,
  onJoin: (id: string, e: React.MouseEvent) => void
): EventCardProps {
  return {
    id: event.id,
    title: event.name,
    host: event.host?.displayName ?? "Host",
    joinedCount: event.currentAttendees ?? 0,
    description: event.description ?? "",
    time: formatScheduledAt(event.scheduledAt),
    bgColor: colorOrder[index % colorOrder.length],
    onJoin,
  };
}

const EVENTS_PER_PAGE = 2;

export default function HomePage() {
  // Alert Banner State
  const [pendingCount, setPendingCount] = useState(2);
  const [registeredEventName, setRegisteredEventName] = useState<string | null>(null);

  useEffect(() => {
    if (registeredEventName) {
      const timer = setTimeout(() => {
        setRegisteredEventName(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [registeredEventName]);

  // Pagination State (for "Coming up")
  const [currentPage, setCurrentPage] = useState(0);

  // Current user pfp for top-right avatar
  const [myPfp, setMyPfp] = useState<string | null>(null);

  // Section data state
  const [happeningNow, setHappeningNow] = useState<EventListItem[]>([]);
  const [happeningNowLoading, setHappeningNowLoading] = useState(true);
  const [happeningNowError, setHappeningNowError] = useState<string | null>(null);

  const [comingUp, setComingUp] = useState<EventListItem[]>([]);
  const [comingUpLoading, setComingUpLoading] = useState(true);
  const [comingUpError, setComingUpError] = useState<string | null>(null);

  // Carousel Autoplay Refs & State
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch ACTIVE events for "Happening now"
  useEffect(() => {
    let cancelled = false;
    setHappeningNowLoading(true);
    setHappeningNowError(null);
    eventApi
      .list({ status: "ACTIVE", page: 1, limit: 20 })
      .then((response) => {
        if (cancelled) return;
        setHappeningNow(response.events);
      })
      .catch((err) => {
        if (cancelled) return;
        setHappeningNowError(apiErrorMessage(err));
        setHappeningNow([]);
      })
      .finally(() => {
        if (!cancelled) setHappeningNowLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch UPCOMING events for "Coming up"
  useEffect(() => {
    let cancelled = false;
    setComingUpLoading(true);
    setComingUpError(null);
    eventApi
      .list({ status: "UPCOMING", page: 1, limit: 20 })
      .then((response) => {
        if (cancelled) return;
        setComingUp(response.events);
      })
      .catch((err) => {
        if (cancelled) return;
        setComingUpError(apiErrorMessage(err));
        setComingUp([]);
      })
      .finally(() => {
        if (!cancelled) setComingUpLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the current page within bounds as the dataset changes.
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(comingUp.length / EVENTS_PER_PAGE));
    if (currentPage > totalPages - 1) {
      setCurrentPage(0);
    }
  }, [comingUp, currentPage]);

  // Fetch the current user once so the top-right avatar reflects their emoji.
  useEffect(() => {
    let cancelled = false;
    userApi
      .getMe()
      .then((me) => {
        if (cancelled) return;
        setMyPfp(me?.pfp ?? null);
      })
      .catch(() => {
        if (!cancelled) setMyPfp(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 1. Autoplay Carousel Logic (Scrolls every 3.5s unless touched)
  useEffect(() => {
    if (isPaused || !carouselRef.current) return;

    const interval = setInterval(() => {
      const el = carouselRef.current;
      if (!el) return;

      const cardWidth = 300; // approx card width + gap
      const maxScroll = el.scrollWidth - el.clientWidth;

      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: cardWidth, behavior: "smooth" });
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handleJoin = async (eventId: string, e: React.MouseEvent) => {
    try {
      await eventApi.register(eventId);
      const matchedEvent = happeningNow.find(evt => evt.id === eventId) || comingUp.find(evt => evt.id === eventId);
      setRegisteredEventName(matchedEvent?.name || "the event");
      const updateAttendees = (list: EventListItem[]) =>
        list.map((evt) =>
          evt.id === eventId
            ? { ...evt, currentAttendees: evt.currentAttendees + 1 }
            : evt
        );
      setHappeningNow(updateAttendees);
      setComingUp(updateAttendees);
    } catch (err) {
      alert(apiErrorMessage(err));
    }
  };

  // Build card props with stable per-section color cycles.
  const happeningNowCards = useMemo(
    () => happeningNow.map((e, i) => toCardProps(e, HAPPENING_NOW_COLOR_ORDER, i, handleJoin)),
    [happeningNow, handleJoin]
  );

  const totalPages = Math.max(1, Math.ceil(comingUp.length / EVENTS_PER_PAGE));
  const displayedComingUp = useMemo(() => {
    const start = currentPage * EVENTS_PER_PAGE;
    return comingUp
      .slice(start, start + EVENTS_PER_PAGE)
      .map((e, i) => toCardProps(e, COMING_UP_COLOR_ORDER, start + i, handleJoin));
  }, [comingUp, currentPage, handleJoin]);

  const router = useRouter();

  const handleMakeEvent = () => {
    router.push("/events/create");
  };

  return (
    <main className="flex-1 relative bg-[#121212] min-h-screen px-5 pt-6 pb-32 flex flex-col select-none overflow-x-hidden font-sans">

      {/* ================= TOP HEADER ================= */}
      <div className="w-full flex items-center justify-between mb-6">
        
        {/* Left Side: Clean Branding */}
        <span 
          style={{ fontFamily: "'Jaro', sans-serif" }} 
          className="text-3xl font-black tracking-wide text-white pt-1"
        >
          VibeIn
        </span>

        {/* Right Side: Profile Avatar (Clickable) */}
        <Link href="/profile" className="shrink-0">
          <div className="w-10 h-10 rounded-full bg-white text-black font-bold flex items-center justify-center text-lg shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer">
            {myPfp?.trim() ? myPfp : "😎"}
          </div>
        </Link>
        
      </div>

      {/* ================= CONDITIONAL ALERT BANNER ================= */}

{/* ================= SECTION 1: HAPPENING NOW (Centered Peeking Carousel) ================= */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-black text-white tracking-wide">
            Happening now
          </h2>
          <Link
            href="/events"
            className="text-[11px] font-bold tracking-wider text-gray-400 hover:text-white uppercase transition"
          >
            See All
          </Link>
        </div>

        {/* Carousel Container: Snap-Center + Padding to allow true viewport centering */}
        <div
          ref={carouselRef}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="flex gap-4 overflow-x-auto pb-4 pt-1 -mx-5 px-6 snap-x snap-mandatory scroll-pl-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {happeningNowLoading ? (
            <div className="w-full min-h-[210px] flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#9b72cf] animate-spin" />
            </div>
          ) : happeningNowError && happeningNow.length === 0 ? (
            <div
              role="alert"
              className="w-full min-h-[210px] flex flex-col items-center justify-center gap-2 py-8 text-center"
            >
              <AlertCircle className="w-6 h-6 text-red-400" />
              <p className="text-red-300 text-xs font-semibold">
                We couldn&apos;t load live events.
              </p>
              <p className="text-gray-400 text-[11px] font-medium max-w-xs">
                {happeningNowError}
              </p>
            </div>
          ) : happeningNowCards.length > 0 ? (
            <>
              {happeningNowCards.map((evt, idx) => (
                /* Fluid 82vw width ensures it centers on all mobile screen sizes */
                <div key={`${evt.title}-${idx}`} className="w-[82vw] max-w-[320px] shrink-0 snap-center first:pl-0">
                  <EventCard {...evt} />
                </div>
              ))}
              {/* Right spacer to ensure the final card can also snap dead-center */}
              <div className="w-2 shrink-0" />
            </>
          ) : (
            <div className="w-full min-h-[210px] flex items-center justify-center py-8">
              <p className="text-gray-500 text-sm font-medium">
                No live events right now. Check back soon!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ================= SECTION 2: COMING UP (Paginated) ================= */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-2xl font-black text-white tracking-wide">
            Coming up
          </h2>

          {/* Interactive Pagination Dots */}
          <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1.5 rounded-full">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentPage(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentPage === idx
                    ? "w-4 h-2 bg-[#c8aaf5]"
                    : "w-2 h-2 bg-white/20 hover:bg-white/40"
                }`}
                aria-label={`Go to page ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Vertical Feed: Render only current page slice */}
        <div className="flex flex-col gap-4 min-h-[380px] transition-opacity duration-200">
          {comingUpLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 text-[#9b72cf] animate-spin" />
              <p className="text-gray-400 text-xs font-medium">Loading upcoming events...</p>
            </div>
          ) : comingUpError && comingUp.length === 0 ? (
            <div
              role="alert"
              className="flex flex-col items-center justify-center py-12 gap-2 text-center"
            >
              <AlertCircle className="w-6 h-6 text-red-400" />
              <p className="text-red-300 text-xs font-semibold">
                We couldn&apos;t load upcoming events.
              </p>
              <p className="text-gray-400 text-[11px] font-medium max-w-xs">
                {comingUpError}
              </p>
            </div>
          ) : displayedComingUp.length > 0 ? (
            displayedComingUp.map((evt, idx) => (
              <EventCard key={`${evt.title}-${currentPage}-${idx}`} {...evt} />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm font-medium">
                No upcoming events yet. Be the first to host one!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Call-to-Action (+ Make event) */}
      <button
        type="button"
        onClick={handleMakeEvent}
        className="fixed bottom-24 right-6 z-30 bg-[#c8aaf5] hover:bg-[#b894ec] text-[#2c124d] font-display font-black text-base px-6 py-4 rounded-full shadow-[0_4px_25px_rgba(155,114,207,0.4)] flex items-center gap-2 transition-all active:scale-95 cursor-pointer border border-white/20"
      >
        <Plus className="w-5 h-5 stroke-[3]" />
        <span>Make event</span>
      </button>

      {/* Success Confirmation Toast */}
      {registeredEventName && (
        <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 px-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-[#12231b] p-4 text-white shadow-2xl backdrop-blur-md">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <Check className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-emerald-400">Successfully Registered!</h4>
              <p className="text-xs text-gray-300 truncate mt-0.5">You are going to: {registeredEventName}</p>
            </div>
            <button 
              type="button" 
              onClick={() => setRegisteredEventName(null)}
              className="text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
