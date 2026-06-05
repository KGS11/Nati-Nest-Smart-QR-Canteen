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
}

export const authController = new AuthController();
