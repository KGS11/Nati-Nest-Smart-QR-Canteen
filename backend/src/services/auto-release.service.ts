import { prisma } from "../config/db";
import { OrderStatus, Role } from "@prisma/client";
import { logger } from "../config/logger";
import { ROOMS } from "../sockets/rooms";

const getIo = () => {
  const { io } = require("../index");
  return io;
};

export async function checkAutoReleaseClaims() {
  try {
    const timeoutSetting = await prisma.settings.findUnique({
      where: { key: "claim_timeout_minutes" },
    });
    const timeoutMinutes = timeoutSetting ? parseInt(timeoutSetting.value, 10) : 10;
    const thresholdMs = timeoutMinutes * 60 * 1000;
    const now = new Date();

    const kitchenThresholdDate = new Date(now.getTime() - thresholdMs);

    // Get Placed/Accepted/Preparing kitchen claims to release
    const acceptedClaimsToRelease = await prisma.order.findMany({
      where: {
        status: OrderStatus.ACCEPTED,
        assignedKitchenId: { not: null },
        acceptedAt: { lt: kitchenThresholdDate },
      },
    });

    const preparingClaimsToRelease = await prisma.order.findMany({
      where: {
        status: OrderStatus.PREPARING,
        assignedKitchenId: { not: null },
        preparingAt: { lt: kitchenThresholdDate },
      },
    });

    const kitchenReleases = [...acceptedClaimsToRelease, ...preparingClaimsToRelease];

    for (const order of kitchenReleases) {
      const staffId = order.assignedKitchenId!;
      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.PLACED,
            assignedKitchenId: null,
            assignedKitchenName: null,
            acceptedAt: null,
            preparingAt: null,
          },
        }),
        prisma.orderAssignmentHistory.create({
          data: {
            orderId: order.id,
            staffId,
            role: Role.KITCHEN,
            action: "RELEASED",
          },
        }),
      ]);

      const io = getIo();
      if (io) {
        io.to(ROOMS.kitchen).emit("order:released", {
          orderId: order.id,
          role: Role.KITCHEN,
          status: OrderStatus.PLACED,
        });
        io.to(ROOMS.server).emit("order:released", {
          orderId: order.id,
          role: Role.KITCHEN,
          status: OrderStatus.PLACED,
        });
      }
      logger.info(`Auto-released kitchen order ${order.id} due to inactivity.`);
    }

    const waiterThresholdDate = new Date(now.getTime() - thresholdMs);
    const waiterClaimsToRelease = await prisma.order.findMany({
      where: {
        status: OrderStatus.READY,
        assignedWaiterId: { not: null },
        assignedAt: { lt: waiterThresholdDate },
      },
    });

    for (const order of waiterClaimsToRelease) {
      const staffId = order.assignedWaiterId!;
      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: {
            assignedWaiterId: null,
            assignedWaiterName: null,
            assignedAt: null,
          },
        }),
        prisma.orderAssignmentHistory.create({
          data: {
            orderId: order.id,
            staffId,
            role: Role.SERVER,
            action: "RELEASED",
          },
        }),
      ]);

      const io = getIo();
      if (io) {
        io.to(ROOMS.server).emit("order:released", {
          orderId: order.id,
          role: Role.SERVER,
          status: OrderStatus.READY,
        });
      }
      logger.info(`Auto-released waiter delivery order ${order.id} due to inactivity.`);
    }
  } catch (error) {
    logger.error("Error running auto-release check:", error);
  }
}
