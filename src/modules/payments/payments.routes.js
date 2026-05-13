import { Router } from "express";
import { authenticate, authorize } from "../../common/auth.middleware.js";
import { paymentsController } from "./payments.controller.js";
import { paymentsModel } from "./payments.model.js";

const router = Router();

router.get("/booking/:bookingId/status", paymentsController.getBookingStatus);
router.get("/vnpay/return", paymentsController.vnpayReturn);
router.get("/vnpay/ipn", paymentsController.vnpayIpn);

router.get("/", authenticate, authorize("admin"), paymentsController.list);
router.get("/:id", authenticate, authorize("admin"), paymentsController.getById);
router.post("/", authenticate, authorize("admin"), paymentsController.create);
router.patch("/:id", authenticate, authorize("admin"), paymentsController.update);
router.delete("/:id", authenticate, authorize("admin"), paymentsController.remove);

export const paymentsRoute = {
  moduleName: paymentsModel.moduleName,
  routePath: paymentsModel.routePath,
  router,
};
