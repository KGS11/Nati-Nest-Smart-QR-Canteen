import { NextFunction, Request, Response } from "express";
import { authService } from "../services/auth.service";

const refreshCookieName = "nati_nest_refresh";

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/api/auth",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

const parseCookieValue = (cookieHeader: string | undefined, name: string) => {
  if (!cookieHeader) return undefined;

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : undefined;
};

const getRefreshToken = (request: Request) => {
  const bodyToken = typeof request.body?.refreshToken === "string" ? request.body.refreshToken : undefined;
  return bodyToken ?? parseCookieValue(request.headers.cookie, refreshCookieName);
};

export class AuthController {
  async login(request: Request, response: Response, next: NextFunction) {
    try {
      const { phone, password } = request.body;

      if (!phone || !password) {
        return response.status(400).json({
          success: false,
          message: "Phone and password are required",
        });
      }

      const data = await authService.login(phone, password);
      response.cookie(refreshCookieName, data.refreshToken, refreshCookieOptions);

      return response.status(200).json({
        success: true,
        message: "Login successful",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async refresh(request: Request, response: Response, next: NextFunction) {
    try {
      const refreshToken = getRefreshToken(request);

      if (!refreshToken) {
        return response.status(400).json({
          success: false,
          message: "Refresh token is required",
        });
      }

      const data = await authService.refresh(refreshToken);
      response.cookie(refreshCookieName, data.refreshToken, refreshCookieOptions);

      return response.status(200).json({
        success: true,
        message: "Token refreshed",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async logout(request: Request, response: Response, next: NextFunction) {
    try {
      const refreshToken = getRefreshToken(request);

      if (!refreshToken) {
        return response.status(400).json({
          success: false,
          message: "Refresh token is required",
        });
      }

      const data = await authService.logout(refreshToken);
      response.clearCookie(refreshCookieName, {
        ...refreshCookieOptions,
        maxAge: undefined,
      });

      return response.status(200).json({
        success: true,
        message: "Logged out",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async logoutAll(request: Request, response: Response, next: NextFunction) {
    try {
      const data = await authService.logoutAll(request.user!.userId);
      response.clearCookie(refreshCookieName, {
        ...refreshCookieOptions,
        maxAge: undefined,
      });

      return response.status(200).json({
        success: true,
        message: "Logged out from all devices",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async me(request: Request, response: Response, next: NextFunction) {
    try {
      const data = await authService.me(request.user!.userId);
      return response.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const authController = new AuthController();
