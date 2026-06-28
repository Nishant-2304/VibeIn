// app/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, ChevronRight, Plus, X } from "lucide-react";
import Link from "next/link";
import EventCard, { EventCardProps } from "../components/event/EventCard";

// Live carousel dataset
const HAPPENING_NOW_EVENTS: EventCardProps[] = [
  {
    host: "Kabir M.",
    joinedCount: 8,
    title: "Common Room Poker",
    description: "Buy-in is snacks! Table 4. No looking at other people's cards.",
    time: "Floor 3 Lounge",
    bgColor: "#9474cc",
  },
  {
    host: "Rohan D.",
    joinedCount: 4,
    title: "Quick FIFA 24 Match",
    description: "Need two more controllers in Room 204. Winner stays on.",
    time: "Online / Room 204",
    bgColor: "#3d8ba8",
  },
  {
    host: "Alia K.",
    joinedCount: 15,
    title: "Chai & Chill",
    description: "Brewing fresh ginger tea. Bring your own mug!",
    time: "Block A Pantry",
    bgColor: "#c78d1a",
  },
];

// Paginated dataset (4 total events = 2 pages of 2 cards)
const COMING_UP_EVENTS: EventCardProps[] = [
  {
    host: "Meera P.",
    joinedCount: 5,
    title: "Noodle Night",
    description: "Bringing the secret spicy sauce from home. Join for a late-night feast in the pantry.",
    time: "Tonight @ 8:00 PM",
    bgColor: "#d95284",
  },
  {
    host: "Aarav S.",
    joinedCount: 12,
    title: "Roof-top Yoga",
    description: "Chill vibes only. Bring your own mat or a large towel. Sunset views guaranteed.",
    time: "Tomorrow @ 4:00 PM",
    bgColor: "#c78d1a",
  },
  {
    host: "Srujan V.",
    joinedCount: 19,
    title: "Hackathon Prep Group",
    description: "Brainstorming ideas for the Web3 track. Beginners welcome.",
    time: "Sat @ 10:00 AM",
    bgColor: "#3d8ba8",
  },
  {
    host: "David L.",
    joinedCount: 7,
    title: "Sunday Acoustic Jam",
    description: "Lowkey jamming in the quad. Cajon and acoustic guitars.",
    time: "Sun @ 5:30 PM",
    bgColor: "#9474cc",
  },
];

const EVENTS_PER_PAGE = 2;

export default function HomePage() {
  // Alert Banner State
  const [pendingCount, setPendingCount] = useState(2);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(COMING_UP_EVENTS.length / EVENTS_PER_PAGE);

  // Carousel Autoplay Refs & State
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

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

  // Calculate slice for current Coming Up page
  const displayedComingUp = COMING_UP_EVENTS.slice(
    currentPage * EVENTS_PER_PAGE,
    (currentPage + 1) * EVENTS_PER_PAGE
  );

  const handleMakeEvent = () => {
    console.log("Trigger Make Event Flow");
  };

  return (
    <main className="flex-1 relative bg-[#121212] min-h-screen px-5 pt-6 pb-32 flex flex-col select-none overflow-x-hidden font-sans">
      
      {/* ================= TOP HEADER ================= */}
      <div className="w-full flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white text-black font-bold flex items-center justify-center text-lg shadow-md">
            😎
          </div>
          {/* Forcefully applied Jaro font via inline style */}
          <span 
            style={{ fontFamily: "'Jaro', sans-serif" }} 
            className="text-2xl font-black tracking-wide text-white"
          >
            VibeIn
          </span>
        </div>

        <button 
          type="button"
          className="p-2 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition active:scale-95 cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* ================= CONDITIONAL ALERT BANNER ================= */}
      {pendingCount > 0 && (
        <div className="w-full bg-[#c8aaf5] rounded-2xl p-3 px-4 flex items-center justify-between mb-8 shadow-md transition-all animate-fade-in">
          <div className="flex items-center gap-2.5 text-[#2c124d] font-bold text-xs sm:text-sm overflow-hidden">
            <div className="w-5 h-5 rounded-full bg-[#2c124d] text-white flex items-center justify-center font-black text-[11px] shrink-0">
              !
            </div>
            <span className="truncate">{pendingCount} events need attendance marked</span>
          </div>
          
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <ChevronRight className="w-4 h-4 text-[#2c124d] stroke-[3]" />
            {/* Dismiss Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPendingCount(0); // Hides banner permanently for session
              }}
              className="p-1 hover:bg-black/10 rounded-full transition text-[#2c124d]"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

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
          {HAPPENING_NOW_EVENTS.map((evt, idx) => (
            /* Fluid 82vw width ensures it centers on all mobile screen sizes */
            <div key={idx} className="w-[82vw] max-w-[320px] shrink-0 snap-center first:pl-0">
              <EventCard {...evt} />
            </div>
          ))}
          {/* Right spacer to ensure the final card can also snap dead-center */}
          <div className="w-2 shrink-0" />
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
          {displayedComingUp.map((evt, idx) => (
            <EventCard key={idx} {...evt} />
          ))}
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
    </main>
  );
}