import { Server, Socket } from "socket.io";
import { SessionStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/db";
import { ROOMS } from "./rooms";

type JoinSessionPayload = {
  sessionId?: string;
};

const joinSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

const joinSession = async (socket: Socket, payload: JoinSessionPayload) => {
  try {
    const parsedPayload = joinSessionSchema.safeParse(payload);

    if (!parsedPayload.success) {
      socket.emit("session:error", {
        message: "Invalid session.",
      });
      return;
    }

    const session = await prisma.tableSession.findUnique({
      where: { id: parsedPayload.data.sessionId },
      include: {
        table: {
          select: {
            id: true,
            tableNumber: true,
          },
        },
      },
    });

    if (!session || session.status !== SessionStatus.ACTIVE) {
      socket.emit("session:error", {
        message: "Invalid or inactive session.",
      });
      return;
    }

    const sessionRoom = ROOMS.session(session.id);
    const tableRoom = ROOMS.table(session.tableId);

    await socket.join(sessionRoom);
    await socket.join(tableRoom);

    socket.emit("joined:session", {
      sessionId: session.id,
      tableId: session.tableId,
      tableNumber: session.table.tableNumber,
      rooms: {
        session: sessionRoom,
        table: tableRoom,
      },
    });
  } catch (_error) {
    socket.emit("session:error", {
      message: "Unable to join session.",
    });
  }
};

export const registerCustomerSocketHandlers = (_io: Server, socket: Socket) => {
  socket.on("join:session", async (payload: JoinSessionPayload) => {
    await joinSession(socket, payload);
  });

  socket.on("join_session", async (payload: JoinSessionPayload) => {
    await joinSession(socket, payload);
  });
};
