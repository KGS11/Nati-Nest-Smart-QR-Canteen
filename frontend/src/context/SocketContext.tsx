"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { createSocketConnection } from "@/lib/socket-client";
import { useAuthStore } from "@/stores/authStore";
import { useSessionStore } from "@/stores/sessionStore";
import { Role } from "@/types";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token: staffToken, user } = useAuthStore();
  const { sessionToken, sessionId } = useSessionStore();

  useEffect(() => {
    let activeSocket: Socket | null = null;

    if (staffToken && user) {
      activeSocket = createSocketConnection(staffToken, "staff");
      activeSocket.on("connect", () => {
        setIsConnected(true);
        if (user.role === Role.KITCHEN) {
          activeSocket?.emit("kitchen:join", { staffToken });
        } else if (user.role === Role.SERVER) {
          activeSocket?.emit("server:join", { staffToken });
        } else if (user.role === Role.ADMIN) {
          activeSocket?.emit("kitchen:join", { staffToken });
          activeSocket?.emit("server:join", { staffToken });
        }
      });
    } else if (sessionToken && sessionId) {
      activeSocket = createSocketConnection(sessionToken, "customer");
      activeSocket.on("connect", () => {
        setIsConnected(true);
        activeSocket?.emit("join:session", { sessionId });
      });
    }

    if (activeSocket) {
      activeSocket.connect();
      setSocket(activeSocket);
      activeSocket.on("disconnect", () => setIsConnected(false));
      activeSocket.on("connect_error", () => setIsConnected(false));
    }

    return () => {
      if (activeSocket) {
        activeSocket.disconnect();
        activeSocket.off();
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, [staffToken, user, sessionToken, sessionId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>
  );
}

export const useSocketContext = () => useContext(SocketContext);
