import { NextFunction, Request, Response } from "express";
import { dailyMenuService } from "../services/daily-menu.service";
import { Server } from "socket.io";
import { ROOMS } from "../sockets/rooms";

const getIo = (): Server => {
  const { io } = require("../index") as typeof import("../index");
  return io;
};

export class DailyMenuController {
  async getTodayMenu(request: Request, response: Response, next: NextFunction) {
    try {
      const data = await dailyMenuService.getTodayMenu();
      return response.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getFullMenu(request: Request, response: Response, next: NextFunction) {
    try {
      const search = request.query.search as string | undefined;
      const categoryId = request.query.categoryId as string | undefined;
      const data = await dailyMenuService.getFullMenuWithStatus(search, categoryId);
      return response.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async addItem(request: Request, response: Response, next: NextFunction) {
    try {
      const { menuItemId } = request.body;
      const userId = request.user!.userId;

      const data = await dailyMenuService.addItemToToday(menuItemId, userId);

      // Emit socket events
      try {
        getIo().to(ROOMS.kitchen).emit("daily-menu:item-added", {
          menuItemId,
          name: data.name,
          addedAt: data.addedAt,
        });
        getIo().to(ROOMS.server).emit("daily-menu:item-added", {
          menuItemId,
          name: data.name,
          addedAt: data.addedAt,
        });
      } catch (err) {
        // Suppress socket errors so it doesn't fail request
      }

      return response.status(201).json({
        success: true,
        message: `${data.name} added to today's menu`,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async removeItem(request: Request, response: Response, next: NextFunction) {
    try {
      const menuItemId = request.params.menuItemId as string;
      const userId = request.user!.userId;

      const data = await dailyMenuService.removeItemFromToday(menuItemId, userId);

      // Emit socket events
      try {
        getIo().to(ROOMS.kitchen).emit("daily-menu:item-removed", {
          menuItemId,
          name: data.name,
          removedAt: data.removedAt,
        });
        getIo().to(ROOMS.server).emit("daily-menu:item-removed", {
          menuItemId,
          name: data.name,
          removedAt: data.removedAt,
        });
      } catch (err) {
        // Suppress socket errors so it doesn't fail request
      }

      return response.status(200).json({
        success: true,
        message: `${data.name} removed from today's menu`,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async copyYesterday(request: Request, response: Response, next: NextFunction) {
    try {
      const userId = request.user!.userId;
      const data = await dailyMenuService.copyYesterdayMenu(userId);

      // Emit socket events
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        getIo().to(ROOMS.kitchen).emit("daily-menu:copied", {
          count: data.copied,
          date: todayStr,
        });
        getIo().to(ROOMS.server).emit("daily-menu:copied", {
          count: data.copied,
          date: todayStr,
        });
      } catch (err) {
        // Suppress socket errors
      }

      return response.status(200).json({
        success: true,
        message: `Successfully copied ${data.copied} items from yesterday`,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getHistory(request: Request, response: Response, next: NextFunction) {
    try {
      const date = request.params.date as string;
      const data = await dailyMenuService.getHistoryMenu(date);
      return response.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const dailyMenuController = new DailyMenuController();
