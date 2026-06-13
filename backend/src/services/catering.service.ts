import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { ROOMS } from "../sockets/rooms";
import { AppError } from "../utils/AppError";
import {
  CreateCateringLeadInput,
  ListCateringLeadsInput,
  UpdateCateringLeadStatusInput,
} from "../validators/catering.validators";

const getIo = () => {
  const { io } = require("../index") as typeof import("../index");
  return io;
};

const serializeLead = <T extends { eventDate: Date; createdAt: Date; updatedAt: Date }>(
  lead: T,
) => ({
  ...lead,
  eventDate: lead.eventDate.toISOString(),
  createdAt: lead.createdAt.toISOString(),
  updatedAt: lead.updatedAt.toISOString(),
});

export class CateringService {
  async createLead(sessionId: string, data: CreateCateringLeadInput) {
    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: { table: { select: { tableNumber: true } } },
    });

    if (!session) {
      throw new AppError("Session not found.", 404);
    }

    const lead = await prisma.cateringLead.create({
      data: {
        sessionId,
        name: data.name,
        phone: data.phone,
        eventType: data.eventType,
        eventDate: new Date(data.eventDate),
        guestCount: data.guestCount,
        location: data.location,
        notes: data.notes,
        preferredContactTime: data.preferredContactTime,
      },
    });

    const eventPayload = {
      leadId: lead.id,
      name: lead.name,
      phone: lead.phone,
      eventType: lead.eventType,
      eventDate: lead.eventDate,
      guestCount: lead.guestCount,
      tableNumber: session.table.tableNumber,
    };

    getIo().to(ROOMS.kitchen).emit("lead:new", eventPayload);
    getIo().to(ROOMS.kitchen).emit("catering:new", eventPayload);

    return serializeLead(lead);
  }

  async getLeads(query: ListCateringLeadsInput) {
    const where: Prisma.CateringLeadWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { phone: { contains: query.search } },
            ],
          }
        : {}),
      ...(query.startDate || query.endDate
        ? {
            createdAt: {
              ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.cateringLead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.cateringLead.count({ where }),
    ]);

    return {
      items: items.map(serializeLead),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getLead(id: string) {
    const lead = await prisma.cateringLead.findUnique({ where: { id } });

    if (!lead) {
      throw new AppError("Catering lead not found.", 404);
    }

    return serializeLead(lead);
  }

  async updateStatus(id: string, data: UpdateCateringLeadStatusInput) {
    await this.getLead(id);

    const lead = await prisma.cateringLead.update({
      where: { id },
      data: {
        status: data.status,
        adminNotes: data.adminNotes,
      },
    });

    return serializeLead(lead);
  }

  async exportCsv() {
    const leads = await prisma.cateringLead.findMany({ orderBy: { createdAt: "desc" } });
    const header = [
      "id",
      "name",
      "phone",
      "eventType",
      "eventDate",
      "guestCount",
      "location",
      "preferredContactTime",
      "status",
      "adminNotes",
      "createdAt",
    ];
    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = leads.map((lead) =>
      [
        lead.id,
        lead.name,
        lead.phone,
        lead.eventType,
        lead.eventDate.toISOString(),
        lead.guestCount,
        lead.location,
        lead.preferredContactTime,
        lead.status,
        lead.adminNotes,
        lead.createdAt.toISOString(),
      ]
        .map(escape)
        .join(","),
    );

    return [header.join(","), ...rows].join("\n");
  }
}

export const cateringService = new CateringService();
