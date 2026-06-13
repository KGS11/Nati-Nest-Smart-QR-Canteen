import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";

const getTodayDate = () => {
  const today = new Date();
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TIMEZONE ?? "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(today);
  return new Date(`${todayStr}T00:00:00.000Z`);
};

const getYesterdayDate = () => {
  const today = getTodayDate();
  const yesterday = new Date(today);
  yesterday.setUTCDate(today.getUTCDate() - 1);
  return yesterday;
};

export class DailyMenuService {
  async getTodayMenu() {
    const today = getTodayDate();
    const items = await prisma.dailyMenu.findMany({
      where: {
        menuDate: today,
        removedAt: null,
      },
      include: {
        menuItem: {
          include: {
            category: true,
          },
        },
        addedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        menuItem: {
          name: "asc",
        },
      },
    });

    return {
      date: today.toISOString().split("T")[0],
      items: items.map((entry) => ({
        dailyMenuId: entry.id,
        menuItemId: entry.menuItemId,
        name: entry.menuItem.name,
        description: entry.menuItem.description,
        price: entry.menuItem.price.toNumber(),
        imageUrl: entry.menuItem.imageUrl,
        isPopular: entry.menuItem.isPopular,
        category: {
          id: entry.menuItem.category.id,
          name: entry.menuItem.category.name,
        },
        addedAt: entry.addedAt,
        addedBy: {
          name: entry.addedBy.name,
        },
      })),
      count: items.length,
    };
  }

  async getFullMenuWithStatus(search?: string, categoryId?: string) {
    const today = getTodayDate();

    // 1. Fetch active daily menu item IDs for today
    const activeDailyEntries = await prisma.dailyMenu.findMany({
      where: {
        menuDate: today,
        removedAt: null,
      },
      select: {
        id: true,
        menuItemId: true,
      },
    });
    const activeMap = new Map(activeDailyEntries.map((entry) => [entry.menuItemId, entry.id]));

    // 2. Fetch categories with items matching search/category filters
    const categories = await prisma.menuCategory.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
      include: {
        items: {
          where: {
            isAvailable: true,
            ...(categoryId ? { categoryId } : {}),
            ...(search
              ? {
                  OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          orderBy: {
            name: "asc",
          },
        },
      },
    });

    // 3. Return mapped categories, injecting isOnTodaysMenu and dailyMenuId
    return {
      date: today.toISOString().split("T")[0],
      categories: categories
        .map((category) => ({
          id: category.id,
          name: category.name,
          sortOrder: category.sortOrder,
          items: category.items.map((item) => {
            const dailyMenuId = activeMap.get(item.id) || null;
            return {
              id: item.id,
              name: item.name,
              description: item.description,
              price: item.price.toNumber(),
              imageUrl: item.imageUrl,
              isAvailable: item.isAvailable,
              isPopular: item.isPopular,
              isOnTodaysMenu: !!dailyMenuId,
              dailyMenuId,
            };
          }),
        }))
        .filter((cat) => cat.items.length > 0),
    };
  }

  async addItemToToday(menuItemId: string, userId: string) {
    const today = getTodayDate();

    // Verify menuItem exists and is available in master catalog
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });

    if (!menuItem) {
      throw new AppError("Menu item not found", 404);
    }

    if (!menuItem.isAvailable) {
      throw new AppError(`${menuItem.name} is retired from the master catalog.`, 400);
    }

    // Check if there is already an entry for today
    const existingEntry = await prisma.dailyMenu.findUnique({
      where: {
        menuItemId_menuDate: {
          menuItemId,
          menuDate: today,
        },
      },
    });

    if (existingEntry) {
      if (existingEntry.removedAt === null) {
        throw new AppError(`${menuItem.name} is already on today's menu.`, 400);
      }

      // Restore previously removed item
      const updated = await prisma.dailyMenu.update({
        where: { id: existingEntry.id },
        data: {
          removedAt: null,
          removedById: null,
          addedById: userId,
          addedAt: new Date(),
        },
      });
      return { ...updated, name: menuItem.name };
    }

