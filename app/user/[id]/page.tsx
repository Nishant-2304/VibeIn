// app/user/[id]/page.tsx
"use client";

import { 
  ArrowLeft, 
  AlertCircle, 
  Bell, 
  CheckCircle2, 
  Gamepad2, 
  History, 
  MapPin, 
  MessageSquare, 
  PartyPopper, 
  Star 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PublicProfilePage() {
  const router = useRouter();

  return (
    <main className="flex-1 relative px-5 pt-6 pb-32 flex flex-col items-center bg-[#121212] min-h-screen select-none font-sans overflow-x-hidden">
      
      {/* Absolute Top Spotlight */}
      <div className="absolute top-0 left-0 right-0 h-[340px] bg-gradient-to-b from-[#9b72cf] to-transparent pointer-events-none" />

      {/* ================= TOP HEADER ================= */}
      <div className="w-full flex items-center justify-between mb-6 z-10">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => router.back()} 
            className="p-1 -ml-1 text-white hover:opacity-80 transition cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span 
            style={{ fontFamily: "'Jaro', sans-serif" }} 
            className="text-2xl font-black tracking-wide text-white"
          >
            VibeIn
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            className="p-2.5 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition active:scale-95 cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 stroke-[2.5]" />
          </button>
          
          {/* Mini User Avatar */}
          <div className="w-8 h-8 rounded-full bg-neutral-700 border border-white/20 flex items-center justify-center text-xs overflow-hidden">
            🧑‍💻
          </div>
        </div>
      </div>

      {/* ================= HERO AVATAR & INFO ================= */}
      <div className="relative mb-3 z-10 mt-2">
        <div className="w-28 h-28 rounded-full bg-neutral-800 border-2 border-[#b594e6] overflow-hidden shadow-2xl flex items-center justify-center text-5xl">
          🧑‍💻
        </div>
        {/* Verified Host Badge */}
        <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#9474cc] text-white flex items-center justify-center shadow-md border-2 border-[#121212]">
          <CheckCircle2 className="w-5 h-5 text-white stroke-[2.5]" />
        </div>
      </div>

      <h1 
        style={{ fontFamily: "'Jaro', sans-serif" }} 
        className="text-3xl font-black text-white tracking-wide z-10 mb-1 uppercase"
      >
        Alex Rivera
      </h1>

      <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium z-10 mb-6">
        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span>Block A, 4th Floor</span>
      </div>

      {/* ================= RATINGS ROW ================= */}
      <div className="w-full flex gap-3 mb-4 z-10">
        {/* Host Rating Card */}
        <div className="flex-1 bg-[#231b2e] border border-[#9474cc]/30 rounded-2xl p-4 flex flex-col justify-between shadow-lg h-28">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-gray-300 uppercase block mb-1">
              Host Rating
            </span>
            <div className="flex items-center gap-1 text-white font-black text-xl">
              <span>4.9</span>
              <Star className="w-4 h-4 fill-[#b594e6] text-[#b594e6]" />
            </div>
          </div>
          <p className="text-gray-400 text-xs italic line-clamp-1">"Super chill host!"</p>
        </div>

        {/* Guest Rating Card */}
        <div className="flex-1 bg-[#18262b] border border-[#3d8ba8]/30 rounded-2xl p-4 flex flex-col justify-between shadow-lg h-28">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-gray-300 uppercase block mb-1">
              Guest Rating
            </span>
            <div className="flex items-center gap-1 text-white font-black text-xl">
              <span>5.0</span>
              <CheckCircle2 className="w-4 h-4 text-[#3d8ba8]" />
            </div>
          </div>
          <p className="text-gray-400 text-xs font-medium line-clamp-1">Clean & respectful</p>
        </div>
      </div>

      {/* ================= HOSTED / ATTENDED CAPSULE ================= */}
      <div className="w-full bg-[#262015] border border-[#c78d1a]/30 rounded-2xl p-4 flex items-center gap-4 mb-8 shadow-lg z-10">
        <div className="p-3 bg-[#c78d1a]/15 rounded-xl text-[#e6aa32] shrink-0">
          <PartyPopper className="w-6 h-6 stroke-[2]" />
        </div>
        
        <div className="flex-1 flex items-center justify-around divide-x divide-white/10 text-center">
          <div className="px-2">
            <span className="font-display font-black text-xl text-white block">14</span>
            <span className="text-[11px] font-medium text-gray-400">Events Hosted</span>
          </div>
          <div className="px-2 pl-4">
            <span className="font-display font-black text-xl text-white block">86</span>
            <span className="text-[11px] font-medium text-gray-400">Events Attended</span>
          </div>
        </div>
      </div>

      {/* ================= RECENT ACTIVITY SECTION ================= */}
      <div className="w-full z-10 mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 
            style={{ fontFamily: "'Jaro', sans-serif" }} 
            className="text-lg font-black tracking-wide text-white tracking-wider"
          >
            Recent Activity
          </h2>
          <Link 
            href="#" 
            className="text-xs font-bold text-gray-400 hover:text-white transition"
          >
            View All
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <RecentActivityCard 
            badge="3 Days Ago"
            title="Late Night Ramen Run"
            meta="👥 8/10  📍 Canteen"
            bgColor="#d95284"
            icon={<History className="w-4 h-4 text-white/80" />}
          />
          <RecentActivityCard 
            badge="Last Week"
            title="FIFA 24 Tournament"
            meta="👥 16/16  📍 Common Room"
            bgColor="#3d8ba8"
            icon={<Gamepad2 className="w-4 h-4 text-white/80" />}
          />
        </div>
      </div>

      {/* ================= BOTTOM ACTION CTAS ================= */}
      <div className="w-full space-y-3 z-10 mt-auto">
        {/* Primary Message CTA */}
        <button
          type="button"
          className="w-full py-4 rounded-2xl bg-[#c8aaf5] hover:bg-[#b894ec] text-[#2c124d] font-bold text-base shadow-[0_4px_20px_rgba(200,170,245,0.3)] transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          <MessageSquare className="w-5 h-5 stroke-[2.5]" />
          <span>Send a Message</span>
        </button>

        {/* Secondary Report CTA */}
        <button
          type="button"
          className="w-full py-3.5 rounded-2xl bg-[#1a1212] border border-red-500/30 hover:bg-red-500/10 text-red-400 font-semibold text-sm transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          <AlertCircle className="w-4 h-4 stroke-[2]" />
          <span>Report Profile</span>
        </button>
      </div>

    </main>
  );
}

// Micro-component tailored specifically for compact history rows
function RecentActivityCard({ 
  badge, 
  title, 
  meta, 
  bgColor, 
  icon 
}: { 
  badge: string; 
  title: string; 
  meta: string; 
  bgColor: string; 
  icon: React.ReactNode;
}) {
  return (
    <div 
      style={{ backgroundColor: bgColor }} 
      className="w-full rounded-2xl p-4 shadow-md flex flex-col justify-between text-white select-none relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="bg-black/25 text-white font-bold text-[11px] px-3 py-1 rounded-full backdrop-blur-sm tracking-wide">
          {badge}
        </span>
        <div className="p-1 bg-black/10 rounded-full">
          {icon}
        </div>
      </div>

      <h3 className="font-display font-black text-xl mb-1 tracking-tight leading-snug">
        {title}
      </h3>
      
      <div className="w-full h-px bg-black/10 my-2" />
      
      <p className="text-xs font-bold text-white/90 tracking-wide">{meta}</p>
    </div>
  );
}