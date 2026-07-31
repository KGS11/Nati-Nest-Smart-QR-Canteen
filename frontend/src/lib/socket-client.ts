import { io, Socket } from "socket.io-client";
import { env } from "@/config/env";

export const createSocketConnection = (
  token: string,
  type: "staff" | "customer",
): Socket => {
  const socket = io(env.socketUrl, {
    autoConnect: false,
    auth: { token, type },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.debug("perf:socket:connect", {
      type,
      socketId: socket.id,
      url: env.socketUrl,
      transport: socket.io.engine.transport.name,
    });
  });

  socket.onAny((event, payload) => {
    const emittedAt =
      payload && typeof payload === "object" && "emittedAt" in payload && typeof payload.emittedAt === "string"
        ? Date.parse(payload.emittedAt)
        : null;
    console.debug("perf:socket:receive", {
      type,
      event,
      emitToReceiveMs: emittedAt ? Date.now() - emittedAt : null,
    });
  });

  socket.onAnyOutgoing((event) => {
    console.debug("perf:socket:emit", {
      type,
      event,
    });
  });

  return socket;
};
