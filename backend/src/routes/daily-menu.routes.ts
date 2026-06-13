import { Role } from "@prisma/client";
import { Router } from "express";
import { dailyMenuController } from "../controllers/daily-menu.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { addDailyMenuItemSchema, validate } from "../validators/daily-menu.validators";

const router = Router();
const adminOnly = [authenticate, authorize(Role.ADMIN)];

router.get("/today", adminOnly, dailyMenuController.getTodayMenu.bind(dailyMenuController));
router.get("/full", adminOnly, dailyMenuController.getFullMenu.bind(dailyMenuController));
router.post("/add", adminOnly, validate(addDailyMenuItemSchema), dailyMenuController.addItem.bind(dailyMenuController));
router.delete("/remove/:menuItemId", adminOnly, dailyMenuController.removeItem.bind(dailyMenuController));
router.post("/copy-yesterday", adminOnly, dailyMenuController.copyYesterday.bind(dailyMenuController));
router.get("/history/:date", adminOnly, dailyMenuController.getHistory.bind(dailyMenuController));

export default router;
