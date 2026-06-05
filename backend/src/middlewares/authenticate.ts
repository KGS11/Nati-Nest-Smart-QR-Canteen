import { Role, SessionStatus } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db";
import { verifySessionJWT } from "../utils/session.utils";

type JwtPayload = {
  userId: string;
  role: Role;
  name: string;
};

export const authenticate = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined;

    if (!token) {
      return response.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return response.status(500).json({
        success: false,
        message: "JWT secret is not configured",
      });
    }

    let payload: JwtPayload;

    try {
      payload = jwt.verify(token, jwtSecret) as JwtPayload;
    } catch (_error) {
      return response.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    if (!payload.userId) {
      return response.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        role: true,
        name: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return response.status(401).json({
        success: false,
        message: "Account not found or deactivated.",
      });
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

export const authenticateSession = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined;

    if (!token) {
      return response.status(401).json({
        success: false,
        message: "No session token provided.",
      });
    }

    const payload = verifySessionJWT(token);

    if (!payload) {
      return response.status(401).json({
        success: false,
        message: "Invalid or expired session.",
      });
    }

    const session = await prisma.tableSession.findUnique({
      where: { id: payload.sessionId },
      select: { id: true, status: true, tableId: true },
    });

    if (!session || session.status !== SessionStatus.ACTIVE) {
      return response.status(401).json({
        success: false,
        message: "Session has ended. Please scan QR again.",
      });
    }

    request.session = {
      sessionId: payload.sessionId,
      tableId: payload.tableId,
      tableNumber: payload.tableNumber,
    };

    return next();
  } catch (error) {
    return next(error);
  }
};

export const authenticateFeedbackSession = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined;

    if (!token) {
      return response.status(401).json({
        success: false,
        message: "No session token provided.",
      });
    }

    const payload = verifySessionJWT(token);

    if (!payload) {
      return response.status(401).json({
        success: false,
        message: "Invalid or expired session.",
      });
    }

    const session = await prisma.tableSession.findUnique({
      where: { id: payload.sessionId },
      select: { id: true, status: true, tableId: true },
    });

    if (
      !session ||
      (session.status !== SessionStatus.ACTIVE && session.status !== SessionStatus.CLOSED)
    ) {
      return response.status(401).json({
        success: false,
        message: "Session not found or invalid.",
      });
    }

    request.session = {
      sessionId: payload.sessionId,
      tableId: payload.tableId,
      tableNumber: payload.tableNumber,
    };

    return next();
  } catch (error) {
    return next(error);
  }
};
