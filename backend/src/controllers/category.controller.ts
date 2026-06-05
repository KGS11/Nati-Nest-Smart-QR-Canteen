import { Request, Response, NextFunction } from "express";
import { categoryService } from "../services/category.service";

const param = (request: Request, key: string) => {
  const value = request.params[key];
  return Array.isArray(value) ? value[0] : value;
};

export class CategoryController {
  async create(request: Request, response: Response, next: NextFunction) {
    try {
      const data = await categoryService.createCategory(request.body);
      return response.status(201).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async getAll(request: Request, response: Response, next: NextFunction) {
    try {
      const data = await categoryService.getCategories({
        includeInactive: request.query.includeInactive === "true",
        role: request.user?.role,
      });
      return response.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async update(request: Request, response: Response, next: NextFunction) {
    try {
      const data = await categoryService.updateCategory(param(request, "id"), request.body);
      return response.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async delete(request: Request, response: Response, next: NextFunction) {
    try {
      await categoryService.deleteCategory(param(request, "id"));
      return response.status(200).json({ success: true, data: {} });
    } catch (error) {
      return next(error);
    }
  }
}

export const categoryController = new CategoryController();
