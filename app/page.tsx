// app/page.tsx
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { AlertCircle, ChevronRight, Plus, X, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EventCard, { EventCardProps } from "../components/event/EventCard";
import { EventCardSkeleton } from "../components/ui/SkeletonScreens";
import { ApiError, eventApi, userApi, EventListItem, apiErrorMessage } from "../lib/client-api";
import { createClient } from "../lib/supabase/client";
import { recordRegistered, setRegisteredEventIds as persistRegisteredEventIds } from "../lib/registration-events";

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
  onJoin: (id: string, e: React.MouseEvent) => void,
  isRegistered: boolean
): EventCardProps {
  return {
    id: event.id,
    title: event.name,
    host: event.host?.displayName ?? "Host",
    joinedCount: event.currentAttendees ?? 0,
    maxAttendees: event.maxAttendees,
    description: event.description ?? "",
    time: formatScheduledAt(event.scheduledAt),
    bgColor: colorOrder[index % colorOrder.length],
    onJoin,
    joinLabel: isRegistered ? "Registered" : "Join!",
    statusLabel: event.status,
  };
}

const EVENTS_PER_PAGE = 2;

function isAuthError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

export default function HomePage() {
  // Alert Banner State
  const [pendingCount, setPendingCount] = useState(2);
  const [registeredEventName, setRegisteredEventName] = useState<string | null>(null);
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (registeredEventName) {
      const timer = setTimeout(() => {
        setRegisteredEventName(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [registeredEventName]);

  // Coming-up horizontal scroll: active page is driven by the scroll
  // position itself (see the scroll listener below), so we don't track
  // a separate "currentPage" state — the dots jump-scroll to a target,
  // and the listener snaps the indicator to whatever page is visible.

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

  // Coming-up horizontal scroll ref + dot indicator
  const comingUpScrollRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);

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

  // Sync the active horizontal-scroll page index with the underlying
  // scroll position so the dots reflect whatever page the user swiped to.
  useEffect(() => {
    const el = comingUpScrollRef.current;
    if (!el) return;
    const totalPages = Math.max(1, Math.ceil(comingUp.length / EVENTS_PER_PAGE));
    const onScroll = () => {
      const page = Math.round(el.scrollLeft / el.clientWidth);
      const clamped = Math.min(Math.max(page, 0), totalPages - 1);
      setActivePage((prev) => (prev === clamped ? prev : clamped));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [comingUp]);

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

  useEffect(() => {
    let cancelled = false;

    userApi
      .getMyEvents({ role: "attending" })
      .then((response) => {
        if (cancelled) return;
        const ids = new Set(
          (response.attending ?? [])
            .filter((event) => {
              const status =
                event.attendanceStatus ??
                (event as { attendance_status?: string }).attendance_status;
              return status !== "CANCELLED";
            })
            .map((event) => event.id)
        );
        setRegisteredEventIds(ids);
        // Seed the cross-page store so the event detail page can pick
        // this up immediately on navigation without a network round-trip.
        persistRegisteredEventIds(ids);
      })
      .catch(() => {
        if (!cancelled) {
          setRegisteredEventIds(new Set());
        }
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

  const requireLogin = async (): Promise<boolean> => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) return true;
    router.push("/login");
    return false;
  };

  const handleJoin = async (eventId: string, e: React.MouseEvent) => {
    if (!(await requireLogin())) return;
    try {
      setAuthError(null);
      await eventApi.register(eventId);
      const matchedEvent = happeningNow.find(evt => evt.id === eventId) || comingUp.find(evt => evt.id === eventId);
      setRegisteredEventName(matchedEvent?.name || "the event");
      setRegisteredEventIds((current) => {
        const next = new Set(current);
        next.add(eventId);
        return next;
      });
      // Notify any other open page (e.g. the event detail page) so it can
      // immediately reflect the new registration state without waiting for
      // its own re-fetch.
      recordRegistered(eventId);
      const updateAttendees = (list: EventListItem[]) =>
        list.map((evt) =>
          evt.id === eventId
            ? { ...evt, currentAttendees: evt.currentAttendees + 1 }
            : evt
        );
      setHappeningNow(updateAttendees);
      setComingUp(updateAttendees);
    } catch (err) {
      if (isAuthError(err)) {
        setAuthError(apiErrorMessage(err));
        return;
      }

      alert(apiErrorMessage(err));
    }
  };

  // Build card props with stable per-section color cycles.
  const happeningNowCards = useMemo(
    () =>
      happeningNow.map((e, i) =>
        toCardProps(e, HAPPENING_NOW_COLOR_ORDER, i, handleJoin, registeredEventIds.has(e.id))
      ),
    [happeningNow, handleJoin, registeredEventIds]
  );

  const totalPages = Math.max(1, Math.ceil(comingUp.length / EVENTS_PER_PAGE));
  const comingUpCards = useMemo(
    () =>
      comingUp.map((e, i) =>
        toCardProps(e, COMING_UP_COLOR_ORDER, i, handleJoin, registeredEventIds.has(e.id))
      ),
    [comingUp, handleJoin, registeredEventIds]
  );

  const router = useRouter();

  const handleMakeEvent = async () => {
    if (!(await requireLogin())) return;
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
            <div className="w-[82vw] max-w-[320px] shrink-0 snap-center">
              <EventCardSkeleton showAvatars={false} />
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

      {/* ================= SECTION 2: COMING UP (Horizontal Scroll) ================= */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-2xl font-black text-white tracking-wide">
            Coming up
          </h2>

          {/* Interactive Pagination Dots — tap to jump to that page */}
          <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1.5 rounded-full">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  const el = comingUpScrollRef.current;
                  if (el) {
                    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
                  }
                }}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  activePage === idx
                    ? "w-4 h-2 bg-[#c8aaf5]"
                    : "w-2 h-2 bg-white/20 hover:bg-white/40"
                }`}
                aria-label={`Go to page ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Page indicator note */}
        <p className="text-[11px] font-medium text-gray-500 -mt-3">
          {activePage + 1}/{totalPages} pages · swipe to browse
        </p>

        {/* Horizontal scroll feed. Each "page" of EVENTS_PER_PAGE events
            fills the viewport width; scroll-snap makes swipes land cleanly
            on the next page. Touch users scroll naturally, the dot indicator
            stays in sync via the scroll listener above. */}
        <div className="overflow-hidden">
          <div
            ref={comingUpScrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden -mx-5"
          >
            {comingUpLoading ? (
              Array.from({ length: totalPages }).map((_, pageIdx) => (
                <div
                  key={`skel-page-${pageIdx}`}
                  className="w-full shrink-0 snap-start px-5"
                >
                  <div className="flex flex-col gap-4 min-h-[380px]">
                    <EventCardSkeleton showAvatars={false} />
                    <EventCardSkeleton showAvatars={false} />
                  </div>
                </div>
              ))
            ) : comingUpError && comingUpCards.length === 0 ? (
              <div className="w-full shrink-0 snap-start px-5">
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
              </div>
            ) : comingUpCards.length > 0 ? (
              Array.from({ length: totalPages }).map((_, pageIdx) => {
                const start = pageIdx * EVENTS_PER_PAGE;
                const pageItems = comingUpCards.slice(start, start + EVENTS_PER_PAGE);
                return (
                  <div
                    key={`page-${pageIdx}`}
                    className="w-full shrink-0 snap-start px-5"
                  >
                    <div className="flex flex-col gap-4 min-h-[380px]">
                      {pageItems.map((evt, idx) => (
                        <EventCard
                          key={`${evt.title}-${pageIdx}-${idx}`}
                          {...evt}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="w-full shrink-0 snap-start px-5">
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm font-medium">
                    No upcoming events yet. Be the first to host one!
                  </p>
                </div>
              </div>
            )}
          </div>
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
