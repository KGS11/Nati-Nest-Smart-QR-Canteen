import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { User } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";
import { getStaffJwtSecret, staffSignOptions } from "../utils/jwt.utils";

const REFRESH_TOKEN_EXPIRATION_DAYS = 30;

export class AuthService {
  private hashToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  }

  private createAccessToken(user: { id: string; role: string; name: string }): string {
    const secret = getStaffJwtSecret();
    const expiresIn = (process.env.JWT_EXPIRES_IN ?? "15m") as SignOptions["expiresIn"];
    return jwt.sign(
      {
        userId: user.id,
        role: user.role,
        name: user.name,
      },
      secret,
      staffSignOptions(expiresIn)
    );
  }

  private async createRefreshToken(userId: string, familyId?: string): Promise<string> {
    const rawToken = crypto.randomBytes(40).toString("hex");
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        familyId: familyId ?? crypto.randomUUID(),
        expiresAt,
      },
    });

    return rawToken;
  }

  async login(phone: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    if (!user.isActive) {
      throw new AppError("Account inactive", 401);
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMs = user.lockUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / (60 * 1000));

      throw new AppError(
        `Too many failed attempts. Please try again in ${remainingMin} minute${remainingMin > 1 ? "s" : ""}.`,
        401
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

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
        const lockMin =
          newFailedAttempts >= 15
            ? 15
            : newFailedAttempts >= 10
            ? 5
            : 1;

        throw new AppError(
          `Too many failed attempts. Please try again in ${lockMin} minute${lockMin > 1 ? "s" : ""}.`,
          401
        );
      }

      throw new AppError("Invalid credentials", 401);
    }

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
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw new AppError("Invalid refresh token", 401);
    }

    if (storedToken.revokedAt) {
      // Security measure: revoke all tokens in family on reuse detection
      await prisma.refreshToken.updateMany({
        where: { familyId: storedToken.familyId },
        data: { revokedAt: new Date() },
      });
      throw new AppError("Refresh token revoked", 401);
    }

    if (storedToken.expiresAt < new Date()) {
      throw new AppError("Refresh token expired", 401);
    }

    if (!storedToken.user.isActive) {
      throw new AppError("Account inactive", 401);
    }

    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Create new token pair in the same family
    const newToken = this.createAccessToken(storedToken.user);
    const newRefreshToken = await this.createRefreshToken(
      storedToken.userId,
      storedToken.familyId
    );

    return {
      token: newToken,
      refreshToken: newRefreshToken,
      user: {
        id: storedToken.user.id,
        name: storedToken.user.name,
        phone: storedToken.user.phone,
        role: storedToken.user.role,
      },
    };
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (storedToken) {
      await prisma.refreshToken.updateMany({
        where: { familyId: storedToken.familyId },
        data: { revokedAt: new Date() },
      });
    }

    return { success: true };
  }

  async logoutAll(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { success: true };
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
        createdAt: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError("User not found or inactive", 404);
    }

    return user;
  }
}

export const authService = new AuthService();
