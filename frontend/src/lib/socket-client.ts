import { io, Socket } from "socket.io-client";
import { env } from "@/config/env";

export const createSocketConnection = (
  token: string,
  type: "staff" | "customer",
): Socket => {
  return io(env.socketUrl, {
    autoConnect: false,
    auth: { token, type },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ["websocket"],
  });
};
