import { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../config/cloudinary";
import { AppError } from "./AppError";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const uploadImageBuffer = async (
  buffer: Buffer,
  folder = "nati-nest-canteen",
): Promise<string> => {
  const isCloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name" &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== "your_api_key";

  if (!isCloudinaryConfigured) {
    try {
      const uploadsDir = path.join(__dirname, "../../uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `${crypto.randomUUID()}.png`;
      const filepath = path.join(uploadsDir, filename);
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
