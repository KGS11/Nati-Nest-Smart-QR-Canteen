import { TableStatus } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { tableService } from "../services/table.service";

const param = (request: Request, key: string) => {
  const value = request.params[key];
  return Array.isArray(value) ? value[0] : value;
};

export class TableController {
  async getAllTables(_request: Request, response: Response, next: NextFunction) {
    try {
      const data = await tableService.getAllTables();
      return response.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async getTableById(request: Request, response: Response, next: NextFunction) {
    try {
      const data = await tableService.getTableById(param(request, "id"));
      return response.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async createTable(request: Request, response: Response, next: NextFunction) {
    try {
      const data = await tableService.createTable(request.body);
      return response.status(201).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async updateTable(request: Request, response: Response, next: NextFunction) {
    try {
      const data = await tableService.updateTable(param(request, "id"), request.body);
      return response.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async regenerateQRCode(request: Request, response: Response, next: NextFunction) {
    try {
      const data = await tableService.regenerateQRCode(param(request, "id"));
      return response.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async updateTableStatus(request: Request, response: Response, next: NextFunction) {
    try {
      const data = await tableService.updateTableStatus(
        param(request, "id"),
        request.body.status as TableStatus,
      );
      return response.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async deleteTable(request: Request, response: Response, next: NextFunction) {
    try {
      await tableService.deleteTable(param(request, "id"));
      return response.status(200).json({ success: true, data: {} });
    } catch (error) {
      return next(error);
    }
  }
  async getTableByNumber(request: Request, response: Response, next: NextFunction) {
    try {
      const tableNumber = param(request, "tableNumber");
      const data = await tableService.getTableByNumber(tableNumber);
      return response.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }
}

export const tableController = new TableController();
