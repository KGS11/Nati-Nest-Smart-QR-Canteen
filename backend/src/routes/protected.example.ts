import { Role } from "@prisma/client";
import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = Router();

router.get("/admin-only", authenticate, authorize(Role.ADMIN), (request, response) => {
  response.json({ message: "Admin area", user: request.user });
});

router.get("/kitchen", authenticate, authorize(Role.KITCHEN), (request, response) => {
  response.json({ message: "Kitchen area", user: request.user });
});

router.get("/server", authenticate, authorize(Role.SERVER), (request, response) => {
  response.json({ message: "Server area", user: request.user });
});

router.get(
  "/admin-or-server",
  authenticate,
  authorize(Role.ADMIN, Role.SERVER),
  (request, response) => {
    response.json({ message: "Admin or server area", user: request.user });
  },
);

export default router;
