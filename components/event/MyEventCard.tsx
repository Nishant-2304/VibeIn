"use client";

import { useRouter } from "next/navigation";
import { Clock, MoreVertical, Users } from "lucide-react";

type EventAvatar = {
  id: string;
  name: string;
  pfp?: string | null;
};

export interface MyEventCardProps {
  id: string;
  title: string;
  time: string;
  joinedCount: string; // e.g. "12/20 Joined" or "8/8 Full"
  roleBadge: "HOST" | "ATTENDING";
  actionText: "Manage" | "Broadcast" | "View Details";
  /**
   * Optional override for the action button's destination. When omitted, the
   * card itself is the only click target.
   */
  actionHref?: string;
  bgColor: string;
  avatars?: EventAvatar[];
}

const VISIBLE_AVATAR_COUNT = 4;

export default function MyEventCard({
  id,
  title,
  time,
  joinedCount,
  roleBadge,
  actionText,
  actionHref,
  bgColor,
  avatars = [],
}: MyEventCardProps) {
  const router = useRouter();
  const visibleAvatars = avatars.slice(0, VISIBLE_AVATAR_COUNT);
  const extraCount = Math.max(0, avatars.length - visibleAvatars.length);

  const handleActionClick = (e: React.MouseEvent) => {
    // The card itself is clickable, so always block the bubbling navigation.
    e.stopPropagation();
    if (actionHref) {
      router.push(actionHref);
    }
  };

  return (
    <article
      onClick={() => router.push(`/events/${id}`)}
      style={{ backgroundColor: bgColor }}
      className="w-full cursor-pointer rounded-3xl p-5 flex flex-col justify-between shadow-lg text-[#1e1e1e] select-none relative overflow-hidden transition-transform active:scale-[0.99]"
    >
      {/* Top Row */}
      <div className="flex items-center justify-between mb-3">
        <span className="bg-black/20 text-black font-black text-[10px] px-3 py-1 rounded-full tracking-wider uppercase">
          {roleBadge}
        </span>

        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="p-1 text-black/70 hover:text-black transition rounded-full hover:bg-black/10 active:scale-95 cursor-pointer"
          aria-label="Event options"
        >
          <MoreVertical className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Title + Stats */}
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

      {/* Bottom */}
      <div className="flex items-center justify-between">
        <div className="flex items-center -space-x-2 overflow-hidden pl-1">
          {visibleAvatars.map((avatar, index) => (
            <AvatarBubble key={avatar.id} avatar={avatar} index={index} />
          ))}

          {extraCount > 0 && (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/80 text-white text-[10px] font-black ring-2 ring-black/10 shrink-0">
              +{extraCount}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleActionClick}
          className="bg-black hover:bg-neutral-800 text-white font-bold text-sm px-6 py-2.5 rounded-2xl shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
        >
          {actionText}
        </button>
      </div>
    </article>
  );
}

function AvatarBubble({
  avatar,
  index,
}: {
  avatar: EventAvatar;
  index: number;
}) {
  const pfp = avatar.pfp?.trim();
  const label = avatar.name?.trim() || "User";
  const initial = label.charAt(0).toUpperCase();
  const isImage =
    !!pfp &&
    (pfp.startsWith("/") ||
      pfp.startsWith("http://") ||
      pfp.startsWith("https://") ||
      pfp.startsWith("data:image/"));
  const fallbackColors = [
    "bg-neutral-800",
    "bg-neutral-700",
    "bg-[#231b2e]",
    "bg-[#18262b]",
  ];

  return (
    <div
      className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white ring-2 ring-black/10 shrink-0 ${fallbackColors[index % fallbackColors.length]}`}
      title={label}
      aria-label={label}
    >
      {isImage ? (
        <img src={pfp} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="leading-none">{pfp || initial}</span>
      )}
    </div>
  );
}
