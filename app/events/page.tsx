// app/events/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Plus, Search, SlidersHorizontal } from "lucide-react";
import EventCard, { EventCardProps } from "../../components/event/EventCard";
import { eventApi, EventListItem, apiErrorMessage } from "../../lib/client-api";

// Palette mirrors the original EventCard design (violet, pink, ochre, blue).
// Mapping is stable per event id so the same event always shows the same color.
const CARD_PALETTE = [
  "#9474cc", // Muted Violet
  "#d95284", // Vibrant Pink
  "#c78d1a", // Ochre Yellow
  "#3d8ba8", // Steel Blue
];

function hashStringToIndex(input: string, modulo: number) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash % modulo;
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

function toCardProps(event: EventListItem): EventCardProps {
  return {
    title: event.name,
    host: event.host?.displayName ?? "Host",
    joinedCount: event.currentAttendees ?? 0,
    description: event.description ?? "",
    time: formatScheduledAt(event.scheduledAt),
    bgColor: CARD_PALETTE[hashStringToIndex(event.id, CARD_PALETTE.length)],
  };
}

const PAGE_LIMIT = 20;

export default function EventsFeedPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [page, setPage] = useState(1);
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
          append ? [...prev, ...response.events] : response.events
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
        setEvents((prev) => [...prev, ...response.events]);
        setHasMore(response.pagination.hasMore);
        setPage(next);
      })
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setIsLoadingMore(false));
  };

  const handleMakeEvent = () => {
    console.log("Trigger Make Event Flow");
  };

  const cardEvents = useMemo(() => events.map(toCardProps), [events]);

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
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 text-[#9b72cf] animate-spin" />
            <p className="text-gray-400 text-sm font-medium">Loading events...</p>
          </div>
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
    </main>
  );
}
