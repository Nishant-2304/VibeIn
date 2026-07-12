// components/event/EventCard.tsx
import Link from "next/link";

export interface EventCardProps {
  id?: string;
  title: string;
  host: string;
  joinedCount: number;
  description: string;
  time: string;
  bgColor: string;
  onJoin?: (id: string, e: React.MouseEvent) => void;
  joinLabel?: string;
  statusLabel?: "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
}

export default function EventCard({
  id,
  title,
  host,
  joinedCount,
  description,
  time,
  bgColor,
  onJoin,
  joinLabel = "Join!",
  statusLabel,
}: EventCardProps) {
  const isRegistered = joinLabel === "Registered";

  // Maintained your rigid h-[210px] for horizontal carousel stability
  const cardClassName =
    "w-full h-[210px] rounded-3xl p-5 flex flex-col justify-between shadow-lg transition-transform active:scale-[0.99] select-none text-white relative overflow-hidden";

  const cardStyle = { backgroundColor: bgColor };

  const inner = (
    <>
      {/* ================= TOP RIGHT: The "Joined" Ribbon ================= */}
      <div
        className="absolute top-0 right-0 bg-white h-[50px] flex items-center justify-end pr-5 pl-10 rounded-tr-3xl z-10 shadow-sm"
        style={{
          // Flipped to slant top-left to bottom-right (\)
          clipPath: "polygon(0% 0, 100% 0, 100% 100%, 30% 100%)",
          color: bgColor, 
        }}
      >
        <div className="flex items-baseline gap-1 mt-1">
          <span className="font-display text-2xl font-black leading-none">
            {joinedCount}
          </span>
          <span className="font-bold text-xs opacity-90 tracking-tighter">
            JOINED
          </span>
        </div>
      </div>

      {/* ================= TOP LEFT: Title & Host ================= */}
      <div className="flex flex-col z-10 pr-20 shrink-0 mt-1">
        {statusLabel && (
          <span className="mb-2 w-fit rounded-full bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
            {statusLabel.toLowerCase()}
          </span>
        )}
        <h3 className="font-display text-2xl font-black leading-none tracking-wide truncate">
          {title}
        </h3>
        <p className="text-sm font-medium text-white/90 mt-2 truncate">
          Host: {host}
        </p>
      </div>

      {/* ================= MIDDLE: Description ================= */}
      <div className="flex-1 flex flex-col justify-center overflow-hidden my-2 z-10">
        <p className="text-sm font-medium text-white/95 leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      {/* ================= BOTTOM: Divider, Time, & CTA ================= */}
      <div className="shrink-0 mt-auto z-10">
        {/* Short horizontal line matching the Figma reference */}
        <div className="w-1/3 h-px bg-white/50 mb-3" />

        <div className="flex items-center justify-between">
          {/* Placed 'Time' here to replace the 'Inquire?' text, maintaining functionality */}
          <div className="font-display text-xl tracking-wide text-white truncate pr-2 mt-1 drop-shadow-sm">
            {time}
          </div>

          {isRegistered ? (
            <span className="bg-black/35 text-white font-bold text-sm px-5 py-2 rounded-xl shadow-md shrink-0">
              Registered
            </span>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (id && onJoin) {
                  onJoin(id, e);
                }
              }}
              className="bg-black hover:bg-neutral-800 text-white font-bold text-sm px-5 py-2 rounded-xl shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
            >
              {joinLabel}
            </button>
          )}
        </div>
      </div>
    </>
  );

  if (id) {
    return (
      <Link
        href={`/events/${id}`}
        style={cardStyle}
        className={`block ${cardClassName}`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <article style={cardStyle} className={cardClassName}>
      {inner}
    </article>
  );
}
