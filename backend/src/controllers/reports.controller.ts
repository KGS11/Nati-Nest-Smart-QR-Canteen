import { NextFunction, Request, Response } from "express";
import { exportService, ExportFormat, ExportType } from "../services/export.service";
import { AppError } from "../utils/AppError";
import { reportsService } from "../services/reports.service";

type GroupBy = "day" | "week" | "month";
const exportTypes: ExportType[] = ["orders", "payments", "revenue", "feedback", "tables", "catering", "staff"];
const exportFormats: ExportFormat[] = ["csv", "xlsx"];

const isExportType = (value: string): value is ExportType =>
  exportTypes.includes(value as ExportType);

const isExportFormat = (value: string): value is ExportFormat =>
  exportFormats.includes(value as ExportFormat);

export class ReportsController {
  async getRevenueSummary(request: Request, response: Response, next: NextFunction) {
    try {
      const { startDate, endDate, groupBy } = request.query as unknown as {
        startDate: string;
        endDate: string;
        groupBy: GroupBy;
      };
      const result = await reportsService.getRevenueSummary({ startDate, endDate, groupBy });
      return response.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  }

  async getOrderAnalytics(request: Request, response: Response, next: NextFunction) {
    try {
      const { startDate, endDate, groupBy } = request.query as unknown as {
        startDate: string;
        endDate: string;
        groupBy: GroupBy;
      };
      const result = await reportsService.getOrderAnalytics({ startDate, endDate, groupBy });
      return response.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  }

  async getPopularItems(request: Request, response: Response, next: NextFunction) {
    try {
      const { startDate, endDate, limit, categoryId } = request.query as unknown as {
        startDate: string;
        endDate: string;
        limit: number;
        categoryId?: string;
      };
      const result = await reportsService.getPopularItems({
        startDate,
        endDate,
        limit,
        categoryId,
      });
      return response.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  }

  async getTableUtilization(request: Request, response: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = request.query as unknown as {
        startDate: string;
        endDate: string;
      };
      const result = await reportsService.getTableUtilization({ startDate, endDate });
      return response.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  }

  async getFeedbackAnalytics(request: Request, response: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = request.query as unknown as {
        startDate: string;
        endDate: string;
      };
      const result = await reportsService.getFeedbackAnalytics({ startDate, endDate });
      return response.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  }

  async getDashboardSummary(_request: Request, response: Response, next: NextFunction) {
    try {
      const result = await reportsService.getDashboardSummary();
      return response.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  }

  async exportReport(request: Request, response: Response, next: NextFunction) {
    try {
      const rawType = request.params.type;
      const type = typeof rawType === "string" ? rawType : "";
      const rawFormat = typeof request.query.format === "string" ? request.query.format : "xlsx";

      if (!isExportType(type)) {
        throw new AppError("Unsupported export type", 400);
      }

      if (!isExportFormat(rawFormat)) {
        throw new AppError("format must be csv or xlsx", 400);
      }

      const result = await exportService.export(type, {
        filter: typeof request.query.filter === "string" ? request.query.filter : undefined,
        startDate: typeof request.query.startDate === "string" ? request.query.startDate : undefined,
        endDate: typeof request.query.endDate === "string" ? request.query.endDate : undefined,
        format: rawFormat,
      });

      response.setHeader("Content-Type", result.contentType);
      response.setHeader("Content-Disposition", `attachment; filename=${result.filename}`);
      return response.status(200).send(result.content);
    } catch (error) {
      return next(error);
    }
  }
}

export const reportsController = new ReportsController();
