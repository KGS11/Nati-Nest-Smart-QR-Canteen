import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";

export class AuthService {
  async login(phone: string, password: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { phone },
      });

      if (!user) {
        throw new AppError("Invalid phone number or password", 401);
      }

      if (!user.isActive) {
        throw new AppError("Account is deactivated. Contact admin.", 401);
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        throw new AppError("Invalid phone number or password", 401);
      }

      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        throw new AppError("JWT secret is not configured", 500);
      }

      const expiresIn = (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];
      const token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          name: user.name,
        },
        jwtSecret,
        { expiresIn },
      );

      return {
        token,
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
}

export const authService = new AuthService();
