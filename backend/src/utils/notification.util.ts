import { Server } from "socket.io";
import { prisma } from "../config/db";
import { ROOMS } from "../sockets/rooms";

const getIo = (): Server => {
  const { io } = require("../index") as typeof import("../index");
  return io;
};

export async function notifyWaiter(
  sessionId: string,
  event: string,
  payload: Record<string, unknown>,
  strictAssignedOnly: boolean = false
): Promise<void> {
  const session = await prisma.tableSession.findUnique({
    where: { id: sessionId },
    select: { assignedWaiterId: true },
  });

  const io = getIo();
  if (session?.assignedWaiterId) {
    io.to(ROOMS.waiter(session.assignedWaiterId)).emit(event, payload);
  } else if (!strictAssignedOnly) {
    io.to(ROOMS.server).emit(event, payload);
  }
}
