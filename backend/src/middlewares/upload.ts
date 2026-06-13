import { NextFunction, Request, Response } from "express";
import multer, { FileFilterCallback } from "multer";
import { AppError } from "../utils/AppError";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const detectImageMime = (buffer: Buffer) => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
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
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
};

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

export const uploadImage = (request: Request, response: Response, next: NextFunction) => {
  upload.single("image")(request, response, (error) => {
    if (error) {
      return next(error);
    }

    if (!request.file) {
      return next();
    }

    const detectedMime = detectImageMime(request.file.buffer);

    if (!detectedMime || !allowedMimeTypes.has(detectedMime)) {
      return next(new AppError("Invalid image file content", 400));
    }

    if (detectedMime !== request.file.mimetype) {
      return next(new AppError("Image content does not match declared file type", 400));
    }

    return next();
  });
};
