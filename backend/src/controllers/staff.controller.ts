import { Role } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { staffService } from "../services/staff.service";

const roleSchema = z.enum([Role.ADMIN, Role.KITCHEN, Role.SERVER] as const);

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  search: z.string().trim().optional(),
  role: roleSchema.optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

const createStaffSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(6).max(20),
  password: z.string().min(6).max(100),
  role: roleSchema,
  isActive: z.boolean().optional(),
});

const updateStaffSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(6).max(20).optional(),
  password: z.string().min(6).max(100).optional(),
  role: roleSchema.optional(),
  isActive: z.boolean().optional(),
});

const statusSchema = z.object({
  isActive: z.boolean(),
});

const param = (request: Request, key: string) => {
  const value = request.params[key];
  return Array.isArray(value) ? value[0] : value;
};

export class StaffController {
  async getAll(request: Request, response: Response, next: NextFunction) {
    try {
      const parsed = listQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return response.status(422).json({ success: false, message: "Validation Error" });
      }

      const data = await staffService.getStaff(parsed.data);
      return response.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async create(request: Request, response: Response, next: NextFunction) {
    try {
      const parsed = createStaffSchema.safeParse(request.body);
      if (!parsed.success) {
        return response.status(422).json({ success: false, message: "Validation Error" });
      }

      const staff = await staffService.createStaff(parsed.data);
      return response.status(201).json({ success: true, data: { staff } });
    } catch (error) {
      return next(error);
    }
  }

  async update(request: Request, response: Response, next: NextFunction) {
    try {
      const parsed = updateStaffSchema.safeParse(request.body);
      if (!parsed.success) {
        return response.status(422).json({ success: false, message: "Validation Error" });
      }

      const staff = await staffService.updateStaff(
        param(request, "id"),
        parsed.data,
        request.user!.userId,
      );
      return response.status(200).json({ success: true, data: { staff } });
    } catch (error) {
      return next(error);
    }
  }

  async updateStatus(request: Request, response: Response, next: NextFunction) {
    try {
      const parsed = statusSchema.safeParse(request.body);
      if (!parsed.success) {
        return response.status(422).json({ success: false, message: "Validation Error" });
      }

      const staff = await staffService.updateStatus(
        param(request, "id"),
        parsed.data.isActive,
        request.user!.userId,
      );
      return response.status(200).json({ success: true, data: { staff } });
    } catch (error) {
      return next(error);
    }
  }

  async toggleStatus(request: Request, response: Response, next: NextFunction) {
    try {
      const staff = await staffService.toggleStatus(
        param(request, "id"),
        request.user!.userId,
      );
      return response.status(200).json({ success: true, data: { staff } });
    } catch (error) {
      return next(error);
    }
  }
}

export const staffController = new StaffController();
