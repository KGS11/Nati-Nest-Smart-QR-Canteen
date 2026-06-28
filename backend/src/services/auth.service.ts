import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";
import { getStaffJwtSecret, staffSignOptions } from "../utils/jwt.utils";

const refreshTokenDays = 30;

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

const createOpaqueToken = () => crypto.randomBytes(48).toString("base64url");

const isPrismaDatabaseError = (error: unknown) =>
  error instanceof Prisma.PrismaClientInitializationError ||
  error instanceof Prisma.PrismaClientKnownRequestError ||
  error instanceof Prisma.PrismaClientUnknownRequestError ||
  error instanceof Prisma.PrismaClientRustPanicError ||
  error instanceof Prisma.PrismaClientValidationError;

export class AuthService {
  private createAccessToken(user: { id: string; role: string; name: string }) {
    const jwtSecret = getStaffJwtSecret();
    const expiresIn = (process.env.JWT_EXPIRES_IN ?? "15m") as SignOptions["expiresIn"];
    return jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      jwtSecret,
      { ...staffSignOptions(expiresIn), jwtid: createOpaqueToken() },
    );
  }

  private async createRefreshToken(userId: string, familyId = crypto.randomUUID()) {
    const refreshToken = createOpaqueToken();
    const expiresAt = new Date(Date.now() + refreshTokenDays * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(refreshToken),
        familyId,
        expiresAt,
      },
    });

    return refreshToken;
  }

  async login(phone: string, password: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { phone },
      });

      if (!user) {
        throw new AppError("Invalid credentials", 401);
      }

      if (!user.isActive) {
        throw new AppError("Account inactive", 401);
      }

      // Check if user is currently locked out
      if (user.lockUntil && user.lockUntil > new Date()) {
        const remainingMs = user.lockUntil.getTime() - Date.now();
        const remainingMin = Math.ceil(remainingMs / (60 * 1000));
        throw new AppError(
          `Too many failed attempts. Please try again in ${remainingMin} minute${remainingMin > 1 ? "s" : ""}.`,
          401
        );
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        const newFailedAttempts = user.failedAttempts + 1;
        let lockUntil: Date | null = null;

        if (newFailedAttempts >= 15) {
          lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        } else if (newFailedAttempts >= 10) {
          lockUntil = new Date(Date.now() + 5 * 60 * 1000);
        } else if (newFailedAttempts >= 5) {
          lockUntil = new Date(Date.now() + 1 * 60 * 1000);
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedAttempts: newFailedAttempts,
            lastFailedAttempt: new Date(),
            lockUntil,
          },
        });

        if (lockUntil) {
          const lockMin = newFailedAttempts >= 15 ? 15 : newFailedAttempts >= 10 ? 5 : 1;
          throw new AppError(
            `Too many failed attempts. Please try again in ${lockMin} minute${lockMin > 1 ? "s" : ""}.`,
            401
          );
        }

        throw new AppError("Invalid credentials", 401);
      }

      // Reset failed attempts upon successful login
      if (user.failedAttempts > 0 || user.lockUntil || user.lastFailedAttempt) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedAttempts: 0,
            lastFailedAttempt: null,
            lockUntil: null,
          },
        });
      }

      const token = this.createAccessToken(user);
      const refreshToken = await this.createRefreshToken(user.id);

      return {
        token,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async refresh(refreshToken: string) {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
      include: {
        user: {
          select: { id: true, name: true, phone: true, role: true, isActive: true },
        },
      },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt <= new Date()) {
      if (storedToken) {
        await prisma.refreshToken.updateMany({
          where: { familyId: storedToken.familyId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      throw new AppError("Invalid refresh token", 401);
    }

    if (!storedToken.user.isActive) {
      throw new AppError("Account inactive", 401);
    }

    const rotatedRefreshToken = await prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      const nextToken = createOpaqueToken();
      await tx.refreshToken.create({
        data: {
          userId: storedToken.userId,
          tokenHash: hashToken(nextToken),
          familyId: storedToken.familyId,
          expiresAt: new Date(Date.now() + refreshTokenDays * 24 * 60 * 60 * 1000),
        },
      });

      return nextToken;
    }, { timeout: 15000 });

    return {
      token: this.createAccessToken(storedToken.user),
      refreshToken: rotatedRefreshToken,
      user: {
        id: storedToken.user.id,
        name: storedToken.user.name,
        phone: storedToken.user.phone,
        role: storedToken.user.role,
      },
    };
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.updateMany({
      where: {
        tokenHash: hashToken(refreshToken),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    return { revoked: true };
  }

  async logoutAll(userId: string) {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    return { revoked: true };
  }

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }
}

export const authService = new AuthService();
