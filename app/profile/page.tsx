// app/profile/page.tsx
"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  return (
    // FIXED SCROLL: Killed 'min-h-screen' and 'pb-20', swapped to 'h-full pb-8'
    <main className="flex-1 relative px-6 pt-6 pb-8 flex flex-col items-center bg-[#121212] h-full select-none font-sans overflow-y-auto">
      
      {/* Absolute Top Spotlight */}
      <div className="absolute top-0 left-0 right-0 h-[340px] bg-gradient-to-b from-[#9b72cf] to-transparent pointer-events-none" />

      {/* Header */}
      <div className="w-full flex items-center justify-between mb-6 z-10 shrink-0">
        <h1 
          style={{ fontFamily: "'Jaro', sans-serif" }} 
          className="text-3xl font-black text-white pt-1 tracking-wide"
        >
          My Account
        </h1>
        
        {/* FIXED FANCY BUTTON: Solid opaque #B899E5 squircle with a bold stroke-[3] arrow */}
        <button 
          type="button"
          onClick={() => router.back()} 
          className="w-11 h-11 rounded-2xl bg-[#B899E5] hover:bg-[#a682d8] flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer shadow-md shrink-0"
        >
          <ArrowLeft className="w-6 h-6 stroke-[3]" />
        </button>
      </div>

      {/* Avatar Section */}
      <div className="relative mb-3 z-10 shrink-0">
        <div className="w-28 h-28 rounded-full bg-white overflow-hidden shadow-2xl flex items-center justify-center border-2 border-white/20">
           <span className="text-5xl">🤓</span> 
        </div>
      </div>

      {/* Lilac Jaro Username */}
      <h2 
        style={{ fontFamily: "'Jaro', sans-serif" }} 
        className="text-3xl font-black text-[#b594e6] mb-2 tracking-wide z-10 shrink-0"
      >
        Name johnnnnnnnnn
      </h2>
      
      <p className="text-gray-200 text-xs italic font-normal text-center px-6 mb-8 leading-relaxed max-w-[290px] z-10 opacity-90 shrink-0">
        "A prime uno-enjoyer, surviving on coffee and dreams of my enemies"
      </p>

      {/* Stats Section */}
      <div className="w-full flex justify-around mb-8 z-10 px-2 shrink-0">
        <div className="text-center">
          <p style={{ fontFamily: "'Jaro', sans-serif" }} className="text-[#b594e6] text-xl font-black tracking-wider mb-0.5">
            Events joined
          </p>
          <span className="text-3xl font-bold text-white">12</span>
        </div>
        
        <div className="text-center">
          <p style={{ fontFamily: "'Jaro', sans-serif" }} className="text-[#b594e6] text-xl font-black tracking-wider mb-0.5">
            Events hosted
          </p>
          <span className="text-3xl font-bold text-white">3</span>
        </div>
      </div>

      {/* Data List Stack */}
      <div className="w-full space-y-6 px-1 my-auto z-10">
        <ProfileEmptyField label="Email" />
        <ProfileEmptyField label="Phone no" />
        <ProfileEmptyField label="Hostel" />
      </div>

      {/* Footer Timestamp */}
      <p className="mt-8 text-[11px] text-gray-500 font-medium tracking-tight z-10 shrink-0">
        User since : 14th Feb, 2026
      </p>
    </main>
  );
}

function ProfileEmptyField({ label }: { label: string }) {
  return (
    <div className="flex flex-col space-y-1">
      <span style={{ fontFamily: "'Jaro', sans-serif" }} className="text-[#b594e6] text-xl font-black tracking-wider">
        {label} :
      </span>
      <div className="h-4" /> 
    </div>
  );
}