import { Router } from "express";
import { authenticate, authorize } from "../../common/auth.middleware.js";
import { bookingsController } from "./bookings.controller.js";
import { bookingsModel } from "./bookings.model.js";

const router = Router();
router.get("/history/me", authenticate, bookingsController.myHistory);
router.get("/history/admin", authenticate, authorize("admin"), bookingsController.adminHistory);
router.get("/", bookingsController.list);
router.get("/:id", bookingsController.getById);
router.post("/", authenticate, bookingsController.create);
router.patch("/:id", bookingsController.update);
router.delete("/:id", bookingsController.remove);

export const bookingRoutes = [
  {
    moduleName: bookingsModel.moduleName,
    routePath: bookingsModel.routePath,
    router,
  },
  {
    moduleName: "legacy-booking",
    routePath: "/api/booking",
    router,
  },
];
