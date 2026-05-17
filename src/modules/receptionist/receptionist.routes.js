import { Router } from "express";
import { authenticate, authorize } from "../../common/auth.middleware.js";
import { receptionistController } from "./receptionist.controller.js";

const router = Router();

router.get("/bookings/lookup", authenticate, authorize("receptionist"), receptionistController.lookup);
router.get("/rooms/board", authenticate, authorize("receptionist"), receptionistController.roomBoard);
router.get("/bookings/daily", authenticate, authorize("receptionist"), receptionistController.dailyBookings);
router.patch("/bookings/:id/check-in", authenticate, authorize("receptionist"), receptionistController.checkIn);
router.patch("/bookings/:id/check-out", authenticate, authorize("receptionist"), receptionistController.checkOut);
router.patch(
  "/bookings/:id/mark-paid",
  authenticate,
  authorize("receptionist"),
  receptionistController.markPaidAtDesk,
);
router.patch(
  "/bookings/:id/no-show",
  authenticate,
  authorize("receptionist"),
  receptionistController.markNoShow,
);

export const receptionistRoute = {
  moduleName: "receptionist",
  routePath: "/api/receptionist",
  router,
};
