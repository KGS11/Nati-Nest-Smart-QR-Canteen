import { Server } from "socket.io";
import { prisma } from "../config/db";
import { ROOMS } from "../sockets/rooms";

const getIo = (): Server => {
  try {
    const { io } = require("../index") as typeof import("../index");
    return io;
  } catch (error) {
    if (process.env.NODE_ENV === "test") {
      return { to: () => ({ emit: () => undefined }) } as unknown as Server;
    }
    throw error;
  }
};

export async function notifyWaiter(
  sessionId: string,
  event: string,
  payload: Record<string, unknown>,
  strictAssignedOnly: boolean = false
): Promise<void> {
  const session = prisma.tableSession?.findUnique
    ? await prisma.tableSession.findUnique({
        where: { id: sessionId },
        select: { assignedWaiterId: true },
      })
    : null;

  const io = getIo();
  if (session?.assignedWaiterId) {
    io.to(ROOMS.waiter(session.assignedWaiterId)).emit(event, payload);
  } else if (!strictAssignedOnly) {
    io.to(ROOMS.server).emit(event, payload);
  }
}
