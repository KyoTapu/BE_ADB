import { Router } from "express";
import { createBooking, updateStatus } from "./booking.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";

const bookingRouter = Router();


bookingRouter.post("/", authenticate, createBooking);

bookingRouter.patch("/:id/status", authenticate, authorize('staff', 'admin'), updateStatus);

export default bookingRouter;