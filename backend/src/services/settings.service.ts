import { OrderStatus, OrderItemStatus } from "@prisma/client";
import QRCode from "qrcode";
import { prisma } from "../config/db";
import {
  deleteCloudinaryImage,
  extractCloudinaryPublicId,
  uploadImageBuffer,
} from "../utils/cloudinary.utils";
import { AppError } from "../utils/AppError";

const UPI_QR_KEY = "upi_qr_url";
const LOGO_URL_KEY = "logo_url";

const editableSettingKeys = [
  "business_name",
  "business_phone",
  "business_address",
  "tax_rate",
  "notifications_enabled",
  "upi_id",
] as const;

export type EditableSettingKey = (typeof editableSettingKeys)[number];
export type AdminSettingsInput = Partial<Record<EditableSettingKey, string>>;

export class SettingsService {
  async getAdminSettings() {
    try {
      const settings = await prisma.settings.findMany();
      const map = new Map(settings.map((setting) => [setting.key, setting.value]));

      return {
        businessName: map.get("business_name") ?? "Nati Nest",
        businessPhone: map.get("business_phone") ?? "",
        businessAddress: map.get("business_address") ?? "",
        taxRate: Number(map.get("tax_rate") ?? 0),
        notificationsEnabled: map.get("notifications_enabled") === "true",
        logoUrl: map.get(LOGO_URL_KEY) ?? "",
        upiQrUrl: map.get(UPI_QR_KEY) ?? "",
        upiId: map.get("upi_id") ?? "",
      };
    } catch (error) {
      throw error;
    }
  }

  async updateAdminSettings(data: AdminSettingsInput, staffId: string) {
    try {
      await prisma.$transaction(
        Object.entries(data).map(([key, value]) =>
          prisma.settings.upsert({
            where: { key },
            update: {
              value: String(value),
              updatedBy: staffId,
            },
            create: {
              key,
              value: String(value),
              updatedBy: staffId,
            },
          }),
        ),
      );

      return this.getAdminSettings();
    } catch (error) {
      throw error;
    }
  }

  async getUpiQrUrl() {
    try {
      const setting = await prisma.settings.findUnique({
        where: { key: UPI_QR_KEY },
      });

      if (!setting || setting.value.trim() === "") {
        throw new AppError("UPI QR code has not been configured yet. Please contact admin.", 503);
      }

      return setting.value;
    } catch (error) {
      throw error;
    }
  }

  async updateUpiQrUrl(imageFile: Express.Multer.File, staffId: string) {
    try {
      const existingSetting = await prisma.settings.findUnique({
        where: { key: UPI_QR_KEY },
      });
      const newUrl = await uploadImageBuffer(imageFile.buffer, "natinest/settings");

      if (existingSetting?.value) {
        const publicId = extractCloudinaryPublicId(existingSetting.value);

        if (publicId) {
          void deleteCloudinaryImage(publicId);
        }
      }

      return prisma.settings.upsert({
        where: { key: UPI_QR_KEY },
        update: {
          value: newUrl,
          updatedBy: staffId,
        },
        create: {
          key: UPI_QR_KEY,
          value: newUrl,
          updatedBy: staffId,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async updateLogoUrl(imageFile: Express.Multer.File, staffId: string) {
    try {
      const existingSetting = await prisma.settings.findUnique({
        where: { key: LOGO_URL_KEY },
      });
      const newUrl = await uploadImageBuffer(imageFile.buffer, "natinest/settings");

      if (existingSetting?.value) {
        const publicId = extractCloudinaryPublicId(existingSetting.value);

        if (publicId) {
          void deleteCloudinaryImage(publicId);
        }
      }

      return prisma.settings.upsert({
        where: { key: LOGO_URL_KEY },
        update: {
          value: newUrl,
          updatedBy: staffId,
        },
        create: {
          key: LOGO_URL_KEY,
          value: newUrl,
          updatedBy: staffId,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async getDynamicUpiQr(sessionId: string) {
    try {
      const session = await prisma.tableSession.findUnique({
        where: { id: sessionId },
        include: { table: { select: { tableNumber: true } } },
      });

      if (!session) {
        throw new AppError("Session not found", 404);
      }

      const orders = await prisma.order.findMany({
        where: {
          sessionId,
          status: { not: OrderStatus.CANCELLED },
        },
        include: {
          items: {
            where: { status: OrderItemStatus.ACTIVE },
            include: { menuItem: true },
          },
        },
      });

      let totalAmount = 0;
      orders.forEach((order) => {
        order.items.forEach((item) => {
          if (item.status === OrderItemStatus.ACTIVE) {
            totalAmount += Number(item.unitPrice) * item.quantity;
          }
        });
      });

      const amount = Math.round(totalAmount * 100) / 100;
      if (amount <= 0) {
        throw new AppError("No items to bill. Place an order first.", 400);
      }

      const settings = await prisma.settings.findMany({
        where: {
          key: { in: ["upi_id", "business_name", "upi_qr_url"] },
        },
      });

      const map = new Map(settings.map((s) => [s.key, s.value]));
      const upiId = map.get("upi_id");
      const businessName = map.get("business_name") ?? "Nati Nest";
      const staticUpiQrUrl = map.get("upi_qr_url");

      if (!upiId || upiId.trim() === "") {
        if (!staticUpiQrUrl || staticUpiQrUrl.trim() === "") {
          throw new AppError("UPI payment has not been configured yet. Please contact admin.", 503);
        }
        return {
          qrType: "static",
          qrDataUrl: staticUpiQrUrl,
          amount,
        };
      }

      const upiLink = `upi://pay?pa=${upiId.trim()}&pn=${encodeURIComponent(businessName.trim())}&am=${amount}&cu=INR`;
      const qrDataUrl = await QRCode.toDataURL(upiLink);

      return {
        qrType: "dynamic",
        qrDataUrl,
        amount,
        upiLink,
      };
    } catch (error) {
      throw error;
    }
  }

  async getSettingByKey(key: string) {
    try {
      const setting = await prisma.settings.findUnique({
        where: { key },
      });

      return setting?.value ?? null;
    } catch (error) {
      throw error;
    }
  }
}

export const settingsService = new SettingsService();
