import { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../config/cloudinary";
import { AppError } from "./AppError";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const detectImageType = (buffer: Buffer): { mime: string; extension: "jpg" | "png" | "webp" } | null => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", extension: "jpg" };
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: "image/png", extension: "png" };
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { mime: "image/webp", extension: "webp" };
  }

  return null;
};

const assertTrustedCloudinaryUrl = (value: string) => {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") {
    throw new AppError("Image upload returned an untrusted URL", 500);
  }
};

export const uploadImageBuffer = async (
  buffer: Buffer,
  folder = "nati-nest-canteen",
): Promise<string> => {
  const imageType = detectImageType(buffer);
  if (!imageType) {
    throw new AppError("Invalid image file content", 400);
  }

  const isCloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name" &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== "your_api_key";

  if (!isCloudinaryConfigured) {
    try {
      const uploadsDir = path.resolve(__dirname, "../../uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `${crypto.randomUUID()}.${imageType.extension}`;
      const filepath = path.resolve(uploadsDir, filename);
      if (!filepath.startsWith(`${uploadsDir}${path.sep}`)) {
        throw new AppError("Invalid upload path", 500);
      }
      fs.writeFileSync(filepath, buffer);

      const port = process.env.PORT ?? 5000;
      const baseUrl = process.env.BACKEND_URL ?? `http://localhost:${port}`;
      return `${baseUrl}/uploads/${filename}`;
    } catch (error) {
      console.error("Local file upload failed:", error);
      throw new AppError("Local image upload failed", 500);
    }
  }

  try {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error ?? new Error("Image upload failed"));
            return;
          }

          resolve(uploadResult);
        },
      );

      stream.end(buffer);
    });

    assertTrustedCloudinaryUrl(result.secure_url);
    return result.secure_url;
  } catch (_error) {
    throw new AppError("Image upload failed", 500);
  }
};

export const extractCloudinaryPublicId = (imageUrl: string): string | null => {
  try {
    const url = new URL(imageUrl);
    const uploadMarker = "/image/upload/";
    const uploadIndex = url.pathname.indexOf(uploadMarker);

    if (!url.hostname.includes("res.cloudinary.com") || uploadIndex === -1) {
      return null;
    }

    const pathAfterUpload = url.pathname.slice(uploadIndex + uploadMarker.length);
    const pathWithoutVersion = pathAfterUpload.replace(/^v\d+\//, "");
    const extensionIndex = pathWithoutVersion.lastIndexOf(".");

    if (extensionIndex === -1) {
      return null;
    }

    return decodeURIComponent(pathWithoutVersion.slice(0, extensionIndex));
  } catch (_error) {
    return null;
  }
};

export const deleteCloudinaryImage = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary image delete failed:", error);
  }
};
