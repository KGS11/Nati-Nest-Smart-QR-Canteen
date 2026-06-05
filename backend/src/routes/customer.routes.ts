import { Router } from "express";
import { sessionController } from "../controllers/session.controller";
import { serverController } from "../controllers/server.controller";
import { authenticateSession } from "../middlewares/authenticate";
import { assistanceRequestValidator } from "../validators/order.validators";

const router = Router();

router.get("/scan/:tableId", sessionController.scanTable.bind(sessionController));
router.get(
  "/session",
  authenticateSession,
  sessionController.getSessionDetails.bind(sessionController),
);
router.get("/menu", authenticateSession, sessionController.getSessionMenu.bind(sessionController));
router.post(
  "/assistance",
  authenticateSession,
  assistanceRequestValidator,
  serverController.createAssistanceRequest.bind(serverController),
);
router.get(
  "/bill",
  authenticateSession,
  serverController.getSessionBillSummary.bind(serverController),
);

export default router;
