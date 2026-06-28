// app/profile/events/page.tsx
"use client";

import { useState } from "react";
import { Bell, Plus } from "lucide-react";
import MyEventCard, { MyEventCardProps } from "../../../components/event/MyEventCard";

const SAMPLE_MY_EVENTS: MyEventCardProps[] = [
  {
    title: "Block 4 Rooftop Jam",
    time: "21:00 Today",
    joinedCount: "12/20 Joined",
    roleBadge: "HOST",
    actionText: "Manage",
    bgColor: "#9474cc", // Muted Violet
    extraCount: 10,
  },
  {
    title: "Ping Pong Tournament",
    time: "18:00 Sat",
    joinedCount: "8/8 Full",
    roleBadge: "HOST",
    actionText: "Broadcast",
    bgColor: "#d95284", // Vibrant Pink
    extraCount: 6,
  },
  {
    title: "Midnight Maggi Run",
    time: "23:30 Tomorrow",
    joinedCount: "15/15 Full",
    roleBadge: "HOST",
    actionText: "Manage",
    bgColor: "#c78d1a", // Ochre Yellow
    extraCount: 13,
  },
];

export default function MyEventsPage() {
  const [activeTab, setActiveTab] = useState<"HOSTED" | "ATTENDED">("HOSTED");
  const [subFilter, setSubFilter] = useState<"UPCOMING" | "ACTIVE" | "COMPLETED">("UPCOMING");

  const handleMakeEvent = () => {
    console.log("Trigger Make Event Flow");
  };

  return (
    <main className="flex-1 relative bg-[#121212] min-h-screen px-5 pt-6 pb-32 flex flex-col select-none font-sans overflow-x-hidden">
      
      {/* ================= TOP HEADER ================= */}
      <div className="w-full flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-800 border border-white/10 text-white font-bold flex items-center justify-center text-lg shadow-md overflow-hidden">
            <span className="text-2xl">🕵️‍♂️</span>
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
          className="p-2.5 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition active:scale-95 cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 stroke-[2.5]" />
        </button>
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
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === "HOSTED"
                ? "bg-[#c8aaf5] text-[#2c124d] shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Hosted
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ATTENDED")}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === "ATTENDED"
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
              className={`px-5 py-2 rounded-full text-xs font-bold tracking-wider capitalize shrink-0 transition-all cursor-pointer border ${
                subFilter === filterItem
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
        {activeTab === "HOSTED" ? (
          SAMPLE_MY_EVENTS.map((evt, idx) => (
            <MyEventCard key={idx} {...evt} />
          ))
        ) : (
          /* Empty state placeholder for when user clicks "Attended" */
          <div className="text-center py-16 bg-[#1e1e1e]/50 rounded-3xl border border-white/5 mt-2">
            <p className="text-gray-400 font-medium text-sm">No attended events in this tab yet.</p>
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