// app/page.tsx
"use client"; // REQUIRED for input state

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, User } from "lucide-react";
import { EventCard } from "../components/event/EventCard";

// Quick fake preview event for the bottom of the homescreen
const sampleRecentEvent = {
  id: "preview-1",
  eventname: "Midnight Maggi Parliament",
  event_description: "Debate the correct water-to-masala ratio while pretending tomorrow's 8 AM lecture is a rumor.",
  hostel_name: "A-Block",
  floor: 1,
  room_no: "104",
  host_id: "u-1",
  host_name: "Rohan",
  event_time: "2026-06-22T23:30:00Z",
  duration_minutes: 60,
  max_attendees: 12,
  theme_color: "purple" as const,
};

export default function MobileHomeScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter(); // Used to navigate with the search query

  const handleSearch = () => {
    // Navigate with the search query as a URL parameter
    if (searchQuery.trim()) {
      router.push(`/events?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push("/events");
    }
  };

  return (
    <main className="flex-1 px-5 pt-6 flex flex-col">
      {/* Top Header Row with Profile */}
      <div className="flex items-center justify-between mb-8 px-1">
        <h1 className="font-display text-4xl font-black tracking-wide text-white">
          UibeIn
        </h1>
        <div className="w-11 h-11 bg-[#1e1e1e] rounded-full flex items-center justify-center border border-white/10 shadow-lg text-gray-500 hover:text-gray-300 cursor-pointer">
          <User className="w-5 h-5 stroke-[2]" />
        </div>
      </div>

      {/* Top Search Bar (Now functional) */}
      <div className="bg-white rounded-2xl p-1.5 pl-5 flex items-center justify-between border-2 border-[#9b72cf] shadow-md mb-6">
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search events..."
          className="font-display text-2xl text-black placeholder:text-gray-400 bg-transparent border-none w-full focus:outline-none pt-0.5"
          onKeyDown={(e) => {
            // Allow searching by pressing Enter
            if (e.key === 'Enter') handleSearch();
          }}
        />
        <div className="flex items-center gap-1.5 shrink-0">
          <button type="button" className="p-2 text-[#9b72cf] hover:scale-105 active:scale-95 cursor-pointer">
            <SlidersHorizontal className="w-6 h-6 stroke-[2.5]" />
          </button>
          <button 
            type="button"
            onClick={handleSearch}
            className="bg-[#9b72cf] text-white p-3 rounded-xl shadow cursor-pointer hover:bg-black transition-colors"
          >
            <Search className="w-6 h-6 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Hero Illustration Box with the purple corner triangles */}
      <div className="relative bg-[#181818] rounded-3xl p-8 my-2 flex flex-col items-center text-center border border-white/5 shadow-inner">
        {/* Top-Left Purple Triangle */}
        <div className="absolute top-0 left-0 w-10 h-10 bg-[#9b72cf] rounded-br-lg [clip-path:polygon(0_0,100%_0,0_100%)]" />
        {/* Bottom-Right Purple Triangle */}
        <div className="absolute bottom-0 right-0 w-10 h-10 bg-[#9b72cf] rounded-tl-lg [clip-path:polygon(100%_100%,0_100%,100%_0)]" />

        {/* Temporary Art Placeholder */}
        <div className="w-48 h-40 border-2 border-dashed border-[#9b72cf]/40 rounded-2xl flex items-center justify-center text-[#9b72cf]/60 mb-6 font-display text-sm tracking-wider">
          [ Drop Illustration Here ]
        </div>

        <p className="text-gray-300 text-sm font-medium leading-relaxed max-w-[260px] mb-6">
          Join your hostel friends discover, connect, and make every day more fun.
        </p>

        <Link
          href="/events/create"
          className="bg-black text-white font-display text-xl tracking-wider px-8 py-3.5 rounded-2xl shadow-xl border border-white/10 active:scale-95 transition-transform"
        >
          Make event
        </Link>
      </div>

      {/* Recent Events Feed Section */}
      <div className="mt-8 flex-1 flex flex-col">
        <h2 className="font-display text-3xl font-black tracking-wide text-white mb-4 px-1">
          Recent events
        </h2>
        
        <div className="pb-6 grid grid-cols-2 justify-items-center gap-4">
          <EventCard event={sampleRecentEvent} joinedCount={3} />
          {/* Add more sample cards or real data logic here in the future */}
        </div>
      </div>
    </main>
  );
}