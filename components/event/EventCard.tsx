// components/event/EventCard.tsx
import React from "react";
import type { FrontendEvent } from "../../types/frontend";

// Maps to the exact CSS variables we defined in your v4 globals.css
const themeVarMap: Record<string, string> = {
  purple: "var(--color-card-purple)",
  blue: "var(--color-card-blue)",
  orange: "var(--color-card-orange)",
  red: "var(--color-card-red)",
  pink: "var(--color-card-pink)",
};

interface EventCardProps {
  event: FrontendEvent;
  joinedCount?: number;
}

export function EventCard({ event, joinedCount = 3 }: EventCardProps) {
  const bgColor = themeVarMap[event.theme_color || "purple"];

  // Safely format the date string to "Jun 22" format
  const formattedDate = new Date(event.event_time).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <article
      className="relative flex flex-col justify-between w-full h-[250px] overflow-hidden rounded-2xl p-4 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl mx-auto"
      style={{ backgroundColor: bgColor }}
    >
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-1 mb-1">
          <h2 className="font-display text-lg font-black leading-tight tracking-tight text-white line-clamp-2 pt-0.5">
          {event.eventname}
          </h2>
          <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-[#121212] shadow">
            {formattedDate}
          </span>
        </div>
        <p className="text-[10px] font-bold opacity-90 mt-0.5">
          Host: {event.host_name || "Mystery Host"}
        </p>
      </div>

      {/* Middle Description */}
      <div className="my-auto py-1">
        <p className="line-clamp-4 text-[11px] leading-relaxed text-white/95 font-medium">
          {event.event_description}
        </p>
      </div>

      {/* Bottom Action Row */}
      <div className="flex items-center justify-between border-t border-white/20 pt-3">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">
            Joined
          </span>
          <span className="font-display text-lg font-black leading-none">
            {joinedCount}/{event.max_attendees}
          </span>
        </div>

        <button
          type="button"
          className="rounded-full bg-[#121212] px-4 py-1.5 font-display text-sm tracking-wider text-white transition hover:bg-black hover:scale-105 active:scale-95 shadow-md cursor-pointer"
        >
          Join!
        </button>
      </div>
    </article>
  );
}