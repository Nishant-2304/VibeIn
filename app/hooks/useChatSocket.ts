import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface UseChatSocketOptions {
  roomId: string;
  onMessageReceived: (message: any) => void;
}

export function useChatSocket({ roomId, onMessageReceived }: UseChatSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let active = true;
    let reconnectTimeout: NodeJS.Timeout;

    async function connect() {
      try {
        // 1. Fetch the active user session token from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !active) return;

        // 2. Point to your standalone socket server instance
        // In production, swap 'localhost:8080' with your live service URL
        // Make sure it looks clean like this:
        const socketUrl = `ws://localhost:8080?token=${session.access_token}`;
        
        const socket = new WebSocket(socketUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (active) setIsConnected(true);
          console.log("🔌 Connected to VibeIn Chat Broker");
        };

        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            
            // If it's a new message event and belongs to our active room, fire the callback
            if (payload.type === "NEW_MESSAGE" && payload.data.roomId === roomId) {
              onMessageReceived(payload.data);
            }
          } catch (err) {
            console.error("Failed to parse incoming WS message stream:", err);
          }
        };

        socket.onclose = () => {
          if (active) {
            setIsConnected(false);
            console.log("❌ Connection lost. Retrying in 3 seconds...");
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };

        socket.onerror = (err) => {
          console.error("WebSocket error state:", err);
        };
      } catch (err) {
        console.error("Initialization error in socket broker hook:", err);
      }
    }

    connect();

    // Cleanup routines on component unmount
    return () => {
      active = false;
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomId, onMessageReceived]);

  return { isConnected };
}