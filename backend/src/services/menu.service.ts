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
      const updateData: Prisma.MenuItemUpdateInput = {};
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.description !== undefined) updateData.description = data.description;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.categoryId !== undefined) updateData.category = { connect: { id: data.categoryId } };
      if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;
      updateData.imageUrl = imageUrl;

      const updatedItem = await prisma.menuItem.update({
        where: { id },
        data: updateData,
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

      try {
        await prisma.menuItem.delete({ where: { id } });
      } catch (error: any) {
        const isFkViolation =
          error.code === "P2003" ||
          (error.message && (
            error.message.includes("foreign key constraint") ||
            error.message.includes("violates RESTRICT") ||
            error.message.includes("23001")
          ));

        if (isFkViolation) {
          await prisma.menuItem.update({
            where: { id },
            data: { isAvailable: false },
          });
          throw new AppError(
            "This menu item is referenced in order history or daily menu records and cannot be deleted. It has been marked unavailable instead.",
            400
          );
        }
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  async togglePopular(id: string) {
    try {
      const item = await prisma.menuItem.findUnique({ where: { id } });

      if (!item) {
        throw new AppError("Menu item not found", 404);
      }

      const updatedItem = await prisma.menuItem.update({
        where: { id },
        data: { isPopular: !item.isPopular },
        include: { category: true },
      });

      return serializeItem(updatedItem);
    } catch (error) {
      throw error;
    }
  }
}

export const menuService = new MenuService();
