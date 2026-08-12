import { Role } from "@prisma/client";
import { Router } from "express";
import { kitchenController } from "../controllers/kitchen.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validateUUID } from "../middlewares/validateUUID";

const router = Router();

router.use(authenticate, authorize(Role.KITCHEN, Role.ADMIN));

router.get("/orders", kitchenController.getActiveOrders.bind(kitchenController));
router.get("/orders/:orderId", validateUUID("orderId"), kitchenController.getOrderDetails.bind(kitchenController));
router.patch("/orders/:orderId/accept", validateUUID("orderId"), kitchenController.acceptOrder.bind(kitchenController));
router.patch("/orders/:orderId/accept-and-prepare", validateUUID("orderId"), kitchenController.acceptAndPrepare.bind(kitchenController));
router.patch(
  "/orders/:orderId/preparing",
  validateUUID("orderId"),
  kitchenController.startPreparing.bind(kitchenController),
);
router.patch("/orders/:orderId/ready", validateUUID("orderId"), kitchenController.markReady.bind(kitchenController));
router.patch("/orders/:orderId/prepared", validateUUID("orderId"), kitchenController.markPrepared.bind(kitchenController));
router.patch("/orders/:orderId/release", validateUUID("orderId"), kitchenController.releaseOrder.bind(kitchenController));
router.patch("/orders/:orderId/reject", validateUUID("orderId"), kitchenController.rejectOrder.bind(kitchenController));
router.patch(
  "/orders/:orderId/items/:itemId/prepare",
  validateUUID(["orderId", "itemId"]),
  kitchenController.markItemPrepared.bind(kitchenController),
);
router.patch(
  "/orders/:orderId/items/:itemId/reject",
  validateUUID(["orderId", "itemId"]),
  kitchenController.rejectOrderItem.bind(kitchenController),
);

export default router;
