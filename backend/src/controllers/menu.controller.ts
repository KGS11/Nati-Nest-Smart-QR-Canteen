import { NextFunction, Request, Response } from "express";
import { menuService } from "../services/menu.service";

const param = (request: Request, key: string) => {
  const value = request.params[key];
  return Array.isArray(value) ? value[0] : value;
};

export class MenuController {
  async create(request: Request, response: Response, next: NextFunction) {
    try {
      const data = await menuService.createItem(request.body, request.file);
      return response.status(201).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async getAll(request: Request, response: Response, next: NextFunction) {
    try {
      const data = await menuService.getItems({
        page: Number(request.query.page),
        limit: Number(request.query.limit),
        search: request.query.search as string | undefined,
        category: request.query.category as string | undefined,
        isAvailable:
          typeof request.query.isAvailable === "string"
            ? request.query.isAvailable === "true"
            : undefined,
      });
      return response.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async update(request: Request, response: Response, next: NextFunction) {
    try {
      const data = await menuService.updateItem(param(request, "id"), request.body, request.file);
      return response.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async updateAvailability(request: Request, response: Response, next: NextFunction) {
    try {
      const data = await menuService.updateAvailability(
        param(request, "id"),
        request.body.isAvailable,
      );
      return response.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async delete(request: Request, response: Response, next: NextFunction) {
    try {
      await menuService.deleteItem(param(request, "id"));
      return response.status(200).json({ success: true, data: {} });
    } catch (error) {
      return next(error);
    }
  }
}

export const menuController = new MenuController();
