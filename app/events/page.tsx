// app/events/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Plus, Search, SlidersHorizontal, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import EventCard, { EventCardProps } from "../../components/event/EventCard";
import { EventListSkeleton } from "../../components/ui/SkeletonScreens";
import { ApiError, eventApi, EventListItem, apiErrorMessage, userApi } from "../../lib/client-api";
import { createClient } from "../../lib/supabase/client";
import {
  recordRegistered,
  setRegisteredEventIds as persistRegisteredEventIds,
} from "../../lib/registration-events";

// Card color tokens come from global.css (@theme). The order is deterministically
// shuffled once at module load so it looks random but stays stable across renders
// and reloads. Cards are then colored by their position in the section — NOT by
// the event id or host id — so every card follows a pleasing repeating cycle.
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

const EVENTS_FEED_COLOR_ORDER = shuffledStableOrder(0x7e8f9a0b);

function sortEventsForFeed(items: EventListItem[]) {
  const statusRank: Record<EventListItem["status"], number> = {
    ACTIVE: 0,
    UPCOMING: 1,
    COMPLETED: 2,
    CANCELLED: 3,
  };

  return [...items].sort((a, b) => {
    const statusDiff = statusRank[a.status] - statusRank[b.status];
    if (statusDiff !== 0) return statusDiff;

    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
  });
}

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
    bgColor: EVENTS_FEED_COLOR_ORDER[index % EVENTS_FEED_COLOR_ORDER.length],
    onJoin,
    joinLabel: isRegistered ? "Registered" : "Join!",
    statusLabel: event.status,
  };
}

const PAGE_LIMIT = 20;

function isAuthError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

