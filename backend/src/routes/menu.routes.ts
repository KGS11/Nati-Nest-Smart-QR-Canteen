import { Role } from "@prisma/client";
import { Router } from "express";
import { menuController } from "../controllers/menu.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { uploadImage } from "../middlewares/upload";
import { validateUUID } from "../middlewares/validateUUID";
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
router.put("/:id", adminOnly, validateUUID("id"), uploadImage, validate(updateMenuItemSchema), menuController.update.bind(menuController));
router.patch(
  "/:id/availability",
  adminOnly,
  validateUUID("id"),
  validate(updateAvailabilitySchema),
  menuController.updateAvailability.bind(menuController),
);
router.patch("/admin/items/:id/popular", adminOnly, validateUUID("id"), menuController.togglePopular.bind(menuController));
router.delete("/:id", adminOnly, validateUUID("id"), menuController.delete.bind(menuController));

export default router;
