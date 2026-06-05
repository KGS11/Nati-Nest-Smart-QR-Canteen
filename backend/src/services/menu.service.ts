import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";
import { uploadImageBuffer } from "../utils/cloudinary.utils";

type MenuItemData = {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  isAvailable?: boolean;
};

const serializeItem = <T extends { price: Prisma.Decimal }>(item: T) => ({
  ...item,
  price: item.price.toNumber(),
});

export class MenuService {
  async createItem(data: Required<Pick<MenuItemData, "name" | "price" | "categoryId">> & MenuItemData, image?: Express.Multer.File) {
    try {
      const category = await prisma.menuCategory.findUnique({ where: { id: data.categoryId } });

      if (!category) {
        throw new AppError("Category not found", 404);
      }

      const imageUrl = image ? await uploadImageBuffer(image.buffer) : undefined;
      const item = await prisma.menuItem.create({
        data: {
          name: data.name.trim(),
          description: data.description,
          price: data.price,
          categoryId: data.categoryId,
          isAvailable: data.isAvailable ?? true,
          imageUrl,
        },
        include: { category: true },
      });

      return serializeItem(item);
    } catch (error) {
      throw error;
    }
  }

  async getItems(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    isAvailable?: boolean;
  }) {
    try {
      const page = Math.max(Number(params.page) || 1, 1);
      const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 100);
      const where: Prisma.MenuItemWhereInput = {
        isAvailable: params.isAvailable ?? true,
        ...(params.category ? { categoryId: params.category } : {}),
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: "insensitive" } },
                { description: { contains: params.search, mode: "insensitive" } },
              ],
            }
          : {}),
      };

      const [items, total] = await Promise.all([
        prisma.menuItem.findMany({
          where,
          include: { category: true },
          orderBy: { name: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.menuItem.count({ where }),
      ]);

      return {
        items: items.map(serializeItem),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async updateItem(id: string, data: MenuItemData, image?: Express.Multer.File) {
    try {
      const item = await prisma.menuItem.findUnique({ where: { id } });

      if (!item) {
        throw new AppError("Menu item not found", 404);
      }

      if (data.categoryId) {
        const category = await prisma.menuCategory.findUnique({ where: { id: data.categoryId } });

        if (!category) {
          throw new AppError("Category not found", 404);
        }
      }

      const imageUrl = image ? await uploadImageBuffer(image.buffer) : item.imageUrl;
      const updatedItem = await prisma.menuItem.update({
        where: { id },
        data: {
          ...data,
          name: data.name?.trim(),
          imageUrl,
        },
        include: { category: true },
      });

      return serializeItem(updatedItem);
    } catch (error) {
      throw error;
    }
  }

  async updateAvailability(id: string, isAvailable: boolean) {
    try {
      const item = await prisma.menuItem.findUnique({ where: { id } });

      if (!item) {
        throw new AppError("Menu item not found", 404);
      }

      const updatedItem = await prisma.menuItem.update({
        where: { id },
        data: { isAvailable },
        include: { category: true },
      });

      return serializeItem(updatedItem);
    } catch (error) {
      throw error;
    }
  }

  async deleteItem(id: string) {
    try {
      const item = await prisma.menuItem.findUnique({ where: { id } });

      if (!item) {
        throw new AppError("Menu item not found", 404);
      }

      await prisma.menuItem.delete({ where: { id } });
    } catch (error) {
      throw error;
    }
  }
}

export const menuService = new MenuService();
