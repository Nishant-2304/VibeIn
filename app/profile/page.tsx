"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { 
  ChevronRight, 
  Edit3, 
  LogOut, 
  MapPin, 
  Ticket, 
  Zap 
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  useEffect(() => {
    async function getToken() {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log("ACCESS TOKEN:");
      console.log(session?.access_token);
    }

    getToken();
  }, []);

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="flex-1 relative px-5 pt-6 pb-32 flex flex-col items-center justify-center bg-[#121212] min-h-screen text-gray-400 font-sans">
        <div className="w-8 h-8 border-2 border-[#9b72cf] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">Loading Profile...</p>
      </main>
    );
  }

  return (
    <main className="flex-1 relative px-5 pt-6 pb-32 flex flex-col items-center bg-[#121212] min-h-screen select-none font-sans overflow-x-hidden">
      
      {/* Absolute Top Spotlight */}
      <div className="absolute top-0 left-0 right-0 h-[340px] bg-gradient-to-b from-[#9b72cf] to-transparent pointer-events-none" />

      {/* ================= TOP HEADER ================= */}
      <div className="w-full flex items-center justify-between mb-6 z-10">
        <span 
          style={{ fontFamily: "'Jaro', sans-serif" }} 
          className="text-3xl font-black tracking-wide text-white pt-1"
        >
          VibeIn
        </span>

        <div className="w-10 h-10 rounded-full bg-white text-black font-bold flex items-center justify-center text-lg shadow-md shrink-0">
          {profile?.pfp || "😎"}
        </div>
      </div>

      {/* ================= AVATAR & HERO INFO ================= */}
      <div className="relative mb-3 z-10 mt-2">
        <div className="w-28 h-28 rounded-full bg-neutral-800 border-2 border-[#b594e6] overflow-hidden shadow-2xl flex items-center justify-center text-5xl">
          {profile?.pfp || "😎"}
        </div>
        {/* Glowing Lightning Bolt Badge */}
        <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#d95284] text-white flex items-center justify-center shadow-[0_0_15px_rgba(217,82,132,0.8)] border-2 border-[#121212]">
          <Zap className="w-4 h-4 fill-white stroke-none" />
        </div>
      </div>

      <h1 
        style={{ fontFamily: "'Jaro', sans-serif" }} 
        className="text-3xl font-black text-white tracking-wide z-10 mb-1 uppercase text-center"
      >
        {profile?.displayName || "New User"}
      </h1>

      <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium z-10 mb-6">
        <MapPin className="w-3.5 h-3.5 text-[#b594e6] shrink-0" />
        <span>{profile?.hostel || "Not Set"} Hostel • Floor {profile?.floor ?? 0}</span>
      </div>

      {/* ================= STATS ROW ================= */}
      <div className="w-full flex gap-3 mb-8 z-10">
        <div className="flex-1 bg-[#1e1e1e] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg">
          <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-1">
            Events Joined
          </span>
          <span 
            style={{ fontFamily: "'Jaro', sans-serif" }} 
            className="text-3xl font-black text-[#b594e6]"
          >
            {profile?.eventsAttended ?? 0}
          </span>
        </div>

        <div className="flex-1 bg-[#1e1e1e] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg">
          <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-1">
            Events Hosted
          </span>
          <span 
            style={{ fontFamily: "'Jaro', sans-serif" }} 
            className="text-3xl font-black text-[#f5c242]"
          >
            {profile?.eventsHosted ?? 0}
          </span>
        </div>
      </div>

      {/* ================= ACCOUNT SETTINGS CLUSTER ================= */}
      <div className="w-full z-10 mb-8 mt-auto">
        <h2 
          style={{ fontFamily: "'Jaro', sans-serif" }} 
          className="text-sm font-black tracking-wider text-gray-400 uppercase mb-3 px-1"
        >
          Account Settings
        </h2>

        <div className="w-full bg-[#1e1e1e] border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5 shadow-lg">
          <SettingsItem icon={<Edit3 className="w-5 h-5 text-[#b594e6]" />} label="Edit Profile" />
          
          <Link href="/profile/events" className="block">
            <SettingsItem icon={<Ticket className="w-5 h-5 text-[#f5c242]" />} label="My Events" />
          </Link>

          <button type="button" onClick={handleLogout} className="w-full text-left cursor-pointer">
            <div className="flex items-center justify-between p-4 px-5 hover:bg-white/5 transition active:bg-white/10">
              <div className="flex items-center gap-3.5">
                <LogOut className="w-5 h-5 text-red-400" />
                <span className="font-bold text-sm text-red-400 tracking-tight">Logout</span>
              </div>
            </div>
          </button>
        </div>
      </div>

    </main>
  );
}

// Sub-component for clean menu rows
function SettingsItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center justify-between p-4 px-5 hover:bg-white/5 transition active:bg-white/10 cursor-pointer">
      <div className="flex items-center gap-3.5">
        {icon}
        <span className="font-bold text-sm text-gray-200 tracking-tight">{label}</span>
      </div>

      <div className="flex items-center gap-2">
        <ChevronRight className="w-4 h-4 text-gray-500 stroke-[3]" />
      </div>
    </div>
  );
}