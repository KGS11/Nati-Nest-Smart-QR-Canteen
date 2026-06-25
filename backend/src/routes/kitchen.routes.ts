import { Role } from "@prisma/client";
import { Router } from "express";
import { kitchenController } from "../controllers/kitchen.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = Router();

router.use(authenticate, authorize(Role.KITCHEN, Role.ADMIN));

router.get("/orders", kitchenController.getActiveOrders.bind(kitchenController));
router.get("/orders/:orderId", kitchenController.getOrderDetails.bind(kitchenController));
router.patch("/orders/:orderId/accept", kitchenController.acceptOrder.bind(kitchenController));
router.patch("/orders/:orderId/accept-and-prepare", kitchenController.acceptAndPrepare.bind(kitchenController));
router.patch(
  "/orders/:orderId/preparing",
  kitchenController.startPreparing.bind(kitchenController),
);
router.patch("/orders/:orderId/ready", kitchenController.markReady.bind(kitchenController));
router.patch("/orders/:orderId/prepared", kitchenController.markPrepared.bind(kitchenController));
router.patch("/orders/:orderId/release", kitchenController.releaseOrder.bind(kitchenController));
router.patch("/orders/:orderId/reject", kitchenController.rejectOrder.bind(kitchenController));
router.patch("/orders/:orderId/items/:itemId/reject", kitchenController.rejectOrderItem.bind(kitchenController));

export default router;
