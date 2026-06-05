import { prisma } from "../config/db";
import {
  deleteCloudinaryImage,
  extractCloudinaryPublicId,
  uploadImageBuffer,
} from "../utils/cloudinary.utils";
import { AppError } from "../utils/AppError";

const UPI_QR_KEY = "upi_qr_url";

export class SettingsService {
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
