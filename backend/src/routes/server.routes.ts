import { Role } from "@prisma/client";
import { Router } from "express";
import { serverController } from "../controllers/server.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { uploadImage } from "../middlewares/upload";
import { validateUUID } from "../middlewares/validateUUID";

const router = Router();

router.use(authenticate, authorize(Role.SERVER, Role.ADMIN));

router.get("/payment-qr", authorize(Role.SERVER), serverController.getMyPaymentQr.bind(serverController));
router.post(
  "/payment-qr",
  authorize(Role.SERVER),
  uploadImage,
  serverController.uploadMyPaymentQr.bind(serverController),
);
router.delete("/payment-qr", authorize(Role.SERVER), serverController.deleteMyPaymentQr.bind(serverController));
router.get("/orders/ready", serverController.getReadyOrders.bind(serverController));
router.get("/orders/in-progress", serverController.getInProgressOrders.bind(serverController));
router.patch("/orders/:orderId/claim", validateUUID("orderId"), serverController.claimDelivery.bind(serverController));
router.patch("/orders/:orderId/release", validateUUID("orderId"), serverController.releaseDelivery.bind(serverController));
router.patch("/orders/:orderId/deliver", validateUUID("orderId"), serverController.markDelivered.bind(serverController));
router.patch(
  "/orders/:orderId/items/:itemId/serve",
  validateUUID(["orderId", "itemId"]),
  serverController.markItemServed.bind(serverController),
);
router.patch("/orders/:orderId/notes", validateUUID("orderId"), serverController.updateOrderNotes.bind(serverController));
router.get("/assistance", serverController.getAssistanceRequests.bind(serverController));
router.patch(
  "/assistance/:requestId/resolve",
  validateUUID("requestId"),
  serverController.resolveAssistanceRequest.bind(serverController),
);
router.get("/sessions/:sessionId/bill", validateUUID("sessionId"), serverController.getSessionBillSummary.bind(serverController));
router.post("/assignment/:requestId/accept", validateUUID("requestId"), serverController.acceptWaiterAssignment.bind(serverController));
router.get("/my-tables", serverController.getMyTables.bind(serverController));
router.get("/assignment-requests", serverController.getAssignmentRequests.bind(serverController));

export default router;
