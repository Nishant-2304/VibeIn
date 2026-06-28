// app/events/page.tsx
"use client";

import { useState } from "react";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import EventCard, { EventCardProps } from "../../components/event/EventCard";

const SAMPLE_EVENTS: EventCardProps[] = [
  {
    host: "Sarah Jenkins",
    joinedCount: 12,
    title: "Rooftop Jam Session",
    description: "Unplugged night. Bring your guitar, uke, or just your voice. We've got snacks.",
    time: "Tonight, 9:00 PM",
    bgColor: "#9474cc", // Muted Violet
  },
  {
    host: "Alex Rivera",
    joinedCount: 48,
    title: "Cyberpunk Trivia",
    description: "Test your knowledge of the future. Winner gets a hostel-wide shoutout and free coffee.",
    time: "Friday, 7:30 PM",
    bgColor: "#d95284", // Vibrant Pink
  },
  {
    host: "Priya K.",
    joinedCount: 8,
    title: "Midnight Ramen Run",
    description: "The new spot down the street. It's cheap, it's spicy, and it's open till 3 AM.",
    time: "Sat, 11:45 PM",
    bgColor: "#c78d1a", // Ochre Yellow
  },
  {
    host: "Derrick T.",
    joinedCount: 22,
    title: "Retro Gaming Tournament",
    description: "Super Smash Bros 64. Original controllers only. No spamming Pikachu.",
    time: "Sun, 2:00 PM",
    bgColor: "#3d8ba8", // Steel Blue
  },
];

export default function EventsFeedPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleMakeEvent = () => {
    console.log("Trigger Make Event Flow");
  };

  // Filter events dynamically based on user input
  const filteredEvents = SAMPLE_EVENTS.filter((evt) =>
    evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    evt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    evt.host.toLowerCase().includes(searchQuery.toLowerCase())
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
        {filteredEvents.length > 0 ? (
          filteredEvents.map((evt, idx) => (
            <EventCard key={idx} {...evt} />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm font-medium">No events found matching "{searchQuery}"</p>
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