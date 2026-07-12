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
    let pingInterval: NodeJS.Timeout;

    async function connect() {
      try {
        // 1. Fetch the active user session token from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !active) return;

        const token = session.access_token;

        // 2. Point to your standalone socket server instance and clean up the URL formatting
        const rawUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "ws://localhost:10000";
        const baseSocketUrl = rawUrl.replace(/^http/, "ws").replace(/\/$/, "");
        
        // 3. Append the authenticated token cleanly as a encoded query parameter
        const socketUrl = `${baseSocketUrl}?token=${encodeURIComponent(token)}`;
        
        console.log("🔌 Attempting connection to:", baseSocketUrl);
        const socket = new WebSocket(socketUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (!active) return;
          setIsConnected(true);
          console.log("🟢 Connected to VibeIn Chat Broker");

          // Start a heartbeat ping interval every 30 seconds to keep Render awake
          pingInterval = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: "ping" }));
            }
          }, 30000);
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
          clearInterval(pingInterval);
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
      clearInterval(pingInterval);
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomId, onMessageReceived]);

  return { isConnected };
}