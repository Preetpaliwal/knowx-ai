import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useCompetitionSocket(competitionId: string | null, participantId: string | null, isHost: boolean = false) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!competitionId) return;

    // Create socket connection
    const socket = io("http://localhost:8000", {
      path: "/ws/socket.io",
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setIsConnected(true);
      setError(null);

      // Join competition room
      socket.emit("join_competition_room", {
        competitionId,
        participantId,
        isHost,
      });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socket.on("error", (err: any) => {
      console.error("Socket error:", err);
      setError(err.message || "Connection error");
    });

    socket.on("joined_competition", (data: any) => {
      console.log("Joined competition:", data);
    });

    return () => {
      if (socket) {
        socket.emit("leave_competition_room", { competitionId });
        socket.disconnect();
      }
    };
  }, [competitionId, participantId, isHost]);

  const on = (event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
  };

  const off = (event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.off(event, handler);
  };

  const emit = (event: string, data: any) => {
    socketRef.current?.emit(event, data);
  };

  return {
    socket: socketRef.current,
    isConnected,
    error,
    on,
    off,
    emit,
  };
}
