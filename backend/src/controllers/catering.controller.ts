import { NextFunction, Request, Response } from "express";
import { cateringService } from "../services/catering.service";

const param = (request: Request, key: string) => request.params[key] as string;

export class CateringController {
  async create(request: Request, response: Response, next: NextFunction) {
    try {
      const lead = await cateringService.createLead(request.session!.sessionId, request.body);
      return response.status(201).json({ success: true, data: { lead } });
    } catch (error) {
      return next(error);
    }
  }

  async getAll(request: Request, response: Response, next: NextFunction) {
    try {
      const data = await cateringService.getLeads(request.query as never);
      return response.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async getOne(request: Request, response: Response, next: NextFunction) {
    try {
      const lead = await cateringService.getLead(param(request, "id"));
      return response.status(200).json({ success: true, data: { lead } });
    } catch (error) {
      return next(error);
    }
  }

  async updateStatus(request: Request, response: Response, next: NextFunction) {
    try {
      const lead = await cateringService.updateStatus(param(request, "id"), request.body);
      return response.status(200).json({ success: true, data: { lead } });
    } catch (error) {
      return next(error);
    }
  }

  async exportCsv(_request: Request, response: Response, next: NextFunction) {
    try {
      const csv = await cateringService.exportCsv();
      response.setHeader("Content-Disposition", "attachment; filename=leads.csv");
      response.setHeader("Content-Type", "text/csv");
      return response.status(200).send(csv);
    } catch (error) {
      return next(error);
    }
  }
}

export const cateringController = new CateringController();
