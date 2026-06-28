import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/authenticate";
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  validateAuthBody,
} from "../validators/auth.validators";

const router = Router();

router.post("/login", validateAuthBody(loginSchema), authController.login.bind(authController));
router.post("/refresh", validateAuthBody(refreshSchema), authController.refresh.bind(authController));
router.post("/logout", validateAuthBody(logoutSchema), authController.logout.bind(authController));
router.post("/logout-all", authenticate, authController.logoutAll.bind(authController));
router.get("/me", authenticate, authController.me.bind(authController));

export default router;
