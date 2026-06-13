import { Server } from "socket.io";
import { authenticateSocket } from "./auth";
import { registerCustomerSocketHandlers } from "./customer.socket";
import { initializeKitchenSockets } from "./kitchen.socket";
import { initializeServerSockets } from "./server.socket";

const initializeCustomerSockets = (io: Server) => {
  io.on("connection", (socket) => {
    socket.emit("connected", { socketId: socket.id });
    registerCustomerSocketHandlers(io, socket);
  });
};

export const initializeSockets = (io: Server) => {
  io.use(authenticateSocket);
  initializeCustomerSockets(io);
  initializeKitchenSockets(io);
  initializeServerSockets(io);
};

export const registerSocketHandlers = initializeSockets;
