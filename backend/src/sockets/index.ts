import { Server } from "socket.io";
import { authenticateSocket } from "./auth";
import { registerCustomerSocketHandlers } from "./customer.socket";
import { initializeKitchenSockets } from "./kitchen.socket";
import { initializeServerSockets } from "./server.socket";
import { logger } from "../config/logger";

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
  io.use(authenticateSocket);
  initializeCustomerSockets(io);
  initializeKitchenSockets(io);
  initializeServerSockets(io);
};

export const registerSocketHandlers = initializeSockets;
