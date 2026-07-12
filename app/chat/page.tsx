"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, User, Users, Search } from "lucide-react"; // 💡 Added Search icon
import { createClient } from "@/lib/supabase/client";

interface ChatRoomListItem {
  id: string;
  name: string | null;
  isGroup: boolean;
  updatedAt: string;
  members: Array<{ 
    userId: string;
    user?: {
      id: string;
      username: string;
      pfp: string | null;
    };
  }>;
  messages: Array<{
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
  }>;
}

export default function ChatInboxPage() {
  const [rooms, setRooms] = useState<ChatRoomListItem[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "dms">("all");
  const [searchQuery, setSearchQuery] = useState(""); // 💡 New search state
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchInbox() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token || !session?.user) {
          setLoading(false);
          return;
        }

        setCurrentUserId(session.user.id);

        const response = await fetch("/api/chat/rooms", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setRooms(data);
        }
      } catch (err) {
        console.error("Failed loading chat inbox data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchInbox();
  }, []);

  // 💡 1. First, process the rooms to calculate their titles so we can search against them
  const processedRooms = rooms.map((room) => {
    const partnerMember = !room.isGroup
      ? room.members?.find((m) => m.userId !== currentUserId)
      : null;

    const chatTitle = room.isGroup 
      ? room.name || "Unnamed Event"
      : partnerMember?.user?.username || "Direct Message";

    return { ...room, chatTitle, partnerMember };
  });

  // 💡 2. Now filter by BOTH the active tab and the search query
  const filteredRooms = processedRooms.filter((room) => {
    const matchesTab = activeTab === "dms" ? !room.isGroup : true;
    const matchesSearch = room.chatTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (loading) {
    return (
      <main className="fixed inset-x-0 top-0 bottom-[56px] max-w-md mx-auto flex flex-col bg-black text-gray-400 items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#b792ea] border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs tracking-wider text-white/40 uppercase font-medium">Loading Conversations...</p>
      </main>
    );
  }

  return (
    <main className="fixed inset-x-0 top-0 bottom-[56px] max-w-md mx-auto flex flex-col bg-black text-white border-x border-white/5 shadow-2xl shadow-black">
      
      {/* ================= INBOX HEADER ================= */}
      <div className="px-5 pt-7 pb-4 shrink-0 bg-gradient-to-b from-[#0a0a0a] to-[#050505] border-b border-white/[0.04]">
        <h1 className="text-4xl tracking-wide font-display text-transparent bg-clip-text bg-gradient-to-r from-white to-white/90">
          Messages
        </h1>
        
        {/* Tab Controls */}
        <div className="flex gap-2 mt-5 bg-white/[0.03] p-1.5 rounded-xl border border-white/[0.02]">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-2.5 text-[13px] font-bold rounded-lg transition-all duration-300 ${
              activeTab === "all" 
                ? "bg-[#b792ea] text-black shadow-[0_0_15px_rgba(183,146,234,0.15)]" 
                : "text-white/50 hover:text-white/90 hover:bg-white/5"
            }`}
          >
            All Chats
          </button>
          <button
            onClick={() => setActiveTab("dms")}
            className={`flex-1 py-2.5 text-[13px] font-bold rounded-lg transition-all duration-300 ${
              activeTab === "dms" 
                ? "bg-[#b792ea] text-black shadow-[0_0_15px_rgba(183,146,234,0.15)]" 
                : "text-white/50 hover:text-white/90 hover:bg-white/5"
            }`}
          >
            Direct Messages
          </button>
        </div>

        {/* 💡 Search Bar */}
        <div className="mt-3 relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-white/30 group-focus-within:text-[#b792ea] transition-colors" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-[#121214] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#b792ea]/50 focus:ring-1 focus:ring-[#b792ea]/50 transition-all"
          />
        </div>
      </div>

      {/* ================= CONVERSATIONS INBOX LIST ================= */}
      <div className="flex-1 overflow-y-auto bg-[#020202] scrollbar-none">
        {filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-white/30">
            {searchQuery ? (
              <>
                <Search className="w-10 h-10 mb-4 opacity-30 stroke-[1.5]" />
                <p className="text-[13px] font-medium text-white/50">No chats found for "{searchQuery}"</p>
              </>
            ) : (
              <>
                <MessageSquare className="w-10 h-10 mb-4 opacity-30 stroke-[1.5]" />
                <p className="text-base font-semibold text-white/50">It's quiet here...</p>
                <p className="text-[13px] text-white/30 mt-2 max-w-[240px] leading-relaxed">
                  {activeTab === "dms" 
                    ? "Start a direct message conversation from a user's profile." 
                    : "Join events around campus to unlock real-time group chats."}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filteredRooms.map((room) => {
              const lastMessage = room.messages?.[0];
              const hasUnread = false; 

              const previewText = lastMessage
                ? lastMessage.senderId === currentUserId
                  ? `You: ${lastMessage.content}`
                  : lastMessage.content
                : "Say hi! Start the conversation.";

              const timeString = lastMessage
                ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "";

              return (
                <Link
                  key={room.id}
                  href={room.isGroup ? `/events/${room.id}/chat` : `/chat/dm/${room.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-all duration-200 hover:bg-white/[0.03] active:bg-white/[0.05] group"
                >
                  {/* Visual Avatar Identifier Blocks */}
                  <div className={`w-[52px] h-[52px] rounded-full shrink-0 flex items-center justify-center border transition-transform duration-300 group-hover:scale-105 relative ${
                    room.isGroup 
                      ? "bg-gradient-to-br from-[#3d8ba8]/20 to-[#3d8ba8]/5 border-[#3d8ba8]/30 text-[#3d8ba8]" 
                      : "bg-gradient-to-br from-[#b792ea]/20 to-[#b792ea]/5 border-[#b792ea]/30 text-[#b792ea]"
                  }`}>
                    {room.isGroup ? <Users className="w-6 h-6 stroke-[1.5]" /> : <User className="w-6 h-6 stroke-[1.5]" />}
                    {hasUnread && (
                      <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#b792ea] rounded-full border-[2.5px] border-[#020202]" />
                    )}
                  </div>

                  {/* Info Center Text Wraps */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="text-[15px] font-semibold tracking-wide truncate group-hover:text-[#b792ea] transition-colors duration-200 text-white/95">
                        {room.chatTitle} {/* 💡 Now pulling from our pre-processed variable! */}
                      </h3>
                      <span className="text-[11px] text-white/40 font-medium tracking-wide ml-3 shrink-0">
                        {timeString}
                      </span>
                    </div>
                    
                    <p className={`text-[13px] truncate leading-tight ${
                      hasUnread ? "text-white/90 font-medium" : "text-white/40 font-normal"
                    }`}>
                      {previewText}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </main>
  );
}