    // Create a new entry
    const created = await prisma.dailyMenu.create({
      data: {
        menuItemId,
        menuDate: today,
        addedById: userId,
      },
    });
    return { ...created, name: menuItem.name };
  }

  async removeItemFromToday(menuItemId: string, userId: string) {
    const today = getTodayDate();

    const existingEntry = await prisma.dailyMenu.findUnique({
      where: {
        menuItemId_menuDate: {
          menuItemId,
          menuDate: today,
        },
      },
      include: {
        menuItem: true,
      },
    });

    if (!existingEntry || existingEntry.removedAt !== null) {
      throw new AppError("Item is not active on today's menu.", 404);
    }

    const updated = await prisma.dailyMenu.update({
      where: { id: existingEntry.id },
      data: {
        removedAt: new Date(),
        removedById: userId,
      },
    });

    return { ...updated, name: existingEntry.menuItem.name };
  }

  async copyYesterdayMenu(userId: string) {
    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    // 1. Get all active items from yesterday
    const yesterdayItems = await prisma.dailyMenu.findMany({
      where: {
        menuDate: yesterday,
        removedAt: null,
        menuItem: {
          isAvailable: true,
        },
      },
      include: {
        menuItem: true,
      },
    });

    if (yesterdayItems.length === 0) {
      throw new AppError("No items found on yesterday's menu to copy.", 404);
    }

    // 2. Get today's active items
    const todayActive = await prisma.dailyMenu.findMany({
      where: {
        menuDate: today,
        removedAt: null,
      },
      select: {
        menuItemId: true,
      },
    });
    const todayActiveSet = new Set(todayActive.map((item) => item.menuItemId));

    let copied = 0;
    let skipped = 0;
    const itemsResult: Array<{ name: string; status: "added" | "skipped" }> = [];

    // Run in a transaction
    await prisma.$transaction(async (tx) => {
      for (const entry of yesterdayItems) {
        if (todayActiveSet.has(entry.menuItemId)) {
          skipped++;
          itemsResult.push({ name: entry.menuItem.name, status: "skipped" });
          continue;
        }

        const existingToday = await tx.dailyMenu.findUnique({
          where: {
            menuItemId_menuDate: {
              menuItemId: entry.menuItemId,
              menuDate: today,
            },
          },
        });

        if (existingToday) {
          await tx.dailyMenu.update({
            where: { id: existingToday.id },
            data: {
              removedAt: null,
              removedById: null,
              addedById: userId,
              addedAt: new Date(),
            },
          });
        } else {
          await tx.dailyMenu.create({
            data: {
              menuItemId: entry.menuItemId,
              menuDate: today,
              addedById: userId,
            },
          });
        }
        copied++;
        itemsResult.push({ name: entry.menuItem.name, status: "added" });
      }
    });

    return {
      copied,
      skipped,
      items: itemsResult,
    };
  }

  async getHistoryMenu(dateStr: string) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      throw new AppError("Invalid date format. Expected YYYY-MM-DD.", 400);
    }

    const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

    const items = await prisma.dailyMenu.findMany({
      where: {
        menuDate: targetDate,
      },
      include: {
        menuItem: {
          include: {
            category: true,
          },
        },
        addedBy: { select: { name: true } },
        removedBy: { select: { name: true } },
      },
      orderBy: {
        addedAt: "asc",
      },
    });

    return {
      date: dateStr,
      items: items.map((entry) => ({
        dailyMenuId: entry.id,
        menuItemId: entry.menuItemId,
        name: entry.menuItem.name,
        price: entry.menuItem.price.toNumber(),
        category: entry.menuItem.category.name,
        addedAt: entry.addedAt,
        addedBy: entry.addedBy.name,
        removedAt: entry.removedAt,
        removedBy: entry.removedBy?.name || null,
      })),
      count: items.length,
    };
  }
}

export const dailyMenuService = new DailyMenuService();
