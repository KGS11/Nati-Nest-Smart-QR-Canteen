import { Role } from "@prisma/client";
import { Router } from "express";
import { menuController } from "../controllers/menu.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { uploadImage } from "../middlewares/upload";
import {
  createMenuItemSchema,
  updateAvailabilitySchema,
  updateMenuItemSchema,
  validate,
} from "../validators/menu.validators";

const router = Router();
const adminOnly = [authenticate, authorize(Role.ADMIN)];

router.post("/", adminOnly, uploadImage, validate(createMenuItemSchema), menuController.create.bind(menuController));
router.get("/", menuController.getAll.bind(menuController));
router.put("/:id", adminOnly, uploadImage, validate(updateMenuItemSchema), menuController.update.bind(menuController));
router.patch(
  "/:id/availability",
  adminOnly,
  validate(updateAvailabilitySchema),
  menuController.updateAvailability.bind(menuController),
);
router.delete("/:id", adminOnly, menuController.delete.bind(menuController));

export default router;
