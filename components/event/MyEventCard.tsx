// components/event/MyEventCard.tsx
import { Clock, Users, MoreVertical } from "lucide-react";

export interface MyEventCardProps {
  title: string;
  time: string;
  joinedCount: string; // e.g. "12/20 Joined" or "8/8 Full"
  roleBadge: "HOST" | "ATTENDING";
  actionText: "Manage" | "Broadcast" | "View Details";
  bgColor: string;
  avatars?: string[];
  extraCount?: number;
}

export default function MyEventCard({
  title,
  time,
  joinedCount,
  roleBadge,
  actionText,
  bgColor,
  avatars = ["/avatar1.png", "/avatar2.png"], // fallbacks
  extraCount = 10,
}: MyEventCardProps) {
  return (
    <article
      style={{ backgroundColor: bgColor }}
      className="w-full rounded-3xl p-5 flex flex-col justify-between shadow-lg text-[#1e1e1e] select-none relative overflow-hidden transition-transform active:scale-[0.99]"
    >
      {/* Top Row: Role Badge & Three-Dot Menu */}
      <div className="flex items-center justify-between mb-3">
        <span className="bg-black/20 text-black font-black text-[10px] px-3 py-1 rounded-full tracking-wider uppercase">
          {roleBadge}
        </span>

        <button 
          type="button"
          className="p-1 text-black/70 hover:text-black transition rounded-full hover:bg-black/10 active:scale-95 cursor-pointer"
          aria-label="Event options"
        >
          <MoreVertical className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Middle: Title & Meta Stats */}
      <div className="mb-5">
        <h3 className="font-display text-2xl font-black mb-2 leading-tight tracking-wide text-black">
          {title}
        </h3>

        <div className="flex items-center gap-4 text-xs font-bold text-black/75">
          <div className="flex items-center gap-1.5 truncate">
            <Clock className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
            <span>{time}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Users className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
            <span>{joinedCount}</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-black/15 mb-4" />

      {/* Bottom Row: Stacked Avatars & Action CTA */}
      <div className="flex items-center justify-between">
        
        {/* Overlapping Avatar Stack */}
        <div className="flex items-center -space-x-2 overflow-hidden pl-1">
          <div className="inline-block w-8 h-8 rounded-full ring-2 ring-black/10 bg-neutral-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
            🧑‍🎤
          </div>
          <div className="inline-block w-8 h-8 rounded-full ring-2 ring-black/10 bg-neutral-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
            👩‍🚀
          </div>
          {extraCount > 0 && (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/80 text-white text-[10px] font-black ring-2 ring-black/10 shrink-0">
              +{extraCount}
            </div>
          )}
        </div>

        {/* Action Button (Manage / Broadcast) */}
        <button
          type="button"
          className="bg-black hover:bg-neutral-800 text-white font-bold text-sm px-6 py-2.5 rounded-2xl shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
        >
          {actionText}
        </button>
      </div>
    </article>
  );
}