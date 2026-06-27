import { Role } from "@prisma/client";
import { Router } from "express";
import { serverController } from "../controllers/server.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = Router();

router.use(authenticate, authorize(Role.SERVER, Role.ADMIN));

router.get("/orders/ready", serverController.getReadyOrders.bind(serverController));
router.get("/orders/in-progress", serverController.getInProgressOrders.bind(serverController));
router.patch("/orders/:orderId/claim", serverController.claimDelivery.bind(serverController));
router.patch("/orders/:orderId/release", serverController.releaseDelivery.bind(serverController));
router.patch("/orders/:orderId/deliver", serverController.markDelivered.bind(serverController));
router.patch("/orders/:orderId/notes", serverController.updateOrderNotes.bind(serverController));
router.get("/assistance", serverController.getAssistanceRequests.bind(serverController));
router.patch(
  "/assistance/:requestId/resolve",
  serverController.resolveAssistanceRequest.bind(serverController),
);
router.get("/sessions/:sessionId/bill", serverController.getSessionBillSummary.bind(serverController));
router.post("/assignment/:requestId/accept", serverController.acceptWaiterAssignment.bind(serverController));
router.get("/my-tables", serverController.getMyTables.bind(serverController));
router.get("/assignment-requests", serverController.getAssignmentRequests.bind(serverController));

export default router;
