import { Role, SessionStatus } from "@prisma/client";
import jwt from "jsonwebtoken";
import { Socket } from "socket.io";
import { prisma } from "../config/db";
import { verifySessionJWT } from "../utils/session.utils";

type StaffJwtPayload = {
  userId: string;
  role: Role;
  name: string;
};

export type SocketAuthData =
  | {
      type: "staff";
      token: string;
      userId: string;
      role: Role;
      name: string;
    }
  | {
      type: "customer";
      token: string;
      sessionId: string;
      tableId: string;
      tableNumber: string;
    };

const getHandshakeAuth = (socket: Socket) => {
  const { token, type } = socket.handshake.auth ?? {};

  if (typeof token !== "string" || typeof type !== "string") {
    return null;
  }

  return { token, type };
};

export const authenticateSocket = async (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  try {
    const auth = getHandshakeAuth(socket);

    if (!auth) {
      return next(new Error("Socket authentication required"));
    }

    if (auth.type === "staff") {
      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        return next(new Error("Socket authentication unavailable"));
      }

      const payload = jwt.verify(auth.token, jwtSecret) as StaffJwtPayload;
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, name: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        return next(new Error("Invalid staff socket token"));
      }

      socket.data.auth = {
        type: "staff",
        token: auth.token,
        userId: user.id,
        role: user.role,
        name: user.name,
      } satisfies SocketAuthData;
      return next();
    }

    if (auth.type === "customer") {
      const payload = verifySessionJWT(auth.token);

      if (!payload) {
        return next(new Error("Invalid customer socket token"));
      }

      const session = await prisma.tableSession.findUnique({
        where: { id: payload.sessionId },
        select: { id: true, status: true, tableId: true },
      });

      if (!session || session.status !== SessionStatus.ACTIVE) {
        return next(new Error("Invalid customer socket session"));
      }

      socket.data.auth = {
        type: "customer",
        token: auth.token,
        sessionId: payload.sessionId,
        tableId: payload.tableId,
        tableNumber: payload.tableNumber,
      } satisfies SocketAuthData;
      return next();
    }

    return next(new Error("Unsupported socket authentication type"));
  } catch (_error) {
    return next(new Error("Invalid socket token"));
  }
};
