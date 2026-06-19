import { Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { z } from "zod";
import { prisma } from "../config/db";
import { ROOMS } from "./rooms";

type StaffJwtPayload = {
  userId: string;
  role: Role;
  name: string;
};

const serverRoles: Role[] = [Role.SERVER, Role.ADMIN];
const joinServerSchema = z.object({
  staffToken: z.string().min(1).optional(),
});

export const initializeServerSockets = (io: Server) => {
  io.on("connection", (socket) => {
    socket.on("server:join", async (eventPayload: unknown) => {
      try {
        const parsedPayload = joinServerSchema.safeParse(eventPayload);

        if (!parsedPayload.success) {
          socket.emit("server:error", { message: "Invalid server join payload" });
          return;
        }

        const jwtSecret = process.env.JWT_SECRET;
        const staffToken = parsedPayload.data.staffToken ?? socket.data.auth?.token;

        if (!staffToken || !jwtSecret) {
          socket.emit("server:error", { message: "Invalid staff token" });
          return;
        }

        let jwtPayload: StaffJwtPayload;

        try {
          jwtPayload = jwt.verify(staffToken, jwtSecret) as StaffJwtPayload;
        } catch (_error) {
          socket.emit("server:error", { message: "Invalid staff token" });
          return;
        }

        if (!serverRoles.includes(jwtPayload.role)) {
          socket.emit("server:error", { message: "Access denied. Server staff only." });
          return;
        }

        const user = await prisma.user.findUnique({
          where: { id: jwtPayload.userId },
          select: { name: true, isActive: true },
        });

        if (!user || !user.isActive) {
          socket.emit("server:error", { message: "Account not found or deactivated." });
          return;
        }

        await socket.join(ROOMS.server);
        await socket.join(ROOMS.waiter(jwtPayload.userId));
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
