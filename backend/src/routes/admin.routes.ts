import { Role } from "@prisma/client";
import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = Router();

// Secure all endpoints under ADMIN role only
router.use(authenticate, authorize(Role.ADMIN));

router.patch("/orders/:orderId/reassign-kitchen", adminController.reassignKitchen.bind(adminController));
router.patch("/orders/:orderId/reassign-waiter", adminController.reassignWaiter.bind(adminController));
router.patch("/orders/:orderId/force-unclaim-kitchen", adminController.forceUnclaimKitchen.bind(adminController));
router.patch("/orders/:orderId/force-unclaim-waiter", adminController.forceUnclaimWaiter.bind(adminController));
router.patch("/orders/:orderId/force-deliver", adminController.forceDeliver.bind(adminController));
router.get("/orders/:orderId/assignment-history", adminController.getAssignmentHistory.bind(adminController));

export default router;
