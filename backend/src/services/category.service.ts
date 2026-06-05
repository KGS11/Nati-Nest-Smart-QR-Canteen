import { Role } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";

type CategoryData = {
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export class CategoryService {
  async createCategory(data: Required<Pick<CategoryData, "name">> & CategoryData) {
    try {
      const name = data.name.trim();
      const existingCategory = await prisma.menuCategory.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
      });

      if (existingCategory) {
        throw new AppError("Category name already exists", 409);
      }

      return prisma.menuCategory.create({
        data: {
          name,
          sortOrder: data.sortOrder ?? 0,
          isActive: data.isActive ?? true,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async getCategories(options: { includeInactive?: boolean; role?: string }) {
    try {
      const canSeeInactive = options.role === Role.ADMIN && options.includeInactive === true;

      return prisma.menuCategory.findMany({
        where: canSeeInactive ? undefined : { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
    } catch (error) {
      throw error;
    }
  }

  async updateCategory(id: string, data: CategoryData) {
    try {
      const category = await prisma.menuCategory.findUnique({ where: { id } });

      if (!category) {
        throw new AppError("Category not found", 404);
      }

      const updateData = { ...data };

      if (updateData.name) {
        updateData.name = updateData.name.trim();
        const existingCategory = await prisma.menuCategory.findFirst({
          where: {
            id: { not: id },
            name: { equals: updateData.name, mode: "insensitive" },
          },
        });

        if (existingCategory) {
          throw new AppError("Category name already exists", 409);
        }
      }

      return prisma.menuCategory.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      throw error;
    }
  }

  async deleteCategory(id: string) {
    try {
      const category = await prisma.menuCategory.findUnique({
        where: { id },
        include: { _count: { select: { items: true } } },
      });

      if (!category) {
        throw new AppError("Category not found", 404);
      }

      if (category._count.items > 0) {
        throw new AppError("Cannot delete category because it contains menu items", 400);
      }

      await prisma.menuCategory.delete({ where: { id } });
    } catch (error) {
      throw error;
    }
  }
}

export const categoryService = new CategoryService();
