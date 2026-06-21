"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Plus } from "lucide-react";
import { EventCard } from "../../components/event/EventCard";
import type { FrontendEvent } from "../../types/frontend";

const MOCK_EVENTS: FrontendEvent[] = [
  {
    id: "ev-1",
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
    theme_color: "purple",
  },
  {
    id: "ev-2",
    eventname: "Laundry Lottery Finals",
    event_description: "Bring one mysterious sock, one detergent sachet, and your strongest conspiracy theory.",
    hostel_name: "B-Block",
    floor: 2,
    room_no: "210",
    host_id: "u-2",
    host_name: "Meera",
    event_time: "2026-06-23T18:00:00Z",
    duration_minutes: 45,
    max_attendees: 8,
    theme_color: "blue",
  },
  {
    id: "ev-3",
    eventname: "Uno No Mercy Night",
    event_description: "A normal lazy Sunday uno game. Friendships may briefly turn into pending hostel grievance reports.",
    hostel_name: "A-Block",
    floor: 3,
    room_no: "302",
    host_id: "u-3",
    host_name: "Kabir",
    event_time: "2026-06-24T20:00:00Z",
    duration_minutes: 120,
    max_attendees: 6,
    theme_color: "orange",
  },
];

export default function MobileEventsFeed() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = MOCK_EVENTS.filter(e => 
    e.eventname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.event_description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="flex-1 px-5 pt-6 relative flex flex-col">
      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-1.5 pl-5 flex items-center justify-between border-2 border-[#9b72cf] shadow-md mb-6 shrink-0">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search events..."
          className="font-display text-2xl text-black placeholder:text-gray-400 bg-transparent border-none w-full focus:outline-none pt-0.5"
        />
        <div className="flex items-center gap-1.5 shrink-0">
          <button type="button" className="p-2 text-[#9b72cf]">
            <SlidersHorizontal className="w-6 h-6 stroke-[2.5]" />
          </button>
          <div className="bg-[#9b72cf] text-white p-3 rounded-xl shadow">
            <Search className="w-6 h-6 stroke-[3]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pb-12 pt-2">
              {filtered.map((ev) => (
               <EventCard key={ev.id} event={ev} />
              ))}
      </div>

      {/* Floating "Make event" CTA Pill near bottom */}
      <div className="sticky bottom-6 left-0 w-full flex justify-center pointer-events-none z-40">
        <Link
          href="/events/create"
          className="pointer-events-auto bg-black text-white font-display text-xl tracking-wider px-8 py-3.5 rounded-full shadow-2xl border border-white/20 flex items-center gap-2 active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6 text-[#9b72cf] stroke-[3]" />
          Make event
        </Link>
      </div>
    </main>
  );
}