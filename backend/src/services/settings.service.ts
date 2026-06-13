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
