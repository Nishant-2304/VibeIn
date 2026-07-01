// app/events/[id]/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Calendar, MapPin, Pencil, Star, Zap, ArrowRight } from "lucide-react";
import {
  apiErrorMessage,
  eventApi,
  type EventDetail,
  userApi,
} from "../../../lib/client-api";

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    eventApi
      .get(params.id)
      .then((data) => {
        if (!active) return;
        setEvent(data);
        // Resolve host ownership lazily. If the user isn't logged in or the
        // request fails we simply won't show the edit pencil.
        userApi
          .getMe()
          .then((me) => active && setIsHost(me?.id === data.host.id))
          .catch(() => active && setIsHost(false));
      })
      .catch((cause) => active && setError(apiErrorMessage(cause)))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [params.id]);

  const date = useMemo(
    () =>
      event
        ? new Date(event.scheduledAt).toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
          })
        : "",
    [event]
  );
  const time = useMemo(
    () =>
      event
        ? new Date(event.scheduledAt).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
    [event]
  );

  async function register() {
    setRegistering(true);
    setError(null);
    setNotice(null);

    try {
      await eventApi.register(params.id);
      setEvent((current) =>
        current
          ? { ...current, currentAttendees: current.currentAttendees + 1 }
          : current
      );
      setNotice("You’re registered.");
    } catch (cause) {
      setError(apiErrorMessage(cause));
    } finally {
      setRegistering(false);
    }
  }

  // Loading State - removed bottom navbar padding
  if (loading) {
    return (
      <main className="flex-1 relative px-5 pt-6 pb-10 flex flex-col items-center justify-center bg-[#121212] min-h-screen text-gray-400 font-sans z-50">
        <div className="w-8 h-8 border-2 border-[#9b72cf] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">Loading event…</p>
      </main>
    );
  }

  // Error State - removed bottom navbar padding
  if (!event) {
    return (
      <main className="min-h-screen bg-[#121212] p-8 text-white flex flex-col items-center justify-center z-50 relative">
        <p>{error || "Event not found."}</p>
        <button 
          onClick={() => router.back()} 
          className="mt-4 inline-block text-[#b792ea] font-bold hover:underline cursor-pointer"
        >
          Go Back
        </button>
      </main>
    );
  }

  const registrationOpen =
    (event.status === "UPCOMING" || event.status === "ACTIVE") &&
    event.currentAttendees < event.maxAttendees;

  const hostBgColor = "#9474cc";

  return (
    <main className="min-h-screen bg-[#121212] text-white relative z-50">
      <div className="mx-auto min-h-screen w-full max-w-md pb-10">
        
        {/* ================= HERO IMAGE ================= */}
        <section className="relative h-[280px] overflow-hidden">
          <Image src="/Hero-Section.png" alt="" fill priority className="object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#121212] to-transparent" />
          
          {/* Floating Back Button */}
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute top-6 left-5 z-20 p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-all cursor-pointer shadow-lg active:scale-95"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Floating Edit Button (host only) */}
          {isHost && (
            <Link
              href={`/events/${encodeURIComponent(event.id)}/edit`}
              className="absolute top-6 right-5 z-20 p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-all cursor-pointer shadow-lg active:scale-95"
              aria-label="Edit event"
            >
              <Pencil className="w-5 h-5 stroke-[2.5]" />
            </Link>
          )}
          
          <div className="absolute bottom-4 right-4 rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-4 py-1.5 text-[#c8aaf5] font-bold text-sm shadow-lg">
            {event.currentAttendees} / {event.maxAttendees} Going
          </div>
        </section>

        <div className="px-5">
          {/* ================= TITLE & DESC ================= */}
          <h1 className="mt-2 text-3xl font-display font-black tracking-wide">{event.name}</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-gray-300">{event.description}</p>

          {/* ================= LOGISTICS ================= */}
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex gap-3 items-center">
              <div className="p-2.5 bg-white/5 rounded-xl text-[#b594e6]">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-white tracking-tight">{date}</p>
                <p className="text-xs font-medium text-gray-400">{time}</p>
              </div>
            </div>
            
            <div className="flex gap-3 items-center">
              <div className="p-2.5 bg-white/5 rounded-xl text-[#b594e6]">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-white tracking-tight">{event.hostel}</p>
                <p className="text-xs font-medium text-gray-400">
                  {event.roomNumber || `Floor ${event.floor}`}
                </p>
              </div>
            </div>
          </div>

          {/* ================= HOSTED BY ================= */}
          <Link
            href={`/user/${encodeURIComponent(event.host.id)}`}
            className="mt-8 block w-full rounded-3xl p-5 shadow-lg transition-transform active:scale-[0.99] select-none text-white relative overflow-hidden"
            style={{ backgroundColor: hostBgColor }}
          >
            {/* Top Right Ribbon (Rating) */}
            <div
              className="absolute top-0 right-0 bg-white h-[44px] flex items-center justify-end pr-5 pl-10 rounded-tr-3xl z-10 shadow-sm"
              style={{
                clipPath: "polygon(0% 0, 100% 0, 100% 100%, 30% 100%)",
                color: hostBgColor,
              }}
            >
              <div className="flex items-baseline gap-1 mt-1">
                <Star className="h-4 w-4 fill-current mb-0.5" />
                <span className="font-display text-2xl font-black leading-none">
                  {event.host.hostRating.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Top Left: Avatar and "Hosted by" */}
            <div className="flex flex-col z-10 relative">
              <span className="text-[11px] font-bold tracking-wider text-white/90 uppercase mb-1 drop-shadow-sm">
                Hosted by
              </span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black/20 border border-white/20 flex items-center justify-center text-xl shadow-inner shrink-0">
                  {event.host.pfp?.trim()
                    ? event.host.pfp
                    : event.host.displayName.charAt(0)}
                </div>
                <h3 className="font-display text-2xl font-black leading-none tracking-wide truncate pr-16">
                  {event.host.displayName}
                </h3>
              </div>
            </div>

            {/* Bottom: Divider & Action */}
            <div className="mt-5 relative z-10">
              <div className="w-1/3 h-px bg-white/50 mb-3" />
              <div className="flex items-center justify-between">
                <span className="font-display text-lg tracking-wide text-white drop-shadow-sm">
                  View Profile
                </span>
                <div className="bg-[#121212] hover:bg-black text-white px-5 py-1.5 rounded-xl shadow-xl transition-all flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>
            </div>
          </Link>

          {/* ================= ALERTS & CTA ================= */}
          {(error || notice) && (
            <div className={`mt-6 p-3 rounded-xl text-center text-sm font-bold border ${error ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
              {error || notice}
            </div>
          )}

          <button
            type="button"
            onClick={() => void register()}
            disabled={!registrationOpen || registering}
            className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#c8aaf5] hover:bg-[#b894ec] font-display font-black text-xl tracking-wider text-[#2c124d] disabled:opacity-50 disabled:grayscale transition-all active:scale-[0.99] shadow-[0_4px_25px_rgba(155,114,207,0.3)]"
          >
            {registering ? "Registering..." : registrationOpen ? "Register" : "Registration Closed"}
            <Zap className="h-5 w-5 stroke-[2.5]" />
          </button>
          
        </div>
      </div>
    </main>
  );
}