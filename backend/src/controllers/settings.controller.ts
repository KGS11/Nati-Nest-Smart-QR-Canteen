import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { settingsService } from "../services/settings.service";

const adminSettingsSchema = z.object({
  businessName: z.string().trim().min(1).max(120).optional(),
  businessPhone: z.string().trim().max(30).optional(),
  businessAddress: z.string().trim().max(500).optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  notificationsEnabled: z.boolean().optional(),
  upiId: z.string().trim().max(100).optional(),
});

export class SettingsController {
  async getAdminSettings(_request: Request, response: Response, next: NextFunction) {
    try {
      const settings = await settingsService.getAdminSettings();
      return response.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateAdminSettings(request: Request, response: Response, next: NextFunction) {
    try {
      const parsed = adminSettingsSchema.safeParse(request.body);
      if (!parsed.success) {
        return response.status(422).json({
          success: false,
          message: "Validation Error",
        });
      }

      const settings = await settingsService.updateAdminSettings(
        {
          ...(parsed.data.businessName !== undefined
            ? { business_name: parsed.data.businessName }
            : {}),
          ...(parsed.data.businessPhone !== undefined
            ? { business_phone: parsed.data.businessPhone }
            : {}),
          ...(parsed.data.businessAddress !== undefined
            ? { business_address: parsed.data.businessAddress }
            : {}),
          ...(parsed.data.taxRate !== undefined ? { tax_rate: String(parsed.data.taxRate) } : {}),
          ...(parsed.data.notificationsEnabled !== undefined
            ? { notifications_enabled: String(parsed.data.notificationsEnabled) }
            : {}),
          ...(parsed.data.upiId !== undefined ? { upi_id: parsed.data.upiId } : {}),
        },
        request.user!.userId,
      );

      return response.status(200).json({
        success: true,
        message: "Settings updated",
        data: settings,
      });
    } catch (error) {
      return next(error);
    }
  }

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

  async uploadLogo(request: Request, response: Response, next: NextFunction) {
    try {
      if (!request.file) {
        return response.status(400).json({
          success: false,
          message: "Image file is required",
        });
      }

      const setting = await settingsService.updateLogoUrl(request.file, request.user!.userId);
      return response.status(200).json({
        success: true,
        message: "Logo updated successfully",
        data: { logoUrl: setting.value },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getDynamicUpiQr(request: Request, response: Response, next: NextFunction) {
    try {
      const sessionId = request.query.sessionId as string;
      if (!sessionId || sessionId.trim() === "") {
        return response.status(400).json({
          success: false,
          message: "sessionId query parameter is required.",
        });
      }

      if (sessionId !== request.session!.sessionId) {
        return response.status(403).json({
          success: false,
          message: "Access denied. Invalid session.",
        });
      }

      const qrData = await settingsService.getDynamicUpiQr(sessionId);
      return response.status(200).json({
        success: true,
        data: qrData,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const settingsController = new SettingsController();
