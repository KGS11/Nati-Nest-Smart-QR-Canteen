import { Role } from "@prisma/client";
import { Router } from "express";
import { settingsController } from "../controllers/settings.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { uploadImage } from "../middlewares/upload";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize(Role.ADMIN),
  settingsController.getAdminSettings.bind(settingsController),
);
router.put(
  "/",
  authenticate,
  authorize(Role.ADMIN),
  settingsController.updateAdminSettings.bind(settingsController),
);
router.get("/upi-qr", settingsController.getUpiQr.bind(settingsController));
router.post(
  "/upi-qr",
  authenticate,
  authorize(Role.ADMIN),
  uploadImage,
  settingsController.uploadUpiQr.bind(settingsController),
);
router.post(
  "/logo",
  authenticate,
  authorize(Role.ADMIN),
  uploadImage,
  settingsController.uploadLogo.bind(settingsController),
);

export default router;
