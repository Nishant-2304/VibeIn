"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useChatSocket } from "../../../hooks/useChatSocket";
import { ArrowLeft, Send, User } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function DirectMessageRoomPage({ params }: { params: { id: string } }) {
  const roomId = params.id;
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [partnerName, setPartnerName] = useState("Conversation");
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior });
    }
  };

  // Instantly lock baseline viewport on mutations
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
    async function initializeDM() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token || !session?.user) {
          setLoading(false);
          return;
        }

        const myId = session.user.id;
        setCurrentUserId(myId);

        // 1. Fetch Chat Room Details to identify the other person in the DM
        const roomRes = await fetch(`/api/chat/rooms/${roomId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (roomRes.ok) {
          const roomData = await roomRes.json();
          // Find the member array item that isn't the current user
          const partner = roomData.members?.find((m: any) => m.userId !== myId);
          
          if (partner?.userId) {
            setPartnerId(partner.userId);
            // Fetch partner's profile metadata for the screen header title
            const profileRes = await fetch(`/api/users/${partner.userId}`);
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              
              // 💡 UPDATE: Swap out displayName and use username matching the schema field options
              if (profileData.username) {
                setPartnerName(profileData.username);
              } else if (profileData.displayName) {
                setPartnerName(profileData.displayName);
              }
            }
          }
        }

        // 2. Fetch Chat Transcripts
        const historyResponse = await fetch(`/api/chat/rooms/${roomId}/messages`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (historyResponse.ok) {
          const data = await historyResponse.json();
          setMessages(data.reverse());
          setTimeout(() => scrollToBottom("auto"), 100);
        }
      } catch (err) {
        console.error("DM layout sync process lifecycle exception error:", err);
      } finally {
        setLoading(false);
      }
    }

    initializeDM();
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
      sender: { email: "You" }
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
        <p className="text-[11px] font-medium tracking-widest text-white/40 uppercase">Loading Thread</p>
      </main>
    );
  }

  return (
    // Anchored absolutely flush exactly 56px above your global bottom navigation tray
    <main className="fixed inset-x-0 top-0 bottom-[56px] max-w-md mx-auto flex flex-col bg-black text-white border-x border-white/5">
      
      {/* ================= HEADER BAR ================= */}
      <div className="flex h-14 shrink-0 items-center justify-between px-4 border-b border-white/5 bg-[#0a0a0a] z-30">
        <Link href="/chat" className="text-[#b792ea] opacity-80 hover:opacity-100 transition p-1 -ml-1">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        
        <div className="flex items-center justify-center gap-2 max-w-[70%]">
          {partnerId ? (
            <Link href={`/user/${partnerId}`} className="hover:underline flex items-center gap-2 truncate">
              <h1 className="text-sm font-semibold tracking-wide text-white truncate">{partnerName}</h1>
            </Link>
          ) : (
            <h1 className="text-sm font-semibold tracking-wide text-white truncate">{partnerName}</h1>
          )}
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500 animate-pulse"}`} />
        </div>
        
        <div className="w-6 shrink-0 flex justify-end">
          {partnerId && (
            <Link href={`/user/${partnerId}`} className="text-white/40 hover:text-white/80 transition">
              <User className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* ================= CHAT MESSAGES WINDOW ================= */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-none bg-[#020202]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-60 space-y-3 pb-10">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#b792ea]/20 to-[#b792ea]/5 flex items-center justify-center mb-2 border border-[#b792ea]/20 shadow-[0_0_15px_rgba(183,146,234,0.1)]">
              <span className="text-3xl animate-bounce" style={{ animationDuration: '2s' }}>👋</span>
            </div>
            <p className="text-sm font-semibold text-white/90 tracking-wide">No messages yet</p>
            <p className="text-xs text-white/50 text-center max-w-[200px] leading-relaxed">
              Be the first to break the ice! Say hi to {partnerName === "Conversation" ? "them" : partnerName}.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
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
          })
        )}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* ================= INPUT CONTROLS LAYER ================= */}
      <form onSubmit={handleSend} className="shrink-0 p-3 bg-[#0a0a0a] border-t border-white/5 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message ${partnerName === "Conversation" ? "conversation" : partnerName}...`}
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