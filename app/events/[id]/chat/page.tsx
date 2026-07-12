"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import { useChatSocket } from "../../../hooks/useChatSocket";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ChatRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: roomId } = use(params);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState("Event Chat");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const [isNotMember, setIsNotMember] = useState(false);

  // 💡 FIX 1: Dedicated reliable scroll mechanism
  const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior });
    }
  };

  // 💡 Automatically scroll whenever the 'messages' array changes!
  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages]);

  const handleIncomingMessage = useCallback((newMessage: any) => {
    setMessages((prev) => {
      const filtered = prev.filter((msg) => msg.id !== newMessage.id && msg.id !== `temp-${newMessage.createdAt}`);
      if (filtered.some((msg) => msg.id === newMessage.id)) return prev;
      return [...filtered, newMessage];
    });
  }, []);

  const { isConnected } = useChatSocket({ 
    roomId: roomId, 
    onMessageReceived: handleIncomingMessage 
  });

  useEffect(() => {
  async function initializeChat() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token || !session?.user) {
        setLoading(false);
        return;
      }

      setCurrentUserId(session.user.id);

      // 1. Robust Event Title Fetching
      try {
        let res = await fetch(`/api/events/${roomId}`, { headers: { "Authorization": `Bearer ${token}` } });
        if (!res.ok) res = await fetch(`/api/event/${roomId}`, { headers: { "Authorization": `Bearer ${token}` } });
        
        if (res.ok) {
          const data = await res.json();
          const name = data.eventname || data.title || data.name || data.event?.eventname;
          if (name) setEventTitle(name);
        } else {
          console.warn("Event API route not found. Header will remain default.");
        }
      } catch (e) {}

      // 2. Fetch Chat Transcripts
      const historyResponse = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      // 🔒 SECURITY CHECK: If the API returns a 403, flag it immediately
      if (historyResponse.status === 403) {
        setIsNotMember(true);
        setEventTitle("Access Denied");
        setLoading(false);
        return;
      }

      if (historyResponse.ok) {
        const data = await historyResponse.json();
        setMessages(data.reverse());
        // Reset state in case they previously had an error
        setIsNotMember(false); 
        setTimeout(() => scrollToBottom("auto"), 100);
      }
    } catch (err) {
      console.error("Initialization error:", err);
    } finally {
      setLoading(false);
    }
  }

  initializeChat();
}, [roomId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !currentUserId) return;

    setInput("");

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      content: text,
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      sender: {
        email: "You"
      }
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content: text }),
      });

      if (res.ok) {
        const sentMessage = await res.json();
        setMessages((prev) => 
          prev.map((msg) => (msg.id === tempId ? sentMessage : msg))
        );
      } else {
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      }
    } catch (err) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    }
  };

  if (loading) {
    return (
      <main className="fixed inset-0 bg-[#020202] text-[#b792ea] flex flex-col items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#b792ea] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-[11px] font-medium tracking-widest text-white/40 uppercase">Connecting</p>
      </main>
    );
  }

  if (isNotMember) {
  return (
    <main className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">
        ✕
      </div>
      <h2 className="text-md font-semibold mb-1">Access Denied</h2>
      <p className="text-xs text-white/40 max-w-xs mb-6">
        You must be registered for this event to access the group discussion channel.
      </p>
      <Link 
        href={`/events/${roomId}`} 
        className="px-5 py-2 rounded-full bg-white text-black font-medium text-xs active:scale-95 transition"
      >
        Back to Event Details
      </Link>
    </main>
  );
}

  return (
    // 💡 FIX 2: Fixed Bounds Layout. 
    // Absolute positioning pinned to the top, left, right, and leaving EXACTLY 64px for your global navbar.
    <main className="fixed inset-x-0 top-0 bottom-[56px] max-w-md mx-auto flex flex-col bg-black text-white border-x border-white/5">
      
      {/* ================= HEADER BAR ================= */}
      <div className="flex h-14 shrink-0 items-center justify-between px-4 border-b border-white/5 bg-[#0a0a0a] z-30">
        <Link href="/events" className="text-[#b792ea] opacity-80 hover:opacity-100 transition p-1 -ml-1">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center justify-center gap-2 max-w-[70%]">
          <h1 className="text-sm font-semibold tracking-wide text-white truncate">{eventTitle}</h1>
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500 animate-pulse"}`} />
        </div>
        <div className="w-6" /> {/* Spacer for centering */}
      </div>

      {/* ================= CHAT MESSAGES WINDOW ================= */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-none bg-[#020202]">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          // Fallback cascades safely
          const displayName = isMe ? "You" : msg.sender?.username || msg.sender?.email?.split("@")[0] || "User";

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              {!isMe && (
                <span className="text-[10px] text-white/40 mb-1 ml-1 font-medium tracking-wide">
                  {displayName}
                </span>
              )}
              <div 
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[14px] leading-5 shadow-sm border ${
                  isMe 
                    ? "bg-[#b792ea] border-[#cbb3f0]/20 text-black font-medium rounded-br-sm" 
                    : "bg-[#161618] border-white/5 text-white/95 rounded-tl-sm"
                }`}
              >
                <p className="break-words">{msg.content}</p>
                <span 
                  className={`text-[9px] block text-right mt-1.5 font-normal ${
                    isMe ? "text-black/50" : "text-white/30"
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}
        {/* Invisible target element for scrolling */}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* ================= INPUT CONTROLS LAYER ================= */}
      <form onSubmit={handleSend} className="shrink-0 p-3 bg-[#0a0a0a] border-t border-white/5 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message conversation..."
          className="flex-1 rounded-full border border-white/10 bg-[#121214] px-4 py-2.5 text-sm text-white outline-none focus:border-[#b792ea] transition placeholder:text-white/20"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="h-9 w-9 shrink-0 rounded-full bg-[#b792ea] flex items-center justify-center text-black active:scale-95 transition disabled:opacity-30 disabled:scale-100"
        >
          <Send className="h-3.5 w-3.5 ml-[-2px]" />
        </button>
      </form>

    </main>
  );
}
