import { NextFunction, Request, Response } from "express";
import { sessionService } from "../services/session.service";

const param = (request: Request, key: string) => {
  const value = request.params[key];
  return Array.isArray(value) ? value[0] : value;
};

export class SessionController {
  async scanTable(request: Request, response: Response, next: NextFunction) {
    try {
      const result = await sessionService.getOrCreateSession(param(request, "tableId"));

      return response.status(200).json({
        success: true,
        message: result.isNew ? "Session started" : "Session resumed",
        data: {
          sessionToken: result.sessionToken,
          sessionId: result.session.id,
          tableNumber: result.tableNumber,
          isNew: result.isNew,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getSessionDetails(request: Request, response: Response, next: NextFunction) {
    try {
      const data = await sessionService.getSessionDetails(request.session!.sessionId);
      return response.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async getSessionMenu(request: Request, response: Response, next: NextFunction) {
    try {
      const data = await sessionService.getSessionMenu(request.session!.sessionId);
      return response.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }
}

export const sessionController = new SessionController();
