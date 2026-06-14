import { Role } from "@prisma/client";
import { Router } from "express";
import { dailyMenuController } from "../controllers/daily-menu.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validateUUID } from "../middlewares/validateUUID";
import {
  addDailyMenuItemSchema,
  removeDailyMenuItemSchema,
  validate,
} from "../validators/daily-menu.validators";

const router = Router();
const adminOnly = [authenticate, authorize(Role.ADMIN)];
const staffAllowed = [authenticate, authorize(Role.ADMIN, Role.KITCHEN)];

router.get("/today", staffAllowed, dailyMenuController.getTodayMenu.bind(dailyMenuController));
router.get("/full", staffAllowed, dailyMenuController.getFullMenu.bind(dailyMenuController));
router.post("/add", staffAllowed, validate(addDailyMenuItemSchema), dailyMenuController.addItem.bind(dailyMenuController));
router.delete(
  "/remove/:menuItemId",
  staffAllowed,
  validateUUID("menuItemId"),
  validate(removeDailyMenuItemSchema),
  dailyMenuController.removeItem.bind(dailyMenuController)
);
router.get("/removed", staffAllowed, dailyMenuController.getRemoved.bind(dailyMenuController));
router.post(
  "/restore/:dailyMenuId",
  staffAllowed,
  validateUUID("dailyMenuId"),
  dailyMenuController.restore.bind(dailyMenuController)
);
router.post("/copy-yesterday", adminOnly, dailyMenuController.copyYesterday.bind(dailyMenuController));
router.get("/history/:date", adminOnly, dailyMenuController.getHistory.bind(dailyMenuController));

export default router;

