import { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../config/cloudinary";
import { AppError } from "./AppError";

export const uploadImageBuffer = async (
  buffer: Buffer,
  folder = "nati-nest-canteen",
): Promise<string> => {
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
