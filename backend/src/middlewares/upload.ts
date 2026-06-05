import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { AppError } from "../utils/AppError";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_request: Request, file: Express.Multer.File, callback: FileFilterCallback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new AppError("Only JPEG, PNG, and WebP images are allowed", 400));
    }

    return callback(null, true);
  },
});

export const uploadImage = upload.single("image");
