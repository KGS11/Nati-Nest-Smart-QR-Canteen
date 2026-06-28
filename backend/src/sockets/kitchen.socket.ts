import { Role } from "@prisma/client";
import { Server } from "socket.io";
import { prisma } from "../config/db";
import { ROOMS } from "./rooms";

const kitchenRoles: Role[] = [Role.KITCHEN, Role.ADMIN];

export const initializeKitchenSockets = (io: Server) => {
  io.on("connection", (socket) => {
    socket.on("kitchen:join", async () => {
      try {
        const auth = socket.data.auth;
        if (!auth || auth.type !== "staff" || !kitchenRoles.includes(auth.role)) {
          socket.emit("kitchen:error", { message: "Access denied. Kitchen staff only." });
          return;
        }

        const user = await prisma.user.findUnique({
          where: { id: auth.userId },
          select: { name: true, isActive: true },
        });

        if (!user || !user.isActive) {
          socket.emit("error", { message: "Account not found or deactivated." });
          return;
        }

        await socket.join(ROOMS.kitchen);
        socket.emit("kitchen:joined", {
          message: "Connected to kitchen dashboard",
          staffName: user.name,
        });
      } catch (_error) {
        socket.emit("kitchen:error", { message: "Invalid staff token" });
      }
    });

    socket.on("disconnect", () => {
      if (process.env.NODE_ENV === "development") {
        console.log(`Kitchen socket disconnected: ${socket.id}`);
      }
    });
  });
};