export default function EventsFeedPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [registeredEventName, setRegisteredEventName] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 15000); // Check expiry every 15 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (registeredEventName) {
      const timer = setTimeout(() => {
        setRegisteredEventName(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [registeredEventName]);
  const [hasMore, setHasMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search box so we don't refetch on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  // Reset list whenever the search query changes.
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

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
        // this up immediately on navigation.
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

  // Fetch a page of events.
  useEffect(() => {
    let cancelled = false;

    async function loadPage(targetPage: number, append: boolean) {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsInitialLoading(true);
      }
      setError(null);

      try {
        const response = await eventApi.list({
          q: debouncedQuery || undefined,
          page: targetPage,
          limit: PAGE_LIMIT,
        });
        if (cancelled) return;

        setEvents((prev) =>
          sortEventsForFeed(append ? [...prev, ...response.events] : response.events)
        );
        setHasMore(response.pagination.hasMore);
        setPage(targetPage);
      } catch (err) {
        if (cancelled) return;
        setError(apiErrorMessage(err));
        if (!append) {
          setEvents([]);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) {
          setIsInitialLoading(false);
          setIsLoadingMore(false);
        }
      }
    }

    loadPage(1, false);
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore) return;
    const next = page + 1;
    setIsLoadingMore(true);
    setError(null);

    eventApi
      .list({
        q: debouncedQuery || undefined,
        page: next,
        limit: PAGE_LIMIT,
      })
      .then((response) => {
        setEvents((prev) => sortEventsForFeed([...prev, ...response.events]));
        setHasMore(response.pagination.hasMore);
        setPage(next);
      })
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setIsLoadingMore(false));
  };

  const router = useRouter();

  const requireLogin = async (): Promise<boolean> => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) return true;
    router.push("/login");
    return false;
  };

  const handleMakeEvent = async () => {
    if (!(await requireLogin())) return;
    router.push("/events/create");
  };

  const handleJoin = async (eventId: string, e: React.MouseEvent) => {
    if (!(await requireLogin())) return;
    try {
      setAuthError(null);
      await eventApi.register(eventId);
      const matchedEvent = events.find(evt => evt.id === eventId);
      setRegisteredEventName(matchedEvent?.name || "the event");
      setRegisteredEventIds((current) => {
        const next = new Set(current);
        next.add(eventId);
        return next;
      });
      // Notify other open pages (e.g. the event detail page).
      recordRegistered(eventId);
      setEvents((prev) =>
        prev.map((evt) =>
          evt.id === eventId
            ? { ...evt, currentAttendees: evt.currentAttendees + 1 }
            : evt
        )
      );
    } catch (err) {
      if (isAuthError(err)) {
        setAuthError(apiErrorMessage(err));
        return;
      }

      alert(apiErrorMessage(err));
    }
  };

  // Dynamically filter out completed/cancelled events that are older than 1 hour.
  // This handles client-side real-time expiry if the user stays on the page.
  const visibleEvents = useMemo(() => {
    const now = Date.now();
    const oneHourMs = 60 * 60 * 1000;
    return events.filter((event) => {
      if (event.status === "COMPLETED" || event.status === "CANCELLED") {
        if (!event.updatedAt) return true; // fallback
        const updatedTime = new Date(event.updatedAt).getTime();
        return now - updatedTime <= oneHourMs;
      }
      return true;
    });
  }, [events, tick]);

  const cardEvents = useMemo(
    () =>
      visibleEvents.map((event, idx) =>
        toCardProps(event, idx, handleJoin, registeredEventIds.has(event.id))
      ),
    [visibleEvents, handleJoin, registeredEventIds]
  );

  return (
    <main className="flex-1 relative bg-[#121212] min-h-screen px-5 pt-6 pb-28 flex flex-col select-none">

      {/* ================= TOP SEARCH BAR (Restored from Old Layout) ================= */}
      <div className="w-full bg-white rounded-full p-1.5 flex items-center justify-between mb-6 shadow-md border-2 border-white/90">
        <input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent text-black placeholder:text-gray-400 text-sm font-medium pl-4 pr-2 w-full focus:outline-none"
        />

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            className="p-2.5 text-gray-500 hover:text-black transition active:scale-95 cursor-pointer"
            aria-label="Filter events"
          >
            <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            type="button"
            className="w-10 h-10 bg-[#9b72cf] hover:bg-[#8a60be] rounded-full flex items-center justify-center text-white shadow-sm transition active:scale-95 cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Page Header */}
      <div className="mb-5">
        <h1 className="font-display text-3xl font-black text-white tracking-wide">
          Happening Soon
        </h1>
        <p className="text-gray-400 text-xs font-medium mt-1">
          Explore student-hosted meetups across campus
        </p>
      </div>

      {/* Stacked Horizontal Cards Feed */}
      <div className="flex flex-col gap-4">
        {isInitialLoading ? (
          <EventListSkeleton count={4} />
        ) : error && events.length === 0 ? (
          <div
            role="alert"
            className="flex flex-col items-center justify-center py-12 gap-3 text-center"
          >
            <AlertCircle className="w-7 h-7 text-red-400" />
            <p className="text-red-300 text-sm font-semibold">
              We couldn&apos;t load events.
            </p>
            <p className="text-gray-400 text-xs font-medium max-w-xs">
              {error}
            </p>
          </div>
        ) : cardEvents.length > 0 ? (
          <>
            {cardEvents.map((evt, idx) => (
              <EventCard key={`${evt.title}-${idx}`} {...evt} />
            ))}

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 text-red-300 text-xs font-medium px-2 py-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoadingMore && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {isLoadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm font-medium">
              {debouncedQuery
                ? `No events found matching "${debouncedQuery}"`
                : "No events yet. Be the first to host one!"}
            </p>
          </div>
        )}
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

      {authError && (
        <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 px-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="rounded-2xl border border-[#c8aaf5]/30 bg-[#1d1627] p-4 text-white shadow-2xl backdrop-blur-md">
            <p className="text-sm font-bold text-[#c8aaf5]">Login needed</p>
            <p className="mt-1 text-xs font-medium text-gray-300">{authError}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="flex-1 rounded-xl bg-[#c8aaf5] px-4 py-2.5 text-sm font-black text-[#2c124d] transition active:scale-[0.98]"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setAuthError(null)}
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
