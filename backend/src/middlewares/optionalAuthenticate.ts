import { Role } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";
import { getStaffJwtSecret, staffVerifyOptions } from "../utils/jwt.utils";

type JwtPayload = {
  userId: string;
  role: Role;
  name: string;
};

export const optionalAuthenticate = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined;

    if (!token) {
      return next();
    }

    const jwtSecret = getStaffJwtSecret();
    const payload = jwt.verify(token, jwtSecret, staffVerifyOptions) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, name: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError("Account not found or deactivated.", 401);
    }

    request.user = {
      userId: user.id,
      role: user.role,
      name: user.name,
    };

    return next();
  } catch (error) {
    return next(error);
  }
};
