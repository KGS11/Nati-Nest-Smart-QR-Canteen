import bcrypt from "bcryptjs";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";

type StaffListParams = {
  page: number;
  limit: number;
  search?: string;
  role?: Role;
  isActive?: boolean;
};

type CreateStaffData = {
  name: string;
  phone: string;
  password: string;
  role: Role;
  isActive?: boolean;
};

type UpdateStaffData = {
  name?: string;
  phone?: string;
  password?: string;
  role?: Role;
  isActive?: boolean;
};

const staffSelect = {
  id: true,
  name: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export class StaffService {
  async getStaff(params: StaffListParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 10));
    const where: Prisma.UserWhereInput = {
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: "insensitive" } },
              { phone: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(params.role ? { role: params.role } : {}),
      ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: staffSelect,
        orderBy: [{ createdAt: "desc" }, { name: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async createStaff(data: CreateStaffData) {
    const phone = data.phone.trim();
    const existing = await prisma.user.findUnique({ where: { phone } });

    if (existing) {
      throw new AppError("Phone number already exists", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    return prisma.user.create({
      data: {
        name: data.name.trim(),
        phone,
        passwordHash,
        role: data.role,
        isActive: data.isActive ?? true,
      },
      select: staffSelect,
    });
  }

  async updateStaff(id: string, data: UpdateStaffData, currentUserId?: string) {
    const existing = await prisma.user.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError("Staff member not found", 404);
    }

    if (currentUserId && id === currentUserId && data.role !== undefined && data.role !== existing.role) {
      throw new AppError("You cannot change your own role", 400);
    }

    if (data.phone !== undefined) {
      const phone = data.phone.trim();
      const duplicate = await prisma.user.findUnique({ where: { phone } });

      if (duplicate && duplicate.id !== id) {
        throw new AppError("Phone number already exists", 409);
      }
    }

    return prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.phone !== undefined ? { phone: data.phone.trim() } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.password ? { passwordHash: await bcrypt.hash(data.password, 10) } : {}),
      },
      select: staffSelect,
    });
  }

  async updateStatus(id: string, isActive: boolean, currentUserId: string) {
    if (id === currentUserId && !isActive) {
      throw new AppError("You cannot deactivate your own admin account", 400);
    }

    const existing = await prisma.user.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError("Staff member not found", 404);
    }

    return prisma.user.update({
      where: { id },
      data: { isActive },
      select: staffSelect,
    });
  }

  async toggleStatus(id: string, currentUserId: string) {
    const existing = await prisma.user.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError("Staff member not found", 404);
    }

    return this.updateStatus(id, !existing.isActive, currentUserId);
  }
}

export const staffService = new StaffService();
