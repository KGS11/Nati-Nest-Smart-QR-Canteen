import { Role } from "@prisma/client";
import { Server } from "socket.io";
import { prisma } from "../config/db";
import { ROOMS } from "./rooms";

const serverRoles: Role[] = [Role.SERVER, Role.ADMIN];

export const initializeServerSockets = (io: Server) => {
  io.on("connection", (socket) => {
    socket.on("server:join", async () => {
      try {
        const auth = socket.data.auth;
        if (!auth || auth.type !== "staff" || !serverRoles.includes(auth.role)) {
          socket.emit("server:error", { message: "Access denied. Server staff only." });
          return;
        }

        const user = await prisma.user.findUnique({
          where: { id: auth.userId },
          select: { name: true, isActive: true },
        });

        if (!user || !user.isActive) {
          socket.emit("server:error", { message: "Account not found or deactivated." });
          return;
        }

        if (auth.role === Role.ADMIN) {
          await socket.join(ROOMS.admin);
        }

        await socket.join(ROOMS.server);
        await socket.join(ROOMS.waiter(auth.userId));
        socket.emit("server:joined", {
          message: "Connected to server dashboard",
          staffName: user.name,
        });
      } catch (_error) {
        socket.emit("server:error", { message: "Invalid staff token" });
      }
    });

    socket.on("disconnect", () => {
      if (process.env.NODE_ENV === "development") {
        console.log(`Server socket disconnected: ${socket.id}`);
      }
    });
  });
};
