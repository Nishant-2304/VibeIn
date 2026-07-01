"use client";
//public profile
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  Bell,
  CheckCircle2,
  History,
  MapPin,
  MessageSquare,
  PartyPopper,
  Star
} from "lucide-react";
import Link from "next/link";
import {
  apiErrorMessage,
  type MyEventItem,
  userApi,
} from "../../../lib/client-api";

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

const PUBLIC_PROFILE_COLOR_ORDER = shuffledStableOrder(0x9b72cf01);

type RecentEvent = MyEventItem & { role: "hosting" | "attending" };

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();

  if (Number.isNaN(then)) return "";

  const diffMs = Date.now() - then;
  const future = diffMs < 0;
  const abs = Math.abs(diffMs);

  const minutes = Math.floor(abs / (1000 * 60));
  const hours = Math.floor(abs / (1000 * 60 * 60));
  const days = Math.floor(abs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const prefix = future ? "In " : "";
  const suffix = future ? "" : " Ago";

  if (minutes < 1) return future ? "Soon" : "Just now";
  if (minutes < 60) return `${prefix}${minutes}m${suffix}`;
  if (hours < 24) return `${prefix}${hours}h${suffix}`;
  if (days < 7) return `${prefix}${days}d${suffix}`;
  if (weeks < 5) return `${prefix}${weeks}w${suffix}`;
  if (months < 12) return `${prefix}${months}mo${suffix}`;
  return `${prefix}${years}y${suffix}`;
}

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hosting, setHosting] = useState<MyEventItem[]>([]);
  const [attending, setAttending] = useState<MyEventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${id}`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        } else {
          setError("User not found");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching public profile:", err);
        setError("Error loading profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setEventsLoading(true);
    setEventsError(null);

    userApi
      .getUserEvents(id)
      .then((response) => {
        if (cancelled) return;
        setHosting(response.hosting ?? []);
        setAttending(response.attending ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        setEventsError(apiErrorMessage(err));
        setHosting([]);
        setAttending([]);
      })
      .finally(() => {
        if (!cancelled) setEventsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const recentActivity = useMemo<RecentEvent[]>(() => {
    const hosted: RecentEvent[] = hosting.map((event) => ({
      ...event,
      role: "hosting",
    }));
    const attended: RecentEvent[] = attending.map((event) => ({
      ...event,
      role: "attending",
    }));

    return [...hosted, ...attended]
      .sort(
        (a, b) =>
          new Date(b.event_time).getTime() - new Date(a.event_time).getTime()
      )
      .slice(0, 4);
  }, [hosting, attending]);

  if (loading) {
    return (
      <main className="flex-1 relative px-5 pt-6 pb-32 flex flex-col items-center justify-center bg-[#121212] min-h-screen text-gray-400 font-sans">
        <div className="w-8 h-8 border-2 border-[#9b72cf] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">Loading Profile...</p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="flex-1 relative px-5 pt-6 pb-32 flex flex-col items-center justify-center bg-[#121212] min-h-screen text-gray-400 font-sans">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-sm">{error || "User profile not found."}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm transition"
        >
          Go Back
        </button>
      </main>
    );
  }

  const hostRatingCount: number = profile.hostRatingCount ?? 0;
  const participantRatingCount: number = profile.participantRatingCount ?? 0;
  const eventsHostedTotal: number = profile.eventsHosted ?? 0;
  const eventsAttendedTotal: number = profile.eventsAttended ?? 0;

  return (
    <main className="flex-1 relative px-5 pt-6 pb-32 flex flex-col items-center bg-[#121212] min-h-screen select-none font-sans overflow-x-hidden">

      {/* Absolute Top Spotlight */}
      <div className="absolute top-0 left-0 right-0 h-[340px] bg-gradient-to-b from-[#9b72cf] to-transparent pointer-events-none" />

      {/* ================= TOP HEADER ================= */}
      <div className="w-full flex items-center justify-between mb-6 z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1 -ml-1 text-white hover:opacity-80 transition cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span
            style={{ fontFamily: "'Jaro', sans-serif" }}
            className="text-2xl font-black tracking-wide text-white"
          >
            VibeIn
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2.5 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition active:scale-95 cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Mini User Avatar */}
          <div className="w-8 h-8 rounded-full bg-neutral-700 border border-white/20 flex items-center justify-center text-xs overflow-hidden">
            {profile.pfp || "😎"}
          </div>
        </div>
      </div>

      {/* ================= HERO AVATAR & INFO ================= */}
      <div className="relative mb-3 z-10 mt-2">
        <div className="w-28 h-28 rounded-full bg-neutral-800 border-2 border-[#b594e6] overflow-hidden shadow-2xl flex items-center justify-center text-5xl">
          {profile.pfp || "😎"}
        </div>
        {/* Verified Host Badge */}
        <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#9474cc] text-white flex items-center justify-center shadow-md border-2 border-[#121212]">
          <CheckCircle2 className="w-5 h-5 text-white stroke-[2.5]" />
        </div>
      </div>

      <h1
        style={{ fontFamily: "'Jaro', sans-serif" }}
        className="text-3xl font-black text-white tracking-wide z-10 mb-1 uppercase text-center"
      >
        {profile.displayName || "Resident"}
      </h1>

      <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium z-10 mb-6">
        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span>{profile.hostel || "Not Set"} Hostel • Floor {profile.floor ?? 0}</span>
      </div>

      {/* ================= RATINGS ROW ================= */}
      <div className="w-full flex gap-3 mb-4 z-10">
        {/* Host Rating Card */}
        <div className="flex-1 bg-[#231b2e] border border-[#9474cc]/30 rounded-2xl p-4 flex flex-col justify-between shadow-lg h-28">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-gray-300 uppercase block mb-1">
              Host Rating
            </span>
            <div className="flex items-center gap-1 text-white font-black text-xl">
              <span>{(profile.hostRating ?? 0).toFixed(1)}</span>
              <Star className="w-4 h-4 fill-[#b594e6] text-[#b594e6]" />
            </div>
          </div>
          <p className="text-gray-400 text-xs italic line-clamp-1">
            {hostRatingCount > 0
              ? `${hostRatingCount} review${hostRatingCount === 1 ? "" : "s"}`
              : "No reviews yet"}
          </p>
        </div>

        {/* Guest Rating Card */}
        <div className="flex-1 bg-[#18262b] border border-[#3d8ba8]/30 rounded-2xl p-4 flex flex-col justify-between shadow-lg h-28">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-gray-300 uppercase block mb-1">
              Guest Rating
            </span>
            <div className="flex items-center gap-1 text-white font-black text-xl">
              <span>{(profile.participantRating ?? 0).toFixed(1)}</span>
              <CheckCircle2 className="w-4 h-4 text-[#3d8ba8]" />
            </div>
          </div>
          <p className="text-gray-400 text-xs font-medium line-clamp-1">
            {participantRatingCount > 0
              ? `${participantRatingCount} review${participantRatingCount === 1 ? "" : "s"}`
              : "No reviews yet"}
          </p>
        </div>
      </div>

      {/* ================= HOSTED / ATTENDED CAPSULE ================= */}
      <div className="w-full bg-[#262015] border border-[#c78d1a]/30 rounded-2xl p-4 flex items-center gap-4 mb-8 shadow-lg z-10">
        <div className="p-3 bg-[#c78d1a]/15 rounded-xl text-[#e6aa32] shrink-0">
          <PartyPopper className="w-6 h-6 stroke-[2]" />
        </div>

        <div className="flex-1 flex items-center justify-around divide-x divide-white/10 text-center">
          <div className="px-2">
            <span className="font-display font-black text-xl text-white block">{eventsHostedTotal}</span>
            <span className="text-[11px] font-medium text-gray-400">Events Hosted</span>
          </div>
          <div className="px-2 pl-4">
            <span className="font-display font-black text-xl text-white block">{eventsAttendedTotal}</span>
            <span className="text-[11px] font-medium text-gray-400">Events Attended</span>
          </div>
        </div>
      </div>

      {/* ================= RECENT ACTIVITY SECTION ================= */}
      <div className="w-full z-10 mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2
            style={{ fontFamily: "'Jaro', sans-serif" }}
            className="text-lg font-black text-white tracking-wide"
          >
            Recent Activity
          </h2>
          {recentActivity.length > 0 && (
            <Link
              href={`/user/${id}/events`}
              className="text-xs font-bold text-gray-400 hover:text-white transition"
            >
              View All
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {eventsLoading ? (
            <div className="w-full flex flex-col items-center justify-center py-10 gap-3 bg-[#1e1e1e]/50 rounded-2xl border border-white/5">
              <div className="w-6 h-6 border-2 border-[#9b72cf] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-xs font-medium">
                Loading recent activity…
              </p>
            </div>
          ) : eventsError ? (
            <div className="w-full flex flex-col items-center justify-center py-8 gap-2 bg-[#1e1e1e]/50 rounded-2xl border border-white/5 text-center px-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <p className="text-red-300 text-xs font-semibold">
                Couldn&apos;t load activity.
              </p>
              <p className="text-gray-400 text-[11px] font-medium max-w-xs">
                {eventsError}
              </p>
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="w-full text-center py-10 bg-[#1e1e1e]/50 rounded-2xl border border-white/5">
              <p className="text-gray-400 font-medium text-sm">
                No recent activity yet.
              </p>
            </div>
          ) : (
            recentActivity.map((event, index) => (
              <RecentActivityCard
                key={`${event.role}-${event.id}`}
                id={event.id}
                badge={event.role === "hosting" ? "HOST" : "ATTENDING"}
                title={event.eventname}
                attendees={event._count?.participants ?? 0}
                capacity={event.max_attendees}
                hostel={event.hostel_name}
                floor={event.floor}
                scheduledAt={event.event_time}
                timeAgo={timeAgo(event.event_time)}
                bgColor={
                  PUBLIC_PROFILE_COLOR_ORDER[
                    index % PUBLIC_PROFILE_COLOR_ORDER.length
                  ]
                }
                icon={
                  event.role === "hosting" ? (
                    <PartyPopper className="w-4 h-4 text-white/80" />
                  ) : (
                    <History className="w-4 h-4 text-white/80" />
                  )
                }
              />
            ))
          )}
        </div>
      </div>

      {/* ================= BOTTOM ACTION CTAS ================= */}
      <div className="w-full space-y-3 z-10 mt-auto">
        {/* Primary Message CTA */}
        <button
          type="button"
          className="w-full py-4 rounded-2xl bg-[#c8aaf5] hover:bg-[#b894ec] text-[#2c124d] font-bold text-base shadow-[0_4px_20px_rgba(200,170,245,0.3)] transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          <MessageSquare className="w-5 h-5 stroke-[2.5]" />
          <span>Send a Message</span>
        </button>

        {/* Secondary Report CTA */}
        {/*<button
          type="button"
          className="w-full py-3.5 rounded-2xl bg-[#1a1212] border border-red-500/30 hover:bg-red-500/10 text-red-400 font-semibold text-sm transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          <AlertCircle className="w-4 h-4 stroke-[2]" />
          <span>Report Profile</span>
        </button>*/}
      </div>

    </main>
  );
}

// Micro-component tailored specifically for compact history rows
function RecentActivityCard({
  id,
  badge,
  title,
  attendees,
  capacity,
  hostel,
  floor,
  scheduledAt,
  timeAgo: timeAgoLabel,
  bgColor,
  icon
}: {
  id: string;
  badge: string;
  title: string;
  attendees: number;
  capacity: number;
  hostel: string;
  floor: number;
  scheduledAt: string;
  timeAgo: string;
  bgColor: string;
  icon: React.ReactNode;
}) {
  const router = useRouter();

  const date = useMemo(() => {
    const d = new Date(scheduledAt);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [scheduledAt]);

  return (
    <div
      style={{ backgroundColor: bgColor }}
      onClick={() => router.push(`/events/${id}`)}
      className="w-full rounded-2xl p-4 shadow-md flex flex-col justify-between text-white select-none relative overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="bg-black/25 text-white font-bold text-[11px] px-3 py-1 rounded-full backdrop-blur-sm tracking-wide">
            {badge}
          </span>
          <span className="bg-black/15 text-white/90 font-bold text-[10px] px-2.5 py-1 rounded-full backdrop-blur-sm tracking-wide">
            {timeAgoLabel}
          </span>
        </div>
        <div className="p-1 bg-black/10 rounded-full">
          {icon}
        </div>
      </div>

      <h3 className="font-display font-black text-xl mb-1 tracking-tight leading-snug">
        {title}
      </h3>

      <div className="w-full h-px bg-black/10 my-2" />

      <p className="text-xs font-bold text-white/90 tracking-wide">
        👥 {attendees}/{capacity}  📍 {hostel} • Floor {floor}  🕒 {date}
      </p>
    </div>
  );
}
