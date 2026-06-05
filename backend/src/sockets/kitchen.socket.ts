import { Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { prisma } from "../config/db";
import { ROOMS } from "./rooms";

type StaffJwtPayload = {
  userId: string;
  role: Role;
  name: string;
};

const kitchenRoles: Role[] = [Role.KITCHEN, Role.ADMIN];

export const initializeKitchenSockets = (io: Server) => {
  io.on("connection", (socket) => {
    socket.on("kitchen:join", async ({ staffToken }: { staffToken?: string }) => {
      try {
        const jwtSecret = process.env.JWT_SECRET;

        if (!staffToken || !jwtSecret) {
          socket.emit("kitchen:error", { message: "Invalid staff token" });
          return;
        }

        let payload: StaffJwtPayload;

        try {
          payload = jwt.verify(staffToken, jwtSecret) as StaffJwtPayload;
        } catch (_error) {
          socket.emit("kitchen:error", { message: "Invalid staff token" });
          return;
        }

        if (!kitchenRoles.includes(payload.role)) {
          socket.emit("kitchen:error", { message: "Access denied. Kitchen staff only." });
          return;
        }

        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
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
