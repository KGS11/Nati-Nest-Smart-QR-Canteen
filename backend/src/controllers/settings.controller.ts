import { NextFunction, Request, Response } from "express";
import { settingsService } from "../services/settings.service";

export class SettingsController {
  async getUpiQr(_request: Request, response: Response, next: NextFunction) {
    try {
      const upiQrUrl = await settingsService.getUpiQrUrl();
      return response.status(200).json({
        success: true,
        data: { upiQrUrl },
      });
    } catch (error) {
      return next(error);
    }
  }

  async uploadUpiQr(request: Request, response: Response, next: NextFunction) {
    try {
      if (!request.file) {
        return response.status(400).json({
          success: false,
          message: "Image file is required",
        });
      }

      const setting = await settingsService.updateUpiQrUrl(request.file, request.user!.userId);
      return response.status(200).json({
        success: true,
        message: "UPI QR code updated successfully",
        data: { upiQrUrl: setting.value },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const settingsController = new SettingsController();
