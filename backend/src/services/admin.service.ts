import { prisma } from "../config/db";
import { OrderStatus, Role } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { ROOMS } from "../sockets/rooms";

const getIo = () => {
  const { io } = require("../index");
  return io;
};

export class AdminService {
  async reassignKitchen(orderId: string, staffId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new AppError("Order not found", 404);

    const staff = await prisma.user.findUnique({
      where: { id: staffId },
    });
    if (!staff || staff.role !== Role.KITCHEN) {
      throw new AppError("Invalid kitchen staff member.", 400);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        assignedKitchenId: staff.id,
        assignedKitchenName: staff.name,
        status: order.status === OrderStatus.PLACED ? OrderStatus.ACCEPTED : order.status,
        acceptedAt: order.acceptedAt ?? new Date(),
      },
    });

    await prisma.orderAssignmentHistory.create({
      data: {
        orderId,
        staffId: staff.id,
        role: Role.KITCHEN,
        action: "REASSIGNED",
      },
    });

    const io = getIo();
    io.to(ROOMS.kitchen).emit("order:reassigned", {
      orderId,
      assignedKitchenId: staff.id,
      assignedKitchenName: staff.name,
      role: Role.KITCHEN,
      status: updatedOrder.status,
    });

    return updatedOrder;
  }

  async reassignWaiter(orderId: string, staffId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new AppError("Order not found", 404);

    const staff = await prisma.user.findUnique({
      where: { id: staffId },
    });
    if (!staff || staff.role !== Role.SERVER) {
      throw new AppError("Invalid waiter staff member.", 400);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        assignedWaiterId: staff.id,
        assignedWaiterName: staff.name,
        assignedAt: new Date(),
      },
    });

    await prisma.orderAssignmentHistory.create({
      data: {
        orderId,
        staffId: staff.id,
        role: Role.SERVER,
        action: "REASSIGNED",
      },
    });

    const io = getIo();
    io.to(ROOMS.server).emit("order:reassigned", {
      orderId,
      assignedWaiterId: staff.id,
      assignedWaiterName: staff.name,
      role: Role.SERVER,
      status: order.status,
    });

    return updatedOrder;
  }

  async forceUnclaimKitchen(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new AppError("Order not found", 404);
    if (!order.assignedKitchenId) throw new AppError("Order is not claimed.", 400);

    const staffId = order.assignedKitchenId;
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PLACED,
        assignedKitchenId: null,
        assignedKitchenName: null,
        acceptedAt: null,
        preparingAt: null,
      },
    });

    await prisma.orderAssignmentHistory.create({
      data: {
        orderId,
        staffId,
        role: Role.KITCHEN,
        action: "RELEASED",
      },
    });

    const io = getIo();
    io.to(ROOMS.kitchen).emit("order:released", {
      orderId,
      role: Role.KITCHEN,
      status: OrderStatus.PLACED,
    });
    io.to(ROOMS.server).emit("order:released", {
      orderId,
      role: Role.KITCHEN,
      status: OrderStatus.PLACED,
    });

    return updatedOrder;
  }

  async forceUnclaimWaiter(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new AppError("Order not found", 404);
    if (!order.assignedWaiterId) throw new AppError("Delivery is not claimed.", 400);

    const staffId = order.assignedWaiterId;
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        assignedWaiterId: null,
        assignedWaiterName: null,
        assignedAt: null,
      },
    });

    await prisma.orderAssignmentHistory.create({
      data: {
        orderId,
        staffId,
        role: Role.SERVER,
        action: "RELEASED",
      },
    });

    const io = getIo();
    io.to(ROOMS.server).emit("order:released", {
      orderId,
      role: Role.SERVER,
      status: order.status,
    });

    return updatedOrder;
  }

  async forceDeliver(orderId: string, adminId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new AppError("Order not found", 404);
    if (order.status !== OrderStatus.READY && order.status !== OrderStatus.PREPARING && order.status !== OrderStatus.ACCEPTED) {
      throw new AppError("Order is not in deliverable status.", 400);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.DELIVERED,
        deliveredAt: new Date(),
        deliveredBy: "Admin",
      },
    });

    await prisma.orderAssignmentHistory.create({
      data: {
        orderId,
        staffId: adminId,
        role: Role.ADMIN,
        action: "DELIVERED",
      },
    });

    const payload = {
      orderId,
      status: OrderStatus.DELIVERED,
      deliveredAt: updatedOrder.deliveredAt,
    };
    const io = getIo();
    io.to(ROOMS.server).emit("order:status_updated", payload);
    io.to(ROOMS.kitchen).emit("order:status_updated", payload);

    return updatedOrder;
  }

  async getAssignmentHistory(orderId: string) {
    return prisma.orderAssignmentHistory.findMany({
      where: { orderId },
      orderBy: { timestamp: "desc" },
      include: {
        staff: {
          select: { name: true, role: true },
        },
      },
    });
  }
}

export const adminService = new AdminService();
