import { Router } from "express";
import { createBooking, getBookingQuote, updateStatus } from "./booking.controller.js";
import { authenticate, authorize } from "../../../common/auth.middleware.js";

const bookingRouter = Router();

bookingRouter.post("/quote", getBookingQuote);

bookingRouter.post("/", authenticate, createBooking);

bookingRouter.patch("/:id/status", authenticate, authorize('staff', 'admin'), updateStatus);

export default bookingRouter;
