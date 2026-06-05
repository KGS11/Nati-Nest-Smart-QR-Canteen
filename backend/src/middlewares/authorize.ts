import { Role } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

export const authorize =
  (...roles: Role[]) =>
  (request: Request, response: Response, next: NextFunction) => {
    if (!request.user || !roles.includes(request.user.role as Role)) {
      return response.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }

    return next();
  };

// Usage examples:
// router.get("/admin-only", authenticate, authorize(Role.ADMIN), handler);
// router.get("/kitchen", authenticate, authorize(Role.KITCHEN), handler);
// router.get("/staff", authenticate, authorize(Role.ADMIN, Role.SERVER), handler);
