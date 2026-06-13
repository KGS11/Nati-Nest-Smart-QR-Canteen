import { Role } from "@prisma/client";
import { Router } from "express";
import { staffController } from "../controllers/staff.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = Router();

router.use(authenticate, authorize(Role.ADMIN));

router.get("/", staffController.getAll.bind(staffController));
router.post("/", staffController.create.bind(staffController));
router.put("/:id", staffController.update.bind(staffController));
router.patch("/:id/status", staffController.updateStatus.bind(staffController));
router.patch("/:id/toggle", staffController.toggleStatus.bind(staffController));

export default router;
