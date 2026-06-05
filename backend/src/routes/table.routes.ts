import { Role } from "@prisma/client";
import { Router } from "express";
import { tableController } from "../controllers/table.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import {
  createTableSchema,
  updateTableSchema,
  updateTableStatusSchema,
  validateTableRequest,
} from "../validators/table.validator";

const router = Router();
const adminOnly = [authenticate, authorize(Role.ADMIN)];

// ── Public route — no auth required ─────────────────────────────────────────
// Used by frontend to resolve tableNumber → tableId after QR scan.
router.get("/by-number/:tableNumber", tableController.getTableByNumber.bind(tableController));

router.get("/", adminOnly, tableController.getAllTables.bind(tableController));
router.get("/:id", adminOnly, tableController.getTableById.bind(tableController));
router.post(
  "/",
  adminOnly,
  validateTableRequest(createTableSchema),
  tableController.createTable.bind(tableController),
);
router.put(
  "/:id",
  adminOnly,
  validateTableRequest(updateTableSchema),
  tableController.updateTable.bind(tableController),
);
router.patch("/:id/qr", adminOnly, tableController.regenerateQRCode.bind(tableController));
router.patch(
  "/:id/status",
  adminOnly,
  validateTableRequest(updateTableStatusSchema),
  tableController.updateTableStatus.bind(tableController),
);
router.delete("/:id", adminOnly, tableController.deleteTable.bind(tableController));

export default router;
