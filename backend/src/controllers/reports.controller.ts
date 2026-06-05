import { NextFunction, Request, Response } from "express";
import { reportsService } from "../services/reports.service";

type GroupBy = "day" | "week" | "month";

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
}

export const reportsController = new ReportsController();
