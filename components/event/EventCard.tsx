// components/event/EventCard.tsx
import { Calendar, Users } from "lucide-react";

export interface EventCardProps {
  title: string;
  host: string;
  joinedCount: number;
  description: string;
  time: string;
  bgColor: string;
}

export default function EventCard({
  title,
  host,
  joinedCount,
  description,
  time,
  bgColor,
}: EventCardProps) {
  return (
    <article
      style={{ backgroundColor: bgColor }}
      /* FIXED HEIGHT: Hardcoded h-[210px] ensures every card in a row is identical */
      className="w-full h-[210px] rounded-3xl p-5 flex flex-col justify-between shadow-lg transition-transform active:scale-[0.99] select-none text-[#1e1e1e]"
    >
      {/* Top Row: Host Info & Joined Badge */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-2.5 font-medium text-sm">
          <div className="w-8 h-8 rounded-full bg-black/10 border border-black/15 flex items-center justify-center font-bold text-xs shrink-0">
            {host.charAt(0)}
          </div>
          <span className="font-semibold tracking-tight">{host}</span>
        </div>

        <div className="bg-black text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 tracking-wide shadow-sm shrink-0">
          <Users className="w-3.5 h-3.5" />
          <span>{joinedCount} JOINED</span>
        </div>
      </div>

      {/* Middle Row: Title & Description (flex-1 acts as a spring to absorb empty height) */}
      <div className="flex-1 flex flex-col justify-start overflow-hidden my-1">
        <h3 className="font-display text-xl font-bold mb-1 leading-snug tracking-tight truncate">
          {title}
        </h3>
        <p className="text-black/75 text-xs font-medium leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      {/* Bottom Stack: Divider + Timestamp & Join CTA */}
      <div className="shrink-0 mt-auto">
        <div className="w-full h-px bg-black/10 mb-3" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-black/80 truncate pr-2">
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="truncate">{time}</span>
          </div>

          <button
            type="button"
            className="bg-black hover:bg-neutral-800 text-white font-bold text-sm px-5 py-2 rounded-xl shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
          >
            Join!
          </button>
        </div>
      </div>
    </article>
  );
}