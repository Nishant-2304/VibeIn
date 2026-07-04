// app/profile/events/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, AlertCircle } from "lucide-react";
import MyEventCard, {
  MyEventCardProps,
} from "../../../components/event/MyEventCard";
import { EventListSkeleton } from "../../../components/ui/SkeletonScreens";
import {
  apiErrorMessage,
  MyEventItem,
  userApi,
} from "../../../lib/client-api";

type Tab = "HOSTED" | "ATTENDED";
type SubFilter = "UPCOMING" | "ACTIVE" | "COMPLETED";

const CARD_COLOR_VARS = [
  "var(--color-card-yellow)",
  "var(--color-card-purple)",
  "var(--color-card-blue)",
  "var(--color-card-pink)",
];

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

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

const MY_EVENTS_COLOR_ORDER = shuffledStableOrder(0xc1d2e3f4);

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

  const weekday = date.toLocaleDateString(undefined, {
    weekday: "short",
  });

  return `${weekday}, ${time}`;
}

function toCardProps(
  event: MyEventItem,
  index: number,
  hosted: boolean
): MyEventCardProps {
  const participants = event.participants ?? [];

  return {
    id: event.id,
    title: event.eventname,
    time: formatScheduledAt(event.event_time),
    joinedCount: `${participants.length || event._count?.participants || 0} Joined`,
    roleBadge: hosted ? "HOST" : "ATTENDING",
    actionText: hosted ? "Manage" : "View Details",
    // Host → manage participants; attendee → view event details. The card
    // body itself still navigates to the event detail page on a generic tap.
    actionHref: hosted
      ? `/events/${encodeURIComponent(event.id)}/participants`
      : `/events/${encodeURIComponent(event.id)}`,
    bgColor:
      MY_EVENTS_COLOR_ORDER[index % MY_EVENTS_COLOR_ORDER.length],
    avatars: participants.map((participant) => ({
      id: participant.user.id,
      name: participant.user.username,
      pfp: participant.user.pfp,
    })),
  };
}

export default function MyEventsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("HOSTED");
  const [subFilter, setSubFilter] = useState<SubFilter>("UPCOMING");

  const [hosting, setHosting] = useState<MyEventItem[]>([]);
  const [attending, setAttending] = useState<MyEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myPfp, setMyPfp] = useState<string | null>(null);

  const router = useRouter();

  const handleMakeEvent = () => {
    router.push("/events/create");
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    userApi
      .getMyEvents()
      .then((response) => {
        if (cancelled) return;
        setHosting(response.hosting ?? []);
        setAttending(response.attending ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(apiErrorMessage(err));
        setHosting([]);
        setAttending([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

  const filtered = useMemo(() => {
    const source = activeTab === "HOSTED" ? hosting : attending;
    return source.filter((event) => event.event_status === subFilter);
  }, [activeTab, hosting, attending, subFilter]);

  const cards = useMemo(
    () =>
      filtered.map((event, idx) =>
        toCardProps(event, idx, activeTab === "HOSTED")
      ),
    [filtered, activeTab]
  );

  return (
    <main className="flex-1 relative bg-[#121212] min-h-screen px-5 pt-6 pb-32 flex flex-col select-none font-sans overflow-x-hidden">

      {/* ================= TOP HEADER (Streamlined UI) ================= */}
      <div className="w-full flex items-center justify-between mb-6 z-10">

        {/* Left Side: Back Arrow + Brand Lockup */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="p-1 -ml-1 text-white hover:opacity-80 transition cursor-pointer flex items-center justify-center"
            aria-label="Back to profile"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          <span
            style={{ fontFamily: "'Jaro', sans-serif" }}
            className="text-3xl font-black tracking-wide text-white pt-1"
          >
            VibeIn
          </span>
        </div>

        {/* Right Side: Profile Picture Placeholder */}
        <div className="w-10 h-10 rounded-full bg-white text-black font-bold flex items-center justify-center text-lg shadow-md shrink-0">
          {myPfp?.trim() ? myPfp : "😎"}
        </div>
      </div>

      {/* ================= CONTROL TABS SECTION ================= */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-black text-white tracking-wide mb-4">
          My Events
        </h1>

        {/* Primary Segmented Switch (Hosted vs Attended) */}
        <div className="w-full bg-[#1e1e1e] p-1.5 rounded-2xl flex items-center gap-2 mb-4 border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab("HOSTED")}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab === "HOSTED"
                ? "bg-[#c8aaf5] text-[#2c124d] shadow-md"
                : "text-gray-400 hover:text-white"
              }`}
          >
            Hosted
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ATTENDED")}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab === "ATTENDED"
                ? "bg-[#c8aaf5] text-[#2c124d] shadow-md"
                : "text-gray-400 hover:text-white"
              }`}
          >
            Attended
          </button>
        </div>

        {/* Secondary Sub-Filters Row (Upcoming, Active, Completed) */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(["UPCOMING", "ACTIVE", "COMPLETED"] as const).map((filterItem) => (
            <button
              key={filterItem}
              type="button"
              onClick={() => setSubFilter(filterItem)}
              className={`px-5 py-2 rounded-full text-xs font-bold tracking-wider capitalize shrink-0 transition-all cursor-pointer border ${subFilter === filterItem
                  ? "border-[#c8aaf5] bg-[#c8aaf5]/10 text-[#c8aaf5]"
                  : "border-white/10 bg-transparent text-gray-400 hover:border-white/30"
                }`}
            >
              {filterItem.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ================= CARDS FEED ================= */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <EventListSkeleton count={3} />
        ) : error && hosting.length === 0 && attending.length === 0 ? (
          <div
            role="alert"
            className="flex flex-col items-center justify-center py-12 gap-3 text-center"
          >
            <AlertCircle className="w-7 h-7 text-red-400" />
            <p className="text-red-300 text-sm font-semibold">
              We couldn&apos;t load your events.
            </p>
            <p className="text-gray-400 text-xs font-medium max-w-xs">
              {error}
            </p>
          </div>
        ) : cards.length > 0 ? (
          cards.map((evt) => (
            <MyEventCard
              key={evt.id}
              {...evt}
            />
          ))
        ) : (
          <div className="text-center py-16 bg-[#1e1e1e]/50 rounded-3xl border border-white/5 mt-2">
            <p className="text-gray-400 font-medium text-sm">
              {activeTab === "HOSTED"
                ? "You haven't hosted any events in this tab yet."
                : "You haven't registered for any events in this tab yet."}
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
