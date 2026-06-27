import { Server, Socket } from "socket.io";
import { authenticateSocket } from "./auth";
import { registerCustomerSocketHandlers } from "./customer.socket";
import { initializeKitchenSockets } from "./kitchen.socket";
import { initializeServerSockets } from "./server.socket";
import { logger } from "../config/logger";

const DEFAULT_SOCKET_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_SOCKET_RATE_LIMIT_MAX = 30;

const socketAttempts = new Map<string, { count: number; resetAt: number }>();

const parseEnvInteger = (name: string, fallback: number) => {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getSocketRateLimitConfig = () => ({
  windowMs: parseEnvInteger("SOCKET_RATE_LIMIT_WINDOW_MS", DEFAULT_SOCKET_RATE_LIMIT_WINDOW_MS),
  max: parseEnvInteger("SOCKET_RATE_LIMIT_MAX", DEFAULT_SOCKET_RATE_LIMIT_MAX),
});

const socketRateLimit = (socket: Socket, next: (error?: Error) => void) => {
  const { windowMs, max } = getSocketRateLimitConfig();
  const now = Date.now();
  const ip = socket.handshake.address || "unknown";
  const current = socketAttempts.get(ip);
  const nextAttempt = current && current.resetAt > now
    ? { count: current.count + 1, resetAt: current.resetAt }
    : { count: 1, resetAt: now + windowMs };

  socketAttempts.set(ip, nextAttempt);

  if (nextAttempt.count > max) {
    logger.warn("rate_limit:breach", {
      timestamp: new Date().toISOString(),
      requestId: null,
      correlationId: null,
      ip,
      endpoint: "socket.io",
      method: "CONNECT",
      tier: "socket",
      limit: max,
      windowMs,
    });
    return next(new Error("Too many socket connection attempts"));
  }

  return next();
};

const initializeCustomerSockets = (io: Server) => {
  io.on("connection", (socket) => {
    socket.emit("connected", { socketId: socket.id });
    registerCustomerSocketHandlers(io, socket);

    logger.info("socket:connect", {
      socketId: socket.id,
      transport: socket.conn.transport.name,
      ip: socket.handshake.address,
    });

    socket.on("disconnect", (reason) => {
      logger.info("socket:disconnect", {
        socketId: socket.id,
        reason,
      });
    });
  });
};

export const initializeSockets = (io: Server) => {
  io.use(socketRateLimit);
  io.use(authenticateSocket);
  initializeCustomerSockets(io);
  initializeKitchenSockets(io);
  initializeServerSockets(io);
};

export const registerSocketHandlers = initializeSockets;
