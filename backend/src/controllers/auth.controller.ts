import { NextFunction, Request, Response } from "express";
import { authService } from "../services/auth.service";

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
      const { refreshToken } = request.body;

      if (!refreshToken) {
        return response.status(400).json({
          success: false,
          message: "Refresh token is required",
        });
      }

      const data = await authService.refresh(refreshToken);

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
      const { refreshToken } = request.body;

      if (!refreshToken) {
        return response.status(400).json({
          success: false,
          message: "Refresh token is required",
        });
      }

      const data = await authService.logout(refreshToken);

      return response.status(200).json({
        success: true,
        message: "Logged out",
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